import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { getKernelToken } from '@/lib/kernel-auth';

export const dynamic = 'force-dynamic';

// Cache en mémoire pour accélérer drastiquement les accès répétés
let cachedStats: any = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 1000; // Cache de 1 minute

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Retourner le cache s'il est encore valide et qu'on ne force pas le rafraîchissement
    if (cachedStats && (now - lastFetchTime < CACHE_DURATION_MS) && !forceRefresh) {
      console.log("[SUPER-STATS] Retour du cache en mémoire (valide encore", Math.round((CACHE_DURATION_MS - (now - lastFetchTime)) / 1000), "s)");
      return Response.json({
        success: true,
        data: cachedStats,
        fromCache: true
      });
    }

    console.log("[SUPER-STATS] Début de la récupération des données fraîches du Kernel...");
    const adminToken = await getKernelToken();
    const authHeader = { 
      'Authorization': `Bearer ${adminToken}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };

    // ── 1. Fetch ALL organisations from Kernel ──────────────────────────────
    const orgsRes = await backendFetch('/api/organizations?size=200', {
      method: 'GET',
      headers: authHeader,
    });

    let organizations: any[] = [];
    if (orgsRes.success && orgsRes.data) {
      organizations = Array.isArray(orgsRes.data)
        ? orgsRes.data
        : (orgsRes.data.content || orgsRes.data.data || []);
    }

    // ── 2. Pour chaque org, récupérer les commandes en parallèle ────────────
    const orgOrderResults = await Promise.allSettled(
      organizations.map(async (org: any) => {
        const orgId = org.id;
        const res = await backendFetch(
          `/api/sales/orders?organizationId=${orgId}&size=500`,
          {
            method: 'GET',
            headers: {
              ...authHeader,
              'X-Organization-Id': orgId,
            },
          }
        );

        let orders: any[] = [];
        if (res.success && res.data) {
          orders = Array.isArray(res.data)
            ? res.data
            : (res.data.content || res.data.data || []);
        }

        // Enrichir chaque commande avec le nom de l'organisation
        const orgName =
          org.displayName ||
          org.shortName ||
          org.longName ||
          org.name ||
          orgId;

        return orders.map((o: any) => ({
          ...o,
          _orgName: orgName,
          _orgId: orgId,
        }));
      })
    );

    // ── 3. Consolider et dédupliquer par ID ─────────────────────────────────
    const seenIds = new Set<string>();
    let allOrders: any[] = [];

    for (const result of orgOrderResults) {
      if (result.status === 'fulfilled') {
        for (const order of result.value) {
          const key = order.id || order.orderNumber || order.documentNumber;
          if (key && seenIds.has(key)) continue;
          if (key) seenIds.add(key);
          
          allOrders.push(order);
        }
      }
    }

    // ── 4. Calculer les statistiques ────────────────────────────────────────
    const totalTransactions = allOrders.length;

    let totalRevenue = 0;
    allOrders.forEach((order: any) => {
      let amount =
        order.grossAmount ||
        order.netAmount ||
        order.totalAmount ||
        order.total;
      if (!amount) {
        if (order.lines && Array.isArray(order.lines)) {
          amount = order.lines.reduce(
            (sub: number, line: any) =>
              sub + ((line.unitPrice || line.price || 0) * (line.quantity || 0)),
            0
          );
        } else if (order.quantity && order.unitPrice) {
          amount = order.quantity * order.unitPrice;
        }
      }
      totalRevenue += (amount || 0) * 0.05;
    });

    // ── 5. Résoudre les noms des clients directement depuis la commande (optimisé) ──
    allOrders = allOrders.map((order: any) => {
      return {
        ...order,
        _customerName:
          order.counterparty?.name ||
          order.counterparty?.displayName ||
          order.customerName ||
          order.createdBy ||
          'Client'
      };
    });

    // ── 6. Charger dynamiquement les utilisateurs/tiers depuis toutes les orgs Kernel ──
    const nameCache: Record<string, string> = {};
    const allUsersMap = new Map<string, any>();
    
    await Promise.allSettled(
      organizations.map(async (org: any) => {
        try {
          const res = await backendFetch(`/api/third-parties?organizationId=${org.id}&size=1000`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'X-Organization-Id': org.id,
            },
          });
          if (res.success && res.data) {
            const list: any[] = Array.isArray(res.data)
              ? res.data
              : res.data.content || res.data.data || [];
            
            for (const tp of list) {
              const name = tp.name || tp.displayName || tp.longName || tp.code || null;
              if (name) {
                if (tp.id) nameCache[tp.id] = name;
                if (tp.partyId) nameCache[tp.partyId] = name;
              }

              const emailKey = (tp.email || tp.primaryEmail || tp.code || tp.id || '').toLowerCase().trim();
              if (emailKey && !allUsersMap.has(emailKey)) {
                allUsersMap.set(emailKey, {
                  id: tp.id,
                  email: tp.email || tp.primaryEmail || '',
                  name: tp.name || tp.displayName || tp.code || 'Client',
                  phone: tp.phone || tp.primaryPhone || '',
                  organizationId: org.id
                });
              }
            }
          }
        } catch (_) {}
      })
    );

    const users = Array.from(allUsersMap.values());
    const totalUsers = users.length;

    // Enrichir le nom du client dans les commandes avec le cache résolu
    allOrders = allOrders.map((order: any) => {
      const tpId = order.customerThirdPartyId || order.counterpartyThirdPartyId;
      const resolvedName = tpId ? (nameCache[tpId] || null) : null;
      return {
        ...order,
        _customerName:
          resolvedName ||
          order.counterparty?.name ||
          order.counterparty?.displayName ||
          order.customerName ||
          order.createdBy ||
          'Client'
      };
    });

    // ── 7. Filtrer seulement les orgs qui ont des commandes ─────────────────
    const orgsWithOrders = organizations.filter((org: any) =>
      allOrders.some((o: any) => o._orgId === org.id)
    );

    const statsData = {
      totalTransactions,
      totalRevenue,
      totalUsers,
      totalOrganizations: organizations.length,
      orgsWithOrders: orgsWithOrders.length,
      orders: allOrders,
      organizations,
    };

    // Mettre en cache
    cachedStats = statsData;
    lastFetchTime = now;

    return Response.json({
      success: true,
      data: statsData,
      fromCache: false
    });
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
