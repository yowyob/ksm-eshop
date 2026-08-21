import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loginWithYowyob } from '@/lib/yowyob-sdk/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Toujours utiliser le tenant global pour l'auth (évite les locks anti-brute-force par org)
    const orgId = process.env.KERNEL_X_TENANT_ID || '11111111-1111-1111-1111-111111111111';

    let session;
    try {
      session = await loginWithYowyob({ principal: email, password: code, tenantId: orgId });
    } catch (error: any) {
      const errorCode = error?.code || '401';
      console.log('[CustomerLogin] Failed:', errorCode, error?.message);

      let errorMsg = 'Email ou mot de passe incorrect';

      if (error?.message) errorMsg = error.message;
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        errorMsg = "Votre adresse email n'est pas encore vérifiée. Consultez votre boîte de réception.";
      }
      if (errorCode === 'AUTH_THROTTLED_PRINCIPAL') {
        errorMsg = 'Trop de tentatives échouées. Réessayez plus tard.';
      }

      return NextResponse.json({ success: false, message: errorMsg, errorCode }, { status: 401 });
    }

    // Récupérer le token — la réponse Kernel peut avoir plusieurs structures
    const data: any = session.user || {};
    const accessToken = session.accessToken;

    if (!accessToken) {
      console.error('[CustomerLogin] Aucun token reçu');
      return NextResponse.json({ success: false, message: 'Erreur inattendue: token manquant.' }, { status: 500 });
    }

    const expiresIn = session.expiresIn || 3600;
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
