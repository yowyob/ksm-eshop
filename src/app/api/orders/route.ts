import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { getKernelToken } from '@/lib/kernel-auth';

/**
 * Résout les noms des clients à partir d'une liste d'IDs third-party.
 * Recherche dans chaque organisation fournie et retourne un map { tpId -> name }.
 */
async function resolveNamesAcrossOrgs(
  thirdPartyIds: string[],
  orgIds: string[],
  adminToken: string
): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(thirdPartyIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const map: Record<string, string> = {};

  // Pour chaque org, on récupère tous les tiers et on les mappe par id
  await Promise.allSettled(
    orgIds.map(async (orgId) => {
      try {
        const res = await backendFetch(`/api/third-parties?organizationId=${orgId}&size=1000`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'X-Organization-Id': orgId,
          },
        });
        if (res.success && res.data) {
          const list: any[] = Array.isArray(res.data)
            ? res.data
            : res.data.content || res.data.data || [];
          for (const tp of list) {
            const name = tp.name || tp.displayName || tp.longName || tp.code || null;
            if (name) {
              if (tp.id) map[tp.id] = name;
              if (tp.partyId) map[tp.partyId] = name;
            }
          }
        }
      } catch (e) {
        // ignore per-org errors
      }
    })
  );

  return map;
}

/**
 * Cherche dans toutes les orgs les tiers correspondant à un customerId (partyId utilisateur).
 * Retourne un Set de tous les IDs kernel (tiers) associés à cet utilisateur.
 */
async function findThirdPartyIdsByPartyId(
  customerId: string,
  orgIds: string[],
  adminToken: string
): Promise<Set<string>> {
  const matched = new Set<string>([customerId]);

  await Promise.allSettled(
    orgIds.map(async (orgId) => {
      try {
        const res = await backendFetch(`/api/third-parties?organizationId=${orgId}&size=1000`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'X-Organization-Id': orgId,
          },
        });
        if (res.success && res.data) {
          const list: any[] = Array.isArray(res.data)
            ? res.data
            : res.data.content || res.data.data || [];
          for (const tp of list) {
            if (tp.partyId === customerId || tp.id === customerId) {
              if (tp.id) matched.add(tp.id);
              if (tp.partyId) matched.add(tp.partyId);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    })
  );

  return matched;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');
  const customerId = searchParams.get('customerId');

  try {
    const adminToken = await getKernelToken();

    // Déterminer la liste des orgs à interroger
    let orgIds: string[] = [];
    if (organizationId) {
      orgIds = [organizationId];
    } else {
      try {
        const orgsRes = await backendFetch('/api/organizations', {
          method: 'GET',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (orgsRes.success && orgsRes.data) {
          const orgList = Array.isArray(orgsRes.data)
            ? orgsRes.data
            : orgsRes.data.content || orgsRes.data.data || [];
          orgIds = orgList.map((o: any) => o.id).filter(Boolean);
        }
      } catch (e) {
        console.warn('[Orders API] Could not fetch organizations list');
      }
      if (orgIds.length === 0) {
        orgIds = [process.env.DEFAULT_ORGANIZATION_ID || 'o1'];
      }
    }

    // 1. Récupérer les commandes de toutes les orgs en parallèle
    let allOrders: any[] = [];
    await Promise.allSettled(
      orgIds.map(async (orgId) => {
        try {
          const result = await backendFetch('/api/sales/orders', {
            method: 'GET',
            params: { organizationId: orgId },
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'X-Organization-Id': orgId,
            },
          });
          if (result.success && result.data) {
            const orders = Array.isArray(result.data)
              ? result.data
              : result.data.content || result.data.data || [];
            // Tagger chaque commande avec son orgId pour retrouver le tiers plus tard
            for (const o of orders) {
              allOrders.push({ ...o, _orgId: o.organizationId || orgId });
            }
          }
        } catch (e) {
          console.warn(`[Orders API] Failed to fetch orders for org ${orgId}`);
        }
      })
    );

    // Dédupliquer par id
    allOrders = allOrders.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i
    );

    // 2. Résoudre les noms dans TOUTES les orgs (pas juste la première)
    const tpIds = allOrders
      .map((o: any) => o.customerThirdPartyId || o.counterpartyThirdPartyId)
      .filter(Boolean);

    const namesMap = await resolveNamesAcrossOrgs(tpIds, orgIds, adminToken);

    // 3. Enrichir chaque commande avec le vrai nom du client
    allOrders = allOrders.map((o: any) => {
      const tpId = o.customerThirdPartyId || o.counterpartyThirdPartyId;
      const resolvedName = tpId ? (namesMap[tpId] || null) : null;
      return {
        ...o,
        _customerName:
          resolvedName ||
          o.counterparty?.name ||
          o.counterparty?.displayName ||
          o.customerName ||
          'Client',
      };
    });

    // 3b. Résoudre les noms des produits pour les lignes de commande
    // Rassembler tous les productIds de toutes les commandes récupérées
    const productIds: string[] = [];
    allOrders.forEach((o: any) => {
      const lines = o.lines || [];
      lines.forEach((line: any) => {
        if (line.productId) productIds.push(line.productId);
      });
    });

    const uniqueProductIds = [...new Set(productIds)];
    const productsMap: Record<string, string> = {};

    if (uniqueProductIds.length > 0) {
      // Charger la liste complète des produits des organisations concernées
      // pour faire une correspondance rapide des noms locaux
      await Promise.allSettled(
        orgIds.map(async (orgId) => {
          try {
            const pRes = await backendFetch(`/api/products?organizationId=${orgId}&size=1000`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${adminToken}`,
                'X-Organization-Id': orgId
              }
            });
            if (pRes.success && pRes.data) {
              const list = Array.isArray(pRes.data) ? pRes.data : (pRes.data.content || pRes.data.data || []);
              list.forEach((p: any) => {
                if (p.id) productsMap[p.id] = p.name;
              });
            }
          } catch (e) {
            // ignore
          }
        })
      );
    }

    // Injecter les noms résolus de produits et les options dans chaque ligne de commande
    allOrders = allOrders.map((o: any) => {
      const lines = o.lines || [];
      const enrichedLines = lines.map((line: any) => {
        // Résoudre le nom d'affichage à partir du map
        const prodName = productsMap[line.productId] || `Produit (${line.productId.slice(0, 8)})`;
        
        // Si l'identifiant possède un suffixe de variante (ex: ID-Option), le décoder pour l'affichage des options
        let selectedOptions: Record<string, string> = {};
        
        return {
          ...line,
          name: prodName,
          selectedOptions: selectedOptions
        };
      });

      return {
        ...o,
        lines: enrichedLines
      };
    });

    // 4. Si customerId fourni, filtrer par correspondance cross-org partyId
    if (customerId) {
      const allCustomerIds = await findThirdPartyIdsByPartyId(customerId, orgIds, adminToken);

      const filtered = allOrders.filter(
        (o: any) =>
          allCustomerIds.has(o.customerThirdPartyId) ||
          allCustomerIds.has(o.counterpartyThirdPartyId) ||
          allCustomerIds.has(o.counterparty?.id) ||
          allCustomerIds.has(o.customerId)
      );

      console.log(`[Orders API] Customer ${customerId} -> matchedTpIds: ${[...allCustomerIds].join(', ')} -> ${filtered.length} commandes`);

      return Response.json({
        success: true,
        data: filtered,
        totalElements: filtered.length,
      });
    }

    return Response.json({
      success: true,
      data: allOrders,
      totalElements: allOrders.length,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.organizationId) {
      body.organizationId =
        process.env.DEFAULT_ORGANIZATION_ID || 'o1';
    }
    if (!body.agencyId) {
      body.agencyId = process.env.DEFAULT_AGENCY_ID || 'wh1_2';
    }

    const result = await backendFetch('/api/sales/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Invalid JSON request body.',
        errorCode: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }
}
