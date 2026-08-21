import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getKernelBaseHeaders, getKernelBase } from '@/lib/kernel-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Toujours utiliser le tenant global pour l'auth (évite les locks anti-brute-force par org)
    const orgId = process.env.KERNEL_X_TENANT_ID || '11111111-1111-1111-1111-111111111111';

    const authRes = await fetch(`${getKernelBase()}/api/auth/login`, {
      method: 'POST',
      headers: {
        ...getKernelBaseHeaders(),
        'X-Tenant-Id': orgId,
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify({ principal: email, password: code }),
      cache: 'no-store',
    });

    const authData = await authRes.json().catch(() => ({}));

    if (!authRes.ok) {
      console.log('[CustomerLogin] Failed:', authRes.status, authData);

      let errorMsg = 'Email ou mot de passe incorrect';
      const errorCode = authData?.errorCode || String(authRes.status);

      if (authData?.message) errorMsg = authData.message;
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        errorMsg = "Votre adresse email n'est pas encore vérifiée. Consultez votre boîte de réception.";
      }
      if (errorCode === 'AUTH_THROTTLED_PRINCIPAL') {
        errorMsg = 'Trop de tentatives échouées. Réessayez plus tard.';
      }

      return NextResponse.json({ success: false, message: errorMsg, errorCode }, { status: 401 });
    }

    // Récupérer le token — la réponse Kernel peut avoir plusieurs structures
    const data = authData?.data || authData;
    const accessToken =
      data?.accessToken ||
      data?.sessionToken ||
      authData?.accessToken ||
      authData?.token;

    if (!accessToken) {
      console.error('[CustomerLogin] Aucun token reçu:', JSON.stringify(authData).slice(0, 300));
      return NextResponse.json({ success: false, message: 'Erreur inattendue: token manquant.' }, { status: 500 });
    }

    const expiresIn = data?.expiresInSeconds || data?.expiresIn || 3600;
    const userData = data?.user || data;

    // Profil client normalisé
    const customer = {
      partyId: userData?.id || userData?.partyId || userData?.actorId,
      name:
        `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() ||
        userData?.name ||
        userData?.displayName ||
        userData?.username ||
        email ||
        'Client',
      email: userData?.email || email,
      roles: userData?.roles || userData?.authorities || [],
    };

    // Stocker le token dans un cookie httpOnly sécurisé
    const cookieStore = await cookies();
    cookieStore.set('customerToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Number(expiresIn),
    });

    // Sauvegarder localement pour le comptage des utilisateurs actifs
    try {
      const { saveLocalUser } = require('@/lib/local-db');
      saveLocalUser({ name: customer.name, email: customer.email });
    } catch (e) {
      console.error('[CustomerLogin] Erreur sauvegarde locale user:', e);
    }

    return NextResponse.json({
      success: true,
      data: { ...customer, token: accessToken },
    });
  } catch (error: any) {
    console.error('[CustomerLogin] Erreur inattendue:', error);
    return NextResponse.json({ success: false, message: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
