import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { creerProduit, listerProduits } from '@/lib/kernel-catalog';
import { getLocalReservedQuantities } from '@/lib/local-db';

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

  if (!organizationId) {
    return Response.json({ success: false, message: 'organizationId manquant.' }, { status: 400 });
  }
  // Le noyau rend la liste entière : page et size ne s'appliquent plus.
  void page; void size;
  const result: any = await listerProduits(organizationId, {}, {
    'Authorization': `Bearer ${adminToken}`,
    'X-Organization-Id': organizationId,
  });

  if (!result.success && (result.errorCode === '401' || result.message === 'Unauthorized')) {
    return Response.json(result, { status: 401 });
  }

  if (result.success && result.data) {
    const reserved = getLocalReservedQuantities(organizationId);
    let content = result.data.content || result.data;
    
    if (Array.isArray(content)) {
      content.forEach((p: any) => {
        if (reserved[p.id]) {
          if (typeof p.quantity === 'number') p.quantity = Math.max(0, p.quantity - reserved[p.id]);
          if (typeof p.inStock === 'number') p.inStock = Math.max(0, p.inStock - reserved[p.id]);
          if (p.variants && Array.isArray(p.variants)) {
             // also deduct from variants if applicable
             p.variants.forEach((v: any) => {
               if (reserved[v.id]) {
                 if (typeof v.quantity === 'number') v.quantity = Math.max(0, v.quantity - reserved[v.id]);
                 if (typeof v.inStock === 'number') v.inStock = Math.max(0, v.inStock - reserved[v.id]);
               }
             });
          }
        }
      });
    }
    return Response.json({ ...result, data: result.data });
  }

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;
  const adminSessionId = cookieStore.get('adminSessionId')?.value;
  const adminSharedToken = cookieStore.get('adminSharedToken')?.value;

  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const organizationId = body.organizationId;
    
    const result = await creerProduit(body, {
      'Authorization': `Bearer ${adminToken}`,
      ...(organizationId ? { 'X-Organization-Id': organizationId } : {})
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
