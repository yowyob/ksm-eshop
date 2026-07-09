import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;
  const adminSessionId = cookieStore.get('adminSessionId')?.value;
  const adminSharedToken = cookieStore.get('adminSharedToken')?.value;
  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }
  
  const { productId } = await params;

  try {
    const body = await request.json();
    const organizationId = body.organizationId;
    
    const result = await backendFetch(`/api/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        ...(organizationId ? { 'X-Organization-Id': organizationId } : {})
      }
    });

    console.log('[DEBUG PATCH PRODUCT] Payload sent:', JSON.stringify(body));
    console.log('[DEBUG PATCH PRODUCT] Result:', result);

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;
  const adminSessionId = cookieStore.get('adminSessionId')?.value;
  const adminSharedToken = cookieStore.get('adminSharedToken')?.value;
  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }
  
  const { productId } = await params;

  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || undefined;
    
    const result = await backendFetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        ...(organizationId ? { 'X-Organization-Id': organizationId } : {})
      }
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
