import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';

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

    // Construire le payload normalisé pour le kernel
    const payload: Record<string, any> = {
      name: body.name,
      description: body.description,
      unitPrice: body.unitPrice ?? body.retailPrice,
      retailPrice: body.retailPrice ?? body.unitPrice,
      wholesalePrice: body.wholesalePrice ?? 0,
      photo: body.photo ?? body.imageUrl ?? '',
      imageUrl: body.imageUrl ?? body.photo ?? '',
      currency: body.currency ?? 'FCFA',
      familyCode: body.familyCode ?? body.categoryCode ?? 'STANDARD',
      categoryCode: body.categoryCode ?? body.familyCode ?? 'STANDARD',
      quantity: typeof body.quantity === 'number' ? body.quantity : parseInt(body.quantity, 10) || 0,
      status: body.status ?? 'ACTIVE',
      sku: body.sku,
      variantLabel: body.variantLabel ?? 'Standard',
      variants: Array.isArray(body.variants) ? body.variants : [],
      organizationId,
    };

    // Essayer PATCH en premier (méthode standard REST pour mise à jour partielle)
    let result = await backendFetch(`/api/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...(organizationId ? { 'X-Organization-Id': organizationId } : {}),
      },
    });

    // Si PATCH échoue avec 405 Method Not Allowed, tenter PUT
    if (!result.success && (result.errorCode === '405' || result.errorCode === 'METHOD_NOT_ALLOWED')) {
      result = await backendFetch(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          ...(organizationId ? { 'X-Organization-Id': organizationId } : {}),
        },
      });
    }

    console.log('[ADMIN UPDATE PRODUCT] Payload sent:', JSON.stringify(payload));
    console.log('[ADMIN UPDATE PRODUCT] Result:', JSON.stringify(result));

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}

export const PUT = updateProduct;
export const PATCH = updateProduct;

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;
  const adminSessionId = cookieStore.get('adminSessionId')?.value;
  const adminSharedToken = cookieStore.get('adminSharedToken')?.value;
  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }
  
  const { productId } = await params;

  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || undefined;
    
    const result = await backendFetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        ...(organizationId ? { 'X-Organization-Id': organizationId } : {})
      }
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
