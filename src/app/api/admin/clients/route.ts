import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';

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

  if (!result.success && (result.errorCode === '401' || result.message === 'Unauthorized' || result.message === 'Non autorisé.')) {
    return Response.json(result, { status: 401 });
  }

  return Response.json(result);
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

    if (!result.success && (result.errorCode === '401' || result.message === 'Unauthorized' || result.message === 'Non autorisé.')) {
      return Response.json(result, { status: 401 });
    }

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
