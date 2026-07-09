import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getKernelBaseHeaders } from '@/lib/kernel-auth';

export async function POST(request: NextRequest) {
  try {
    const { principal, password } = await request.json();

    if (!principal || !password) {
      return Response.json(
        { success: false, message: 'Email et mot de passe requis.' },
        { status: 400 }
      );
    }

    const BACKEND_URL = process.env.BACKEND_URL || 'https://kernel-core.yowyob.com';

    // Appel direct au Kernel avec les credentials de l'utilisateur
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: getKernelBaseHeaders(),
      body: JSON.stringify({ principal, password }),
    });

    const data = await res.json();
    console.log('[Admin Login Response Data]', JSON.stringify(data, null, 2));

    if (!res.ok || !data.success) {
      return Response.json(
        { success: false, message: data.message || 'Identifiants invalides.' },
        { status: res.status === 200 ? 401 : res.status }
      );
    }

    const accessToken = data?.data?.accessToken || data?.data?.access_token;
    const sessionId = data?.data?.sessionId || data?.data?.sessionToken;

    const token = accessToken || sessionId;

    if (!token) {
      return Response.json(
        { success: false, message: 'Erreur lors de la récupération du jeton.' },
        { status: 500 }
      );
    }

    // Calcul de l'expiration du cookie (par ex. 1 jour si non spécifié)
    const expiresIn = data?.data?.expiresIn || 24 * 60 * 60; // en secondes
    const maxAge = Number(expiresIn);
    
    const sharedToken = data?.data?.sharedSession?.token;
    const sharedMaxAge = data?.data?.sharedSession?.expiresInSeconds || maxAge;

    // Stockage du token dans un cookie HTTP-Only sécurisé
    const cookieStore = await cookies();
    cookieStore.set('adminToken', accessToken || token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    });
    
    cookieStore.set('adminSessionId', sessionId || token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
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

    return Response.json({ success: true, message: 'Connecté avec succès.' });
  } catch (error: any) {
    console.error('[Admin Login Error]', error);
    return Response.json(
      { success: false, message: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
