import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';
import { getKernelBaseHeaders } from '@/lib/kernel-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, organizationId } = body;

    // ALWAYS use global tenant for Authentication, to avoid 429 Anti-bruteforce locks when guessing.
    const orgId = process.env.KERNEL_X_TENANT_ID || "11111111-1111-1111-1111-111111111111";

    const KERNEL_BASE = process.env.BACKEND_URL || 'https://kernel-core.yowyob.com';
    const authRes = await fetch(`${KERNEL_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 
        ...getKernelBaseHeaders(),
        'X-Tenant-Id': orgId,
        'X-Organization-Id': orgId
      },
      body: JSON.stringify({ principal: email, password: code })
    });

    if (!authRes.ok) {
      const errData = await authRes.text();
      console.log('[Login] Failed:', authRes.status, errData);
      
      let errorMsg = 'Email ou mot de passe incorrect';
      let errorCode = 'UNAUTHORIZED';
      try {
        const parsed = JSON.parse(errData);
        if (parsed.message) errorMsg = parsed.message;
        if (parsed.errorCode) errorCode = parsed.errorCode;
      } catch (e) {}

      // If it's EMAIL_NOT_VERIFIED, we should tell the user clearly
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        errorMsg = "Votre adresse email n'est pas encore vérifiée. Veuillez consulter votre boîte de réception.";
      }
      
      // If throttled, give a clearer message
      if (errorCode === 'AUTH_THROTTLED_PRINCIPAL') {
        errorMsg = "Trop de tentatives échouées. Veuillez réessayer plus tard.";
      }

      return NextResponse.json({ success: false, message: errorMsg, errorCode }, { status: 401 });
    }

    const authData = await authRes.json();
    
    // AuthData format for kernel auth sign-in: { success: true, data: { accessToken, expiresIn, user: {...} } }
    const accessToken = 
      authData.data?.accessToken || 
      authData.data?.sessionToken || 
      authData.accessToken || 
      authData.token;
      
    if (!accessToken) {
      console.error('[Login] Aucun token reçu:', authData);
      return NextResponse.json({ success: false, message: 'Erreur inattendue: token manquant.' }, { status: 500 });
    }

    const expiresIn = authData.data?.expiresIn || 3600;
    const userData = authData.data?.user || authData.data || authData;

    // Create a generic customer profile from authData
    const customer = {
      partyId: userData.id || userData.partyId,
      name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.displayName || userData.username || email || "Client",
      email: userData.email || email,
      roles: userData.roles || []
    };

    const cookieStore = await cookies();
    cookieStore.set('customerToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Number(expiresIn),
    });

    // Le profil tiers commercial est créé au moment du paiement, pas à la connexion.
    // Cela suit la logique métier: un visiteur devient client officiel en payant.

    // Save to local DB to retroactively count existing users who log in
    try {
      const { saveLocalUser } = require('@/lib/local-db');
      saveLocalUser({ name: customer.name, email: customer.email });
    } catch (e) {
      console.error('[Login] Erreur sauvegarde locale user:', e);
    }

    // We return the customer profile
    return NextResponse.json({ 
      success: true, 
      data: {
        ...customer,
        token: accessToken
      }
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
