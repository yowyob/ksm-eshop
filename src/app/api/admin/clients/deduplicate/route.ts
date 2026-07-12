import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';
import { getKernelToken } from '@/lib/kernel-auth';

/**
 * POST /api/admin/clients/deduplicate
 * Supprime les doublons de clients (tiers) dans le kernel pour une organisation donnée.
 * Garde uniquement le premier tiers trouvé par partyId/email, supprime les autres.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;

  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const organizationId = body.organizationId || process.env.DEFAULT_ORGANIZATION_ID || 'o1';

    const kernelToken = await getKernelToken();
    const authHeaders = {
      Authorization: `Bearer ${kernelToken}`,
      'X-Organization-Id': organizationId,
    };

    // 1. Récupérer tous les tiers de l'organisation
    const listRes = await backendFetch(`/api/third-parties?organizationId=${organizationId}&size=1000`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!listRes.success || !listRes.data) {
      return Response.json({ success: false, message: 'Impossible de récupérer la liste des tiers.' });
    }

    const allClients: any[] = Array.isArray(listRes.data)
      ? listRes.data
      : listRes.data.content || listRes.data.data || [];

    // 2. Détecter les doublons par partyId et par email/code
    const seenPartyIds = new Map<string, string>(); // partyId -> premier id kernel
    const seenEmails = new Map<string, string>();   // email/code -> premier id kernel
    const toDelete: string[] = [];
    const kept: any[] = [];

    for (const client of allClients) {
      const partyId = client.partyId;
      const email = (client.email || client.code || '').toLowerCase().trim();
      const kernelId = client.id;

      let isDuplicate = false;

      if (partyId && seenPartyIds.has(partyId)) {
        console.log(`[DEDUP] Doublon partyId=${partyId}, suppression de id=${kernelId}`);
        isDuplicate = true;
      } else if (email && email.length > 0 && seenEmails.has(email)) {
        console.log(`[DEDUP] Doublon email=${email}, suppression de id=${kernelId}`);
        isDuplicate = true;
      }

      if (isDuplicate) {
        toDelete.push(kernelId);
      } else {
        if (partyId) seenPartyIds.set(partyId, kernelId);
        if (email) seenEmails.set(email, kernelId);
        kept.push(client);
      }
    }

    // 3. Supprimer les doublons
    const deleteResults: { id: string; success: boolean; error?: string }[] = [];
    for (const id of toDelete) {
      try {
        const delRes = await backendFetch(`/api/third-parties/${id}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
        deleteResults.push({ id, success: !!delRes.success });
      } catch (e: any) {
        deleteResults.push({ id, success: false, error: e.message });
      }
    }

    const deletedCount = deleteResults.filter(r => r.success).length;
    const failedCount = deleteResults.filter(r => !r.success).length;

    return Response.json({
      success: true,
      message: `${toDelete.length} doublon(s) détecté(s). ${deletedCount} supprimé(s), ${failedCount} échec(s).`,
      totalClients: allClients.length,
      keptClients: kept.length,
      duplicatesFound: toDelete.length,
      deletedCount,
      failedCount,
      details: deleteResults,
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
