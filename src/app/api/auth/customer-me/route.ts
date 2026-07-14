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
    
    // Mettre à jour l'utilisateur sur le Kernel Core
    const result = await backendFetch('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
        'X-Tenant-Id': orgId,
        'X-Organization-Id': orgId
      }
    });
    
    console.log('[CustomerMe Update] Backend result:', result);
    return Response.json(result);
  } catch (error: any) {
    console.error('[CustomerMe Update] Error:', error);
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
