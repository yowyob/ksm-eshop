import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';

/**
 * GET /api/organizations/my
 * Retourne la liste des organisations appartenant à l'utilisateur connecté depuis le kernel.
 * Normalise le champ `name` depuis displayName > shortName > longName > code
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || undefined;
  const size = searchParams.get('size') || undefined;

  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;

  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé. Veuillez vous connecter.' }, { status: 401 });
  }

  const result = await backendFetch('/api/organizations/my', {
    method: 'GET',
    params: { page, size },
    headers: { 'Authorization': `Bearer ${adminToken}` }
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

  // En cas d'erreur 401 du kernel, renvoyer un statut 401 pour forcer la déconnexion
  if (!result.success && (result.errorCode === '401' || result.message === 'Unauthorized' || result.message === 'Non autorisé.')) {
    return Response.json(result, { status: 401 });
  }

  // En cas d'autre erreur
  return Response.json(result);
}
