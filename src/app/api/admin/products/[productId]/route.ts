import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getKernelBase, getKernelBaseHeaders } from '@/lib/kernel-auth';

async function updateProduct(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;
  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  const { productId } = await params;

  try {
    const body = await request.json();
    const organizationId = body.organizationId;

    if (!organizationId) {
      return Response.json({ success: false, message: 'organizationId manquant.' }, { status: 400 });
    }

    // Récupérer le SKU existant si non fourni (champ obligatoire pour le backend)
    let sku = body.sku;
    if (!sku) {
      try {
        const getRes = await fetch(`${getKernelBase()}/api/products/${productId}`, {
          headers: {
            ...getKernelBaseHeaders(),
            'Authorization': `Bearer ${adminToken}`,
            'X-Organization-Id': organizationId,
          },
          cache: 'no-store',
        });
        if (getRes.ok) {
          const getJson = await getRes.json();
          sku = getJson?.data?.sku || getJson?.sku;
        }
      } catch { /* continue */ }
      if (!sku) sku = `SKU-${productId.slice(0, 8)}`;
    }

    // Champs supportés par le backend Kernel (wholesalePrice et variants ne sont pas dans le modèle)
    const payload: Record<string, any> = {
      organizationId,
      sku,
      name:         body.name,
      description:  body.description ?? '',
      variantLabel: body.variantLabel ?? 'Standard',
      unitPrice:    parseFloat(body.retailPrice ?? body.unitPrice) || 1,
      quantity:     typeof body.quantity === 'number' ? body.quantity : parseInt(body.quantity, 10) || 0,
      currency:     body.currency ?? 'FCFA',
      familyCode:   body.familyCode ?? body.categoryCode ?? 'STANDARD',
      categoryCode: body.categoryCode ?? body.familyCode ?? null,
      photo:        body.photo ?? body.imageUrl ?? '',
      status:       body.status ?? 'ACTIVE',
    };

    const BACKEND = getKernelBase();
    const headers: Record<string, string> = {
      ...getKernelBaseHeaders(),
      'Authorization': `Bearer ${adminToken}`,
      'X-Organization-Id': organizationId,
    };

    // Essayer PATCH (standard REST), fallback PUT si 405
    let backendRes = await fetch(`${BACKEND}/api/products/${productId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (backendRes.status === 405) {
      backendRes = await fetch(`${BACKEND}/api/products/${productId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
    }

    const result = await backendRes.json().catch(() => ({ success: false, message: 'Réponse invalide du backend' }));

    console.log('[ADMIN UPDATE PRODUCT] productId:', productId, '| HTTP:', backendRes.status);
    if (!backendRes.ok) {
      console.error('[ADMIN UPDATE PRODUCT] Error:', JSON.stringify(result).slice(0, 400));
    }

    if (!backendRes.ok) {
      return Response.json({
        success: false,
        message: result?.message || `Erreur backend (${backendRes.status})`,
        detail: result,
      }, { status: backendRes.status });
    }

    return Response.json(result);
  } catch (error: any) {
    console.error('[ADMIN UPDATE PRODUCT] Exception:', error);
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}

export const PUT   = updateProduct;
export const PATCH = updateProduct;

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;
  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  const { productId } = await params;

  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || undefined;

    const backendRes = await fetch(`${getKernelBase()}/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        ...getKernelBaseHeaders(),
        'Authorization': `Bearer ${adminToken}`,
        ...(organizationId ? { 'X-Organization-Id': organizationId } : {}),
      },
      cache: 'no-store',
    });

    const result = await backendRes.json().catch(() => ({ success: backendRes.ok }));
    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
