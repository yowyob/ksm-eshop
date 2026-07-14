import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';
import { saveLocalOrder, saveLocalClient, getLocalClients } from '@/lib/local-db';
import { getKernelToken } from '@/lib/kernel-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerName, customerId } = body;

    const cookieStore = await cookies();
    const customerToken = cookieStore.get('customerToken')?.value;
    const adminToken = cookieStore.get('adminToken')?.value;
    const token = customerToken || adminToken;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Grouper les items par tenantId
    const groupedItems = items.reduce((acc: any, item: any) => {
      const t = item.tenantId || 't1';
      if (!acc[t]) acc[t] = [];
      acc[t].push(item);
      return acc;
    }, {});

    const ordersCreated = [];

    for (const [tenantId, tenantItems] of Object.entries(groupedItems)) {
      const itemsList = tenantItems as any[];
      
      const tHeaders = { ...headers, 'X-Organization-Id': tenantId };

      // 1. Créer ou retrouver le tiers commercial dans le Kernel pour cette organisation
      //    La logique métier: le client devient tiers commercial au moment du paiement.
      const adminTokenForCreation = await getKernelToken();
      const tHeadersAdmin = {
        ...tHeaders,
        'Authorization': `Bearer ${adminTokenForCreation}`
      };

      let kernelThirdPartyId: string | null = null;

      // Chercher si ce client existe déjà comme tiers dans cette organisation
      // On utilise une recherche large par nom, email, partyId, id
      const searchRes = await backendFetch(`/api/third-parties?organizationId=${tenantId}&size=1000`, {
        method: 'GET',
        headers: tHeadersAdmin
      });

      let backendClients: any[] = [];
      if (searchRes.success && searchRes.data) {
        backendClients = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data.content || searchRes.data.data || []);
      }

      // Recherche par partyId, id, email ou nom exact pour éviter les doublons
      const existingClient = backendClients.find((c: any) => {
        // Par partyId ou id (identifiant unique utilisateur)
        if (customerId && (c.partyId === customerId || c.id === customerId)) return true;
        // Par email si disponible
        if (body.customerEmail) {
          const email = body.customerEmail.toLowerCase();
          if (c.email && c.email.toLowerCase() === email) return true;
          if (c.code && c.code.toLowerCase() === email) return true;
          if (c.uniqueIdentificationNumber && c.uniqueIdentificationNumber.toLowerCase() === email) return true;
          if (c.accountingAccount && c.accountingAccount.toLowerCase() === email) return true;
        }
        return false;
      });

      if (existingClient) {
        // Client déjà enregistré comme tiers — utiliser son ID Kernel
        kernelThirdPartyId = existingClient.id || existingClient.partyId;
        console.log('[CHECKOUT] Tiers existant trouvé (pas de doublon):', kernelThirdPartyId);
      } else {
        // Créer le tiers dans l'organisation au moment de l'achat
        const clientPayload = {
          partyId: customerId,
          organizationId: tenantId,
          partyType: 'ACTOR',
          code: body.customerEmail || `C-${customerId?.substring(0, 8) || Math.floor(Math.random() * 10000)}`,
          name: customerName || 'Client Anonyme',
          displayName: customerName || 'Client Anonyme',
          longName: customerName || 'Client Anonyme',
          accountingAccount: body.customerEmail || `client-${customerId?.substring(0, 8)}`,
          uniqueIdentificationNumber: body.customerEmail || customerId,
          segment: 'CUSTOMER',
          roles: ['CUSTOMER'],
          type: 'INDIVIDUAL',
          legalForm: 'PERSON',
          thirdPartyFamily: 'CLIENTS',
          classification: 'STANDARD',
          enabled: true,
          prospect: false,
          vatSubject: false,
          authorizedPaymentMethods: ['CASH', 'BANK_TRANSFER'],
          authorizedCreditLimit: 0,
          maxDiscountRate: 0,
          operationsBalance: 0,
          openingBalance: 0,
          payTermNumber: 0,
          payTermType: 'DAYS',
        };

        const createRes = await backendFetch('/api/third-parties', {
          method: 'POST',
          headers: tHeadersAdmin,
          body: JSON.stringify(clientPayload)
        });

        if (createRes.success && createRes.data) {
          kernelThirdPartyId = createRes.data.id || createRes.data.partyId || customerId;
          console.log('[CHECKOUT] Tiers créé avec succès. ID Kernel:', kernelThirdPartyId);
          // Sauvegarder aussi localement
          saveLocalClient({ ...clientPayload, id: kernelThirdPartyId });
        } else {
          console.error('[CHECKOUT] Échec création tiers:', createRes.message, '— utilisation fallback customerId');
          // Fallback: tenter d'utiliser l'ID utilisateur directement
          kernelThirdPartyId = customerId;
          saveLocalClient({ id: customerId, name: customerName, email: body.customerEmail });
        }
      }

      // 3. Créer la commande
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const orderId = `KSM-${randomId}`;
      const total = itemsList.reduce((acc, it) => acc + (it.price * it.quantity), 0);

      const adminTokenForOrder = await getKernelToken();
      const tHeadersAuth = {
          ...tHeaders,
          'Authorization': `Bearer ${adminTokenForOrder}`
      };

      let agencyId = tenantId;
      try {
        const whRes = await backendFetch(`/api/organizations/${tenantId}/agencies`, {
          method: 'GET',
          headers: tHeadersAuth
        });
        if (whRes.success && whRes.data) {
           const whList = Array.isArray(whRes.data) ? whRes.data : (whRes.data.content || []);
           if (whList.length > 0) {
             // Find a valid agency (preferably code HQ or AG-KSM-01 or just the first one)
             agencyId = whList[0].id;
           }
        }
      } catch (e) {
        console.warn('[CHECKOUT] Failed to fetch agencyId:', e);
      }

      const orderPayload = {
        organizationId: tenantId,
        agencyId: agencyId,
        // Utiliser l'ID Kernel du tiers (créé ci-dessus), pas l'ID utilisateur auth
        customerThirdPartyId: kernelThirdPartyId || customerId || '00000000-0000-0000-0000-000000000000',
        productId: itemsList[0]?.productId || '00000000-0000-0000-0000-000000000000',
        orderNumber: orderId,
        quantity: itemsList[0]?.quantity || 1,
        unitPrice: itemsList[0]?.price || 0,
        currency: 'XAF',
        lines: itemsList.map(item => ({
          productId: item.productId || '00000000-0000-0000-0000-000000000000',
          quantity: item.quantity,
          unitPrice: item.price
        }))
      };

      const orderRes = await backendFetch('/api/sales/orders', {
        method: 'POST',
        headers: {
          ...tHeaders,
          'Authorization': `Bearer ${await getKernelToken()}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (!orderRes.success) {
        console.error('[CHECKOUT] Kernel API rejected order creation. Response:', JSON.stringify(orderRes, null, 2));
        // Fallback local db
        saveLocalOrder(orderPayload);
      }

      // Réduire la quantité (stock) des produits après commande
      for (const item of itemsList) {
        const pId = item.productId;
        if (pId) {
          try {
            const pRes = await backendFetch(`/api/products/${pId}`, {
              method: 'GET',
              headers: tHeadersAuth
            });
            if (pRes.success && pRes.data) {
              const product = pRes.data;
              const currentQ = product.quantity || 0;
              const newQ = Math.max(0, currentQ - (item.quantity || 1));
              
              // Inclure les champs requis pour la mise à jour de produit sur le Kernel
              const payload = {
                organizationId: tenantId,
                sku: product.sku || `SKU-${pId.slice(0, 8)}`,
                name: product.name,
                variantLabel: product.variantLabel || 'Standard',
                unitPrice: product.unitPrice || 1,
                quantity: newQ
              };

              const updateRes = await backendFetch(`/api/products/${pId}`, {
                method: 'PATCH',
                headers: tHeadersAuth,
                body: JSON.stringify(payload)
              });

              if (updateRes.success) {
                console.log(`[CHECKOUT] Stock réduit avec succès pour ${pId}: ${currentQ} -> ${newQ}`);
              } else {
                console.error(`[CHECKOUT] Échec de réduction de stock pour ${pId}:`, updateRes.message);
              }
            }
          } catch (e) {
            console.error(`[CHECKOUT] Exception lors de la réduction de stock pour ${pId}:`, e);
          }
        }
      }

      ordersCreated.push(orderPayload);
    }

    const grandTotal = ordersCreated.reduce((sum, o) => {
      const orderTotal = o.lines.reduce((acc: number, line: any) => acc + (line.quantity * line.unitPrice), 0);
      return sum + orderTotal;
    }, 0);
    const orderIds = ordersCreated.map(o => o.orderNumber).join(',');
    const mainTenantId = Object.keys(groupedItems)[0] || 'default-tenant';

    const KERNEL_CLIENT_ID = process.env.PAYMENT_X_CLIENT_ID || process.env.KERNEL_X_CLIENT_ID || 'ksm-client-id';
    const KERNEL_API_KEY = process.env.PAYMENT_X_API_KEY || process.env.KERNEL_X_API_KEY || 'ksm-api-key';
    const KERNEL_TENANT_ID = process.env.KERNEL_X_TENANT_ID || '11111111-1111-1111-1111-111111111111';

    // Détection automatique de Ngrok
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
      const ngrokRes = await fetch('http://127.0.0.1:4040/api/tunnels', { cache: 'no-store' });
      if (ngrokRes.ok) {
        const ngrokData = await ngrokRes.json();
        const httpsTunnel = ngrokData.tunnels?.find((t: any) => t.public_url.startsWith('https://'));
        if (httpsTunnel) {
          baseUrl = httpsTunnel.public_url;
          console.log('[CHECKOUT] Ngrok tunnel détecté pour le callback:', baseUrl);
        }
      }
    } catch (e) {
      // Ngrok n'est probablement pas lancé sur 4040, on garde le baseUrl par défaut
    }

    const paymentPayload = {
      amount: grandTotal,
      method: 'STRIPE',
      userId: customerId || '00000000-0000-0000-0000-000000000000',
      organizationId: mainTenantId,
      callbackUrl: `${baseUrl}/api/webhooks/payment`,
      metadata: { orderIds: orderIds }
    };

    let stripeCheckoutUrl = `/mock-stripe-checkout?orderIds=${orderIds}&amount=${grandTotal}`; // Simulation Stripe par défaut

    try {
      const paymentRes = await fetch('https://payment-dev.yowyob.com/api/v1/transactions/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': KERNEL_CLIENT_ID,
          'X-Api-Key': KERNEL_API_KEY,
          'X-Tenant-Id': KERNEL_TENANT_ID,
          'X-Organization-Id': mainTenantId
        },
        body: JSON.stringify(paymentPayload)
      });
      
      const paymentData = await paymentRes.json().catch(() => null);
    
      if (paymentRes.ok) {
        if (paymentData.stripeCheckoutUrl) {
          stripeCheckoutUrl = paymentData.stripeCheckoutUrl;
        }
      } else {
        console.error('[CHECKOUT] Erreur API Paiement Yowyob:', paymentData);
        console.warn('[CHECKOUT] Utilisation de la simulation Stripe.');
      }
    } catch (e) {
      console.warn("[CHECKOUT] API Paiement Yowyob injoignable. Utilisation de la simulation Stripe.");
    }

    return Response.json({ success: true, stripeCheckoutUrl, data: ordersCreated });
  } catch (error: any) {
    console.error('[CHECKOUT API ERROR]', error);
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
