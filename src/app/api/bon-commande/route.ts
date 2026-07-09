import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check for tokens (could be customer or admin, depending on who makes the order)
    const cookieStore = await cookies();
    const customerToken = cookieStore.get('customerToken')?.value;
    const adminToken = cookieStore.get('adminToken')?.value;
    const token = customerToken || adminToken;
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body.organizationId) {
      headers['X-Organization-Id'] = body.organizationId;
    }

    const result = await backendFetch('/api/bon-commande', {
      method: 'POST',
      body: JSON.stringify(body),
      headers
    });

    console.log('[DEBUG POST BON-COMMANDE] Result:', result);

    if (!result.success) {
      return Response.json(result, { status: 400 });
    }

    return Response.json(result);
  } catch (error: any) {
    console.error('[DEBUG POST BON-COMMANDE] Error:', error);
    return Response.json({
      success: false,
      message: error.message || 'Erreur lors de la création du bon de commande',
      errorCode: 'BAD_REQUEST',
    }, { status: 400 });
  }
}
