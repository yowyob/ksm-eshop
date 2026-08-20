import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { toLedgerMovementType, ShopMovementType } from '@/lib/stock-mapping';

/**
 * Les mouvements de stock, tenus par `stock-core`.
 *
 * Le grand-livre est en écriture seule : un mouvement enregistré a déjà bougé le stock, et une
 * correction est un nouveau mouvement, jamais une rature. C'est pourquoi la boutique n'écrit ici
 * qu'à la validation, et garde ses brouillons chez elle.
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || 'o1';
  const agencyId = searchParams.get('agencyId') || process.env.DEFAULT_AGENCY_ID || 'wh1_2';
  const productId = searchParams.get('productId') || undefined;

  if (!productId) {
    // Le grand-livre exige le produit : un historique de mouvements se lit produit par produit,
    // et le demander sans lui renverrait le journal entier d'un dépôt.
    return Response.json({ success: true, data: [] });
  }

  const result = await backendFetch('/api/stock/movements', {
    method: 'GET',
    params: { organizationId, agencyId, productId },
  });

  if (!result.success) {
    console.error('Stock movements fetch failed:', result);
    return Response.json(result, { status: 502 });
  }

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.organizationId) {
      body.organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'o1';
    }
    if (!body.agencyId) {
      body.agencyId = process.env.DEFAULT_AGENCY_ID || 'wh1_2';
    }

    // Le grand-livre n'accepte que des quantités positives : la direction est portée par la
    // nature du mouvement, non par le signe. Un ajustement négatif devient donc une sortie
    // d'ajustement, et sa quantité redevient positive.
    const shopType: ShopMovementType = body.movementType ?? body.type ?? 'ADJUSTMENT';
    const signedQuantity = Number(body.quantity ?? 0);

    const payload = {
      organizationId: body.organizationId,
      agencyId: body.agencyId,
      productId: body.productId,
      movementType: toLedgerMovementType(shopType, signedQuantity),
      quantity: Math.abs(signedQuantity),
      unitCost: body.unitCost ?? null,
      currency: body.currency ?? null,
      thirdPartyId: body.thirdPartyId ?? null,
      referenceType: body.referenceType ?? null,
      referenceId: body.referenceId ?? null,
      referenceNumber: body.referenceNumber ?? null,
    };

    const result = await backendFetch('/api/stock/movements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return Response.json(result, { status: result.success ? 201 : 502 });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Invalid JSON request body.',
        errorCode: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }
}
