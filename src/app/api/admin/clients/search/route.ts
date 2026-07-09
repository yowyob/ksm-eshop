import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || undefined;
  const query = searchParams.get('query') || '';

  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;

  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  // Forward the search query to Kernel Core's /api/clients/search endpoint
  const result = await backendFetch('/api/clients/search', {
    method: 'GET',
    params: { 
      organizationId, 
      query,
      roles: 'CUSTOMER'
    },
    headers: { 
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (!result.success && (result.errorCode === '401' || result.message === 'Unauthorized' || result.message === 'Non autorisé.')) {
    return Response.json(result, { status: 401 });
  }

  return Response.json(result);
}
