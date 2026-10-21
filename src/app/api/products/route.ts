import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { creerProduit, listerProduits } from '@/lib/kernel-catalog';
import { getLocalReservedQuantities } from '@/lib/local-db';
import { isOrgSuspended } from '@/lib/suspended-orgs';

export const dynamic = 'force-dynamic';

/** Retire des quantités affichées ce que des paniers en cours retiennent localement. */
function deduireLesReservations(produits: any[], organizationId: string | undefined) {
  const reserved = getLocalReservedQuantities(organizationId);
  produits.forEach((p: any) => {
    if (reserved[p.id] && typeof p.quantity === 'number') {
      p.quantity = Math.max(0, p.quantity - reserved[p.id]);
      p.stock = p.quantity;
    }
  });
  return produits;
}

/**
 * Le catalogue de la vitrine.
 *
 * Il n'y a plus de produits de démonstration : servis à chaque échec du noyau ou catalogue vide, ils
 * ont masqué pendant deux mois que la boutique ne lisait plus rien (produits fictifs en vitrine, et
 * commandables). Une erreur se voit comme telle, un catalogue vide aussi.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID;
  const familyCode = searchParams.get('familyCode') || undefined;
  const status = searchParams.get('status') || undefined;

  if (!organizationId) {
    return Response.json({ success: false, message: "Aucune organisation n'est configurée pour la boutique.", data: [] },
      { status: 500 });
  }

  // Si l'organisation spécifique est suspendue, on ne retourne aucun produit
  if (organizationId !== 'ALL' && isOrgSuspended(organizationId)) {
    return Response.json({ success: true, data: [] });
  }

  if (organizationId === 'ALL') {
    const orgsResult = await backendFetch('/api/organizations', { method: 'GET' });
    if (!orgsResult.success) {
      console.error('[PRODUITS] Liste des organisations indisponible :', orgsResult.message);
      return Response.json({ ...orgsResult, data: [] }, { status: 502 });
    }
    const raw: any = orgsResult.data;
    let orgs: any[] = Array.isArray(raw) ? raw
      : Array.isArray(raw?.content) ? raw.content
      : Array.isArray(raw?.data) ? raw.data
      : raw?.id ? [raw] : [];
    // Filtrer les organisations suspendues pour ne pas afficher leurs produits
    orgs = orgs.filter((org: any) => !isOrgSuspended(org.id));

    const parOrganisation = await Promise.all(orgs.map(async (org: any) => {
      const r = await listerProduits(org.id, { familyCode, status }, { 'X-Organization-Id': org.id });
      if (!r.success) {
        console.error(`[PRODUITS] Catalogue de l'organisation ${org.id} indisponible :`, r.message);
        return [];
      }
      const nom = org.displayName || org.shortName || org.legalName || org.code || org.name || org.id;
      return deduireLesReservations((r.data ?? []).map((p) => ({ ...p, organizationId: org.id, tenantName: nom })), org.id);
    }));
    return Response.json({ success: true, data: parOrganisation.flat().filter((p: any) => p.status === 'ACTIVE') });
  }

  // La vitrine ne montre que ce qui est en vente.
  const result = await listerProduits(organizationId, { familyCode, status: 'ACTIVE' });
  if (!result.success) {
    console.error(`[PRODUITS] Catalogue de l'organisation ${organizationId} indisponible :`, result.message);
    return Response.json({ ...result, data: [] }, { status: 502 });
  }
  return Response.json({ success: true, data: deduireLesReservations(result.data ?? [], organizationId) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.organizationId) {
      body.organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'o1';
    }

    // Le modèle B (product.*) et sa projection ont disparu du noyau : la mise en vente passe par
    // l'API produit, qui crée la définition et l'offre de l'organisation en un appel.
    const result = await creerProduit(body);

    return Response.json(result);
  } catch (error: any) {
    return Response.json({
      success: false,
      message: error.message || 'Invalid JSON request body.',
      errorCode: 'BAD_REQUEST',
    }, { status: 400 });
  }
}
