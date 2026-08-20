import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

/**
 * GET /api/organizations/[orgId]/stock
 *
 * Le stock d'un dépôt, tel que le noyau le tient.
 *
 * Cette route interrogeait `/api/inventory/stock`, qui n'a jamais existé côté noyau : elle
 * répondait donc toujours en échec, sans que rien ne le signale — l'appelant recevait une réponse
 * infructueuse indistinguable d'un dépôt vide. Elle lit désormais les soldes du grand-livre.
 *
 * Le dépôt est obligatoire : un stock est toujours celui d'un produit **quelque part**. Additionner
 * les dépôts donnerait un total dont on ne peut rien faire — on ne vend pas depuis la somme de deux
 * magasins.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const agencyId =
    searchParams.get('agencyId') ||
    searchParams.get('warehouseId') ||
    process.env.DEFAULT_AGENCY_ID;

  if (!agencyId) {
    return Response.json(
      {
        success: false,
        message: 'Le dépôt est requis : un stock est toujours celui d’un produit dans un dépôt.',
        errorCode: 'AGENCY_REQUIRED',
      },
      { status: 400 }
    );
  }

  const result = await backendFetch('/api/stock/balances/agency', {
    method: 'GET',
    params: { organizationId: orgId, agencyId },
  });

  if (!result.success) {
    console.error('Organization stock fetch failed:', result);
    return Response.json(result, { status: 502 });
  }

  return Response.json(result);
}
