import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { getLocalUsers } from '@/lib/local-db';
import { getKernelToken } from '@/lib/kernel-auth';

export async function GET(request: NextRequest) {
  try {
    const adminToken = await getKernelToken();
    const authHeader = { 'Authorization': `Bearer ${adminToken}` };

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
    
    // Charger les commandes locales pour avoir les dates et détails
    const { getLocalOrders } = require('@/lib/local-db');
    const localOrders = getLocalOrders();

    for (const result of orgOrderResults) {
      if (result.status === 'fulfilled') {
        for (const order of result.value) {
          const key = order.id || order.orderNumber || order.documentNumber;
          if (key && seenIds.has(key)) continue;
          if (key) seenIds.add(key);

          // Tenter de trouver la commande correspondante en local pour récupérer sa date
          const matchedLocal = localOrders.find((lo: any) => 
            lo.id === order.id || 
            lo.orderNumber === order.orderNumber || 
            lo.documentNumber === order.documentNumber
          );

          allOrders.push({
            ...order,
            createdAt: order.createdAt || matchedLocal?.createdAt || new Date().toISOString()
          });
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

    // ── 5. Résoudre les noms des clients — listing par org ─────────────────
    // On charge la liste complète des tiers pour chaque org et on construit un cache global
    const nameCache: Record<string, string> = {};

    // Orgs uniques présentes dans les commandes
    const orgIdsInOrders = [...new Set(allOrders.map((o: any) => o._orgId).filter(Boolean))];

    await Promise.allSettled(
      orgIdsInOrders.map(async (orgId: string) => {
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
                if (tp.id) nameCache[tp.id] = name;
                if (tp.partyId) nameCache[tp.partyId] = name;
              }
            }
          }
        } catch (_) {}
      })
    );

    // Injecter le vrai nom dans chaque commande
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
          null,
      };
    });

    // ── 6. Comptage des utilisateurs locaux ─────────────────────────────────
    const users = await getLocalUsers();
    const totalUsers = users.length;

    // ── 7. Filtrer seulement les orgs qui ont des commandes ─────────────────
    const orgsWithOrders = organizations.filter((org: any) =>
      allOrders.some((o: any) => o._orgId === org.id)
    );

    return Response.json({
      success: true,
      data: {
        totalTransactions,
        totalRevenue,
        totalUsers,
        totalOrganizations: organizations.length,
        orgsWithOrders: orgsWithOrders.length,
        orders: allOrders,
        organizations,
        users,
      },
    });
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
