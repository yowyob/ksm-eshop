import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { modifierProduit, retirerProduit } from '@/lib/kernel-catalog';

/**
 * Modification d'un article depuis l'arrière-boutique.
 *
 * L'ancienne route /api/products/{id} (PATCH puis PUT en repli) a disparu du noyau. Le nom, la
 * description et la mise hors vente passent désormais par la définition du produit ; le prix et la
 * quantité ne se changent plus ici : le prix relève de la tarification, la quantité du stock.
 */
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

    const result = await modifierProduit(productId, body, {
      'Authorization': `Bearer ${adminToken}`,
      'X-Organization-Id': organizationId,
    });
    if (!result.success) {
      console.error('[ADMIN UPDATE PRODUCT] productId:', productId, '|', result.message);
    }
    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error('[ADMIN UPDATE PRODUCT] Exception:', error);
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}

export const PUT   = updateProduct;
export const PATCH = updateProduct;

/** Retire l'article de la vente : il reste tracé, le noyau ne supprime pas un produit. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;
  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  const { productId } = await params;
  const organizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
  try {
    const result = await retirerProduit(productId, {
      'Authorization': `Bearer ${adminToken}`,
      ...(organizationId ? { 'X-Organization-Id': organizationId } : {}),
    });
    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
