import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

/**
 * GET /api/organizations/[orgId]/stock
 * Retourne le stock (mouvements consolidés) pour une organisation.
 * On interroge les entrepôts + mouvements du kernel.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const warehouseId = searchParams.get('warehouseId') || undefined;

  // Récupérer les mouvements de stock pour l'organisation
  const result = await backendFetch('/api/inventory/stock', {
    method: 'GET',
    params: { organizationId: orgId, warehouseId },
  });

  return Response.json(result);
}
