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

      // 1. Essayer de vérifier si le client existe (via search ou fetch)
      let clientExists = false;
      const searchRes = await backendFetch(`/api/third-parties?organizationId=${tenantId}`, {
        method: 'GET',
        headers: tHeaders
      });

      let backendClients: any[] = [];
      if (searchRes.success && searchRes.data) {
         backendClients = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data.content || searchRes.data.data || []);
      }
      
      const localClients = getLocalClients(tenantId);
      const allClients = [...backendClients, ...localClients];
      
      if (allClients.find((c: any) => c.name === customerName || c.partyId === customerId || c.id === customerId)) {
        clientExists = true;
      }

      // 2. Créer le client s'il n'existe pas
      if (!clientExists) {
        const clientPayload = {
          id: customerId,
          partyId: customerId,
          organizationId: tenantId,
          partyType: 'ACTOR',
          code: `C-${customerId?.substring(0, 5) || Math.floor(Math.random() * 10000)}`,
          name: customerName || 'Client Anonyme',
          longName: customerName || 'Client Anonyme',
          roles: ['CUSTOMER'],
          type: 'INDIVIDUAL',
          enabled: true,
          prospect: false
        };

        const adminTokenForCreation = await getKernelToken();
        const createRes = await backendFetch('/api/third-parties', {
          method: 'POST',
          headers: {
            ...tHeaders,
            'Authorization': `Bearer ${adminTokenForCreation}`
          },
          body: JSON.stringify(clientPayload)
        });
        
        if (!createRes.success) {
          saveLocalClient(clientPayload);
        }
      }

      // 3. Créer la commande
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const orderId = `KSM-${randomId}`;
      const total = itemsList.reduce((acc, it) => acc + (it.price * it.quantity), 0);

      const orderPayload = {
        id: orderId,
        customerName: customerName || 'Client Anonyme',
        customerId: customerId || '00000000-0000-0000-0000-000000000000',
        total: total,
        status: 'pending',
        date: new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        tenantId: tenantId,
        organizationId: tenantId,
        items: itemsList.map(item => ({
          id: item.variantId,
          name: item.name,
          image: item.imageUrl,
          quantity: item.quantity,
          price: item.price
        })),
        lines: itemsList.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const orderRes = await backendFetch('/api/bon-commande', {
        method: 'POST',
        headers: tHeaders,
        body: JSON.stringify(orderPayload)
      });

      if (!orderRes.success) {
        // Fallback local db
        saveLocalOrder(orderPayload);
      }

      ordersCreated.push(orderPayload);
    }

    const grandTotal = ordersCreated.reduce((sum, o) => sum + o.total, 0);
    const orderIds = ordersCreated.map(o => o.id).join(',');
    const mainTenantId = Object.keys(groupedItems)[0] || 'default-tenant';

    const KERNEL_CLIENT_ID = process.env.KERNEL_CLIENT_ID || 'ksm-client-id';
    const KERNEL_API_KEY = process.env.KERNEL_API_KEY || 'ksm-api-key';
    const KERNEL_TENANT_ID = process.env.KERNEL_TENANT_ID || 'ksm-tenant-id';

    const paymentPayload = {
      amount: grandTotal,
      method: 'STRIPE',
      userId: customerId || '00000000-0000-0000-0000-000000000000',
      organizationId: mainTenantId,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/payment`,
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
      
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        if (paymentData.stripeCheckoutUrl) {
          stripeCheckoutUrl = paymentData.stripeCheckoutUrl;
        }
      } else {
        console.warn("[CHECKOUT] API Paiement Yowyob a échoué. Utilisation de la simulation Stripe.");
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
