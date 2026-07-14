import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getKernelBase, getKernelBaseHeaders } from '@/lib/kernel-auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken')?.value;
  if (!adminToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  const { orgId } = await params;

  try {
    const body = await request.json();
    
    // Le backend exige ces champs obligatoires pour la mise à jour d'organisation
    if (!body.code || !body.shortName || !body.longName || !body.service) {
      return Response.json({ 
        success: false, 
        message: 'Les champs obligatoires (code, shortName, longName, service) doivent être spécifiés.' 
      }, { status: 400 });
    }

    const payload = {
      code: body.code,
      shortName: body.shortName,
      longName: body.longName,
      service: body.service,
      description: body.description ?? '',
      email: body.email ?? null,
      websiteUrl: body.websiteUrl ?? null,
      shortLabel: body.shortLabel ?? body.shortName,
      displayName: body.displayName ?? body.shortName,
      logoUri: body.logoUri ?? null,
      legalName: body.legalName ?? body.longName,
      organizationType: body.organizationType ?? 'PRIVATE_COMPANY',
      isActive: body.isActive !== undefined ? body.isActive : true
    };

    const res = await fetch(`${getKernelBase()}/api/organizations/${orgId}`, {
      method: 'PATCH',
      headers: {
        ...getKernelBaseHeaders(),
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const result = await res.json().catch(() => ({ success: res.ok }));

    if (!res.ok) {
      return Response.json({
        success: false,
        message: result?.message || `Erreur backend (${res.status})`,
        detail: result
      }, { status: res.status });
    }

    return Response.json({ success: true, data: result?.data || result });
  } catch (error: any) {
    console.error('[ADMIN UPDATE ORG] Error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
