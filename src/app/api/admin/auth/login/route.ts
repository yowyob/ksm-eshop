import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getKernelBaseHeaders, getKernelBase } from '@/lib/kernel-auth';

export async function POST(request: NextRequest) {
  try {
    const { principal, password } = await request.json();

    if (!principal || !password) {
      return Response.json(
        { success: false, message: 'Email et mot de passe requis.' },
        { status: 400 }
      );
    }

    // Lire BACKEND_URL au moment de la requête (pas au chargement du module)
    const res = await fetch(`${getKernelBase()}/api/auth/login`, {
      method: 'POST',
      headers: getKernelBaseHeaders(),
      body: JSON.stringify({ principal, password }),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return Response.json(
        { success: false, message: data.message || 'Identifiants invalides.' },
        { status: res.status === 200 ? 401 : res.status }
      );
    }

    const accessToken = data?.data?.accessToken || data?.data?.access_token;
    const sessionId   = data?.data?.sessionId   || data?.data?.sessionToken;
    const token       = accessToken || sessionId;

    if (!token) {
      return Response.json(
        { success: false, message: 'Erreur lors de la récupération du jeton.' },
        { status: 500 }
      );
    }

    // Token expire dans expiresInSeconds (900s = 15 min), on met 23h pour le cookie
    // car le refresh se fait via le sharedToken
    const tokenExpiry  = data?.data?.expiresInSeconds || data?.data?.expiresIn || 900;
    const cookieMaxAge = Math.max(tokenExpiry, 23 * 60 * 60); // min 23h pour le cookie

    const sharedToken    = data?.data?.sharedSession?.token;
    const sharedMaxAge   = data?.data?.sharedSession?.expiresInSeconds || 8 * 60 * 60;

    const cookieStore = await cookies();

    cookieStore.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieMaxAge,
    });

    cookieStore.set('adminSessionId', sessionId || token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieMaxAge,
    });

    if (sharedToken) {
      cookieStore.set('adminSharedToken', sharedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: Number(sharedMaxAge),
      });
    }

    // Stocker le tokenExpiry pour permettre le refresh côté client si nécessaire
    cookieStore.set('adminTokenExpiry', String(Date.now() + tokenExpiry * 1000), {
      httpOnly: false, // lisible côté client pour planifier le refresh
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieMaxAge,
    });

    return Response.json({ success: true, message: 'Connecté avec succès.', expiresIn: tokenExpiry });
  } catch (error: any) {
    console.error('[Admin Login Error]', error);
    return Response.json(
      { success: false, message: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
