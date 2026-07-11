import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';
import { getLocalClients, saveLocalClient } from '@/lib/local-db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || undefined;
  const page = searchParams.get('page') || undefined;
  const size = searchParams.get('size') || undefined;

  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;

  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  const result = await backendFetch('/api/third-parties', {
    method: 'GET',
    params: { organizationId, page, size },
    headers: { 
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const localClients = getLocalClients(organizationId);

  if (!result.success) {
    if (result.errorCode === '401' || result.message === 'Unauthorized' || result.message === 'Non autorisé.') {
      return Response.json(result, { status: 401 });
    }
    // Fallback to local
    return Response.json({ success: true, data: localClients });
  }

  // Merge backend and local clients (local override or append)
  const backendList = Array.isArray(result.data) ? result.data : (result.data?.content || result.data?.data || []);
  const combined = [...backendList, ...localClients];
  // Deduplicate by id/code
  const unique = Array.from(new Map(combined.map(item => [item.id || item.code, item])).values());
  
  return Response.json({ success: true, data: unique });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;

  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const organizationId = body.organizationId;
    
    const result = await backendFetch('/api/third-parties', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        ...(organizationId ? { 'X-Organization-Id': organizationId } : {})
      }
    });

    if (!result.success) {
      if (result.errorCode === '401' || result.message === 'Unauthorized' || result.message === 'Non autorisé.') {
        return Response.json(result, { status: 401 });
      }
      // Fallback local
      saveLocalClient(body);
      return Response.json({ success: true, message: 'Saved locally (fallback)', data: body });
    }

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
