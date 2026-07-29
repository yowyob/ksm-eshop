import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { getSuspendedOrgs } from '@/lib/suspended-orgs';

/**
 * GET /api/organizations
 * Retourne la liste de toutes les organisations depuis le kernel.
 * Normalise le champ `name` depuis displayName > shortName > longName > code
 * Filtre les organisations suspendues (sauf si ?includeAll=true pour les admins)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || undefined;
  const size = searchParams.get('size') || undefined;
  const includeAll = searchParams.get('includeAll') === 'true'; // admin only

  const result = await backendFetch('/api/organizations', {
    method: 'GET',
    params: { page, size },
  });

  // Normaliser les organisations pour que le champ `name` soit toujours présent
  if (result.success && result.data) {
    const raw = result.data;
    let orgs: any[] = [];

    if (Array.isArray(raw)) orgs = raw;
    else if (raw?.content && Array.isArray(raw.content)) orgs = raw.content;
    else if (raw?.data && Array.isArray(raw.data)) orgs = raw.data;
    else if (raw && typeof raw === 'object' && raw.id) orgs = [raw];

    // Charger les orgs suspendues
    const suspendedMap = getSuspendedOrgs();

    const normalized = orgs.map((org: any) => {
      // Décoder le plan d'abonnement depuis les keywords (par défaut 'free')
      let planId = 'free';
      if (org.keywords && Array.isArray(org.keywords)) {
        const foundPlan = org.keywords.find((k: string) => k.startsWith('plan_'));
        if (foundPlan) planId = foundPlan.replace('plan_', '');
      }

      return {
        ...org,
        name: org.displayName || org.shortName || org.longName || org.legalName || org.code || org.id,
        description: org.description || null,
        _suspended: suspendedMap[org.id] === true,
        subscriptionPlan: planId, // Propager le type d'abonnement
      };
    });

    // Pour les clients (pas d'admin), on filtre les orgs suspendues
    const filtered = includeAll ? normalized : normalized.filter((o: any) => !o._suspended);

    return Response.json({ ...result, data: filtered });
  }

  // En cas d'erreur ou d'absence de données, renvoyer les orgs de démonstration
  const mockOrgs = [
    {
      id: 'fac51104-41e7-4760-bdf4-4abd8f0ea059',
      name: 'KSM SARL',
      displayName: 'KSM SARL',
      shortName: 'KSM SARL',
      description: 'Boutique officielle de matériel électronique et gadgets KSM.',
      logoUri: null,
      isActive: true,
    },
    {
      id: 'demo-org',
      name: 'KSM GADGETS',
      displayName: 'KSM GADGETS',
      shortName: 'KSM GADGETS',
      description: 'Découvrez notre gamme de montres connectées et casques audio.',
      logoUri: null,
      isActive: true,
    },
    {
      id: 'o2',
      name: 'KSM FASHION',
      displayName: 'KSM FASHION',
      shortName: 'KSM FASHION',
      description: 'Prêt-à-porter et sneakers tendances pour toute la famille.',
      logoUri: null,
      isActive: true,
    }
  ];

  return Response.json({
    success: true,
    data: mockOrgs
  });
}
