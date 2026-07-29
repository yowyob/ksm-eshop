import { NextRequest } from 'next/server';
import { getKernelBase, getKernelBaseHeaders } from '@/lib/kernel-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  try {
    const { planId } = await request.json();
    if (!planId || !['free', 'monthly', 'annual'].includes(planId)) {
      return Response.json({ success: false, message: 'Plan invalide.' }, { status: 400 });
    }

    // 1. Récupérer d'abord les détails de l'organisation existante
    const getRes = await fetch(`${getKernelBase()}/api/organizations/${orgId}`, {
      method: 'GET',
      headers: getKernelBaseHeaders(),
      cache: 'no-store'
    });

    if (!getRes.ok) {
      return Response.json({ success: false, message: 'Impossible de charger l\'organisation.' }, { status: 404 });
    }

    const orgData = await getRes.json();
    const org = orgData.data || orgData;

    // 2. Préparer le payload avec le tag de plan dans keywords
    const payload = {
      code: org.code,
      shortName: org.shortName || org.name || 'Boutique',
      longName: org.longName || org.name || 'Boutique',
      service: org.service || 'retail',
      description: org.description || '',
      email: org.email || null,
      websiteUrl: org.websiteUrl || null,
      displayName: org.displayName || org.shortName || org.name,
      legalName: org.legalName || org.longName || org.name,
      keywords: [`plan_${planId}`], // Stocker le plan d'abonnement ici
      isActive: org.isActive !== undefined ? org.isActive : true
    };

    // 3. Mettre à jour l'organisation sur le Kernel
    const patchRes = await fetch(`${getKernelBase()}/api/organizations/${orgId}`, {
      method: 'PATCH',
      headers: {
        ...getKernelBaseHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    if (!patchRes.ok) {
      const errData = await patchRes.json().catch(() => ({}));
      return Response.json({
        success: false,
        message: errData.message || 'Erreur lors de la mise à jour sur le Kernel Core.',
        detail: errData
      }, { status: patchRes.status });
    }

    return Response.json({ success: true, planId });
  } catch (error: any) {
    console.error('[SUBSCRIBE ROUTE] Error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
