import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const customerToken = cookieStore.get('customerToken')?.value;
  
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('organizationId') || searchParams.get('tenantId') || process.env.KERNEL_X_TENANT_ID || "11111111-1111-1111-1111-111111111111";

  console.log('[CustomerMe] Token present?', !!customerToken, 'orgId:', orgId);

  if (!customerToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const result = await backendFetch('/api/users/me', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${customerToken}`,
        'X-Tenant-Id': orgId,
        'X-Organization-Id': orgId
      }
    });
    
    console.log('[CustomerMe] Backend result:', result);

    return Response.json(result);
  } catch (error: any) {
    console.error('[CustomerMe] Error:', error);
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const customerToken = cookieStore.get('customerToken')?.value;
  
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('organizationId') || searchParams.get('tenantId') || process.env.KERNEL_X_TENANT_ID || "11111111-1111-1111-1111-111111111111";

  if (!customerToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, phoneNumber, email } = body;

    if (!email) {
      return Response.json({ success: false, message: 'Email manquant.' }, { status: 400 });
    }

    // 1. Mettre à jour localement sur le serveur (base locale et fichiers clients.json / users.json)
    const { updateLocalUserAndClient } = require('@/lib/local-db');
    updateLocalUserAndClient(email, firstName, lastName, phoneNumber);

    // 2. Tenter de synchroniser le profil de Tiers (ThirdParty) correspondant sur le Kernel
    try {
      const getKernelToken = require('@/lib/kernel-auth').getKernelToken;
      const adminToken = await getKernelToken();

      // Rechercher le tiers correspondant dans l'organisation
      const searchRes = await backendFetch(`/api/third-parties?organizationId=${orgId}&size=1000`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'X-Organization-Id': orgId
        }
      });

      if (searchRes.success && searchRes.data) {
        const list = Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data.content || []);
        const foundTp = list.find((tp: any) => 
          tp.code === email || 
          tp.uniqueIdentificationNumber === email || 
          tp.accountingAccount === email
        );

        if (foundTp && foundTp.id) {
          // Mettre à jour le tiers sur le Kernel Core
          const updatePayload = {
            ...foundTp,
            name: `${firstName} ${lastName}`.trim(),
            displayName: `${firstName} ${lastName}`.trim(),
            longName: `${firstName} ${lastName}`.trim(),
            phoneNumber: phoneNumber
          };

          await backendFetch(`/api/third-parties/${foundTp.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatePayload),
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
              'X-Organization-Id': orgId
            }
          });
          console.log('[CustomerMe Update] Tiers Kernel mis à jour:', foundTp.id);
        }
      }
    } catch (tpError) {
      console.warn('[CustomerMe Update] Impossible de synchroniser le tiers sur le Kernel (non-bloquant):', tpError);
    }

    return Response.json({ 
      success: true, 
      message: 'Profil mis à jour.',
      data: {
        email,
        firstName,
        lastName,
        phoneNumber,
        name: `${firstName} ${lastName}`.trim()
      }
    });
  } catch (error: any) {
    console.error('[CustomerMe Update] Error:', error);
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
