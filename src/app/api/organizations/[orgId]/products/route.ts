import { NextRequest } from 'next/server';
import { listerProduits } from '@/lib/kernel-catalog';
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

  // Le noyau rend la liste entière : page et size ne s'appliquent plus.
  void page; void size;
  const result = await listerProduits(orgId, { status, familyCode }, { 'X-Organization-Id': orgId });

  // Plus de produits de démonstration : ils masquaient la panne du catalogue (deux mois de produits
  // fictifs en vitrine, commandables). Une erreur se voit comme telle, un catalogue vide aussi.
  if (!result.success) {
    console.error(`[PRODUITS] Catalogue de l'organisation ${orgId} indisponible :`, result.message);
    return Response.json({ ...result, data: [] }, { status: 502 });
  }

  return Response.json(result);
}
