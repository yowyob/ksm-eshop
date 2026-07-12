import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { isOrgSuspended } from '@/lib/suspended-orgs';

/**
 * GET /api/organizations/[orgId]/products
 * Retourne les produits d'une organisation spécifique.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  // Si l'organisation est suspendue, on ne retourne pas ses produits
  if (isOrgSuspended(orgId)) {
    return Response.json({
      success: true,
      data: []
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || undefined;
  const familyCode = searchParams.get('familyCode') || undefined;
  const page = searchParams.get('page') || undefined;
  const size = searchParams.get('size') || undefined;

  const result = await backendFetch('/api/products', {
    method: 'GET',
    params: { organizationId: orgId, status, familyCode, page, size },
    headers: { 'X-Organization-Id': orgId }
  });

  return Response.json(result);
}
