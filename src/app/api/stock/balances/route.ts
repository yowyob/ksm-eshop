import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

/**
 * Le solde de stock, tel que le noyau le tient.
 *
 * Sans produit précisé, on renvoie tous les soldes du dépôt : c'est ce dont un inventaire a besoin,
 * et le demander produit par produit ferait une requête par ligne comptée.
 *
 * Cette route remplace `/api/inventory/movements/balance`. L'écart n'est pas qu'un chemin : le
 * grand-livre tient aussi la quantité réservée et le coût moyen, que l'ancienne réponse n'avait pas.
 * La réservation est ce qui sépare « en stock » de « vendable » — sans elle, deux clients peuvent
 * acheter la même dernière pièce.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || 'o1';
  const agencyId = searchParams.get('agencyId') || process.env.DEFAULT_AGENCY_ID || 'wh1_2';
  const productId = searchParams.get('productId');

  const result = productId
    ? await backendFetch('/api/stock/balances', {
        method: 'GET',
        params: { organizationId, agencyId, productId },
      })
    : await backendFetch('/api/stock/balances/agency', {
        method: 'GET',
        params: { organizationId, agencyId },
      });

  if (!result.success) {
    // Volontairement pas de solde de repli. Un stock inventé est pire qu'un stock absent : il fait
    // vendre ce qui n'existe pas, et un inventaire comparerait le comptage à un chiffre imaginaire.
    console.error('Stock balance fetch failed:', result);
    return Response.json(result, { status: 502 });
  }

  return Response.json(result);
}
