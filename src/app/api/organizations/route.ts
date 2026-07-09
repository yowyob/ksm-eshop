import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

/**
 * GET /api/organizations
 * Retourne la liste de toutes les organisations depuis le kernel.
 * Normalise le champ `name` depuis displayName > shortName > longName > code
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || undefined;
  const size = searchParams.get('size') || undefined;

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

    const normalized = orgs.map((org: any) => ({
      ...org,
      // Résoudre le nom d'affichage depuis les champs du kernel
      name: org.displayName || org.shortName || org.longName || org.legalName || org.code || org.id,
      description: org.description || null,
    }));

    return Response.json({ ...result, data: normalized });
  }

  // En cas d'erreur ou d'absence de données
  return Response.json(result);
}
