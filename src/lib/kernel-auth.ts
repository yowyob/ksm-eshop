/**
 * kernel-auth.ts
 * Service d'authentification au kernel Yowyob.
 *
 * FONCTIONNEMENT :
 * Ce compte (atenaornella@gmail.com) ne nécessite PAS de MFA.
 * Le login retourne directement un accessToken.
 * Le service renouvelle automatiquement le token avant expiration.
 * Vos utilisateurs ne voient jamais d'interruption.
 */

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;
let isRefreshing = false; // verrou pour éviter les appels parallèles

const KERNEL_BASE = process.env.BACKEND_URL        || 'https://kernel-core.yowyob.com';
const X_CLIENT_ID = process.env.KERNEL_X_CLIENT_ID || 'prod-platform-backend';
const X_API_KEY   = process.env.KERNEL_X_API_KEY   || '';
const X_TENANT_ID = process.env.KERNEL_X_TENANT_ID || '11111111-1111-1111-1111-111111111111';
const PRINCIPAL   = process.env.KERNEL_USERNAME     || '';
const PASSWORD    = process.env.KERNEL_PASSWORD     || '';

// Token statique (prioritaire si défini — pour tests manuels)
const STATIC_TOKEN = process.env.KERNEL_STATIC_TOKEN || '';

// Durée de vie par défaut si le kernel ne la précise pas (14 min pour garder marge)
const DEFAULT_EXPIRY_MS = 14 * 60 * 1000;

/**
 * Headers de base requis par le kernel (sans Authorization).
 */
export function getKernelBaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept':       '*/*',
    'X-Client-Id':  X_CLIENT_ID,
    'X-Api-Key':    X_API_KEY,
    'X-Tenant-Id':  X_TENANT_ID,
  };
}

/**
 * Se connecte au kernel et retourne un accessToken.
 * Ce compte ne nécessite pas de MFA — le token est retourné directement.
 */
async function loginToKernel(): Promise<string> {
  console.log('[KernelAuth] Connexion au kernel...');

  const res = await fetch(`${KERNEL_BASE}/api/auth/login`, {
    method:  'POST',
    headers: getKernelBaseHeaders(),
    body:    JSON.stringify({ principal: PRINCIPAL, password: PASSWORD }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`[KernelAuth] Login échoué (${res.status}): ${JSON.stringify(data)}`);
  }

  const nextStep = data?.data?.nextStep;
  if (nextStep === 'CONFIRM_MFA') {
    throw new Error('[KernelAuth] MFA requis sur ce compte. Changez les credentials dans .env.local');
  }

  const token: string =
    data?.data?.accessToken ||
    data?.data?.sessionToken ||
    data?.accessToken       ||
    data?.token             || '';

  if (!token) {
    throw new Error('[KernelAuth] Aucun sessionToken/accessToken dans la réponse: ' + JSON.stringify(data));
  }

  // Calculer l'expiration (expiresIn en secondes ou valeur par défaut 14min)
  const expiresIn = data?.data?.expiresIn || data?.expiresIn;
  const expiresAt = expiresIn
    ? Date.now() + expiresIn * 1000
    : Date.now() + DEFAULT_EXPIRY_MS;

  tokenCache = { token, expiresAt };
  console.log(`[KernelAuth] ✅ Token obtenu. Expire dans ${Math.round((expiresAt - Date.now()) / 1000 / 60)} min.`);

  return token;
}

/**
 * Retourne un accessToken valide pour le kernel.
 * Renouvellement automatique et transparent.
 *
 * Ordre de priorité :
 *  1. KERNEL_STATIC_TOKEN (env) — si défini manuellement pour tests
 *  2. Cache mémoire encore valide (marge 60s)
 *  3. Nouveau login automatique (sans OTP)
 */
export async function getKernelToken(): Promise<string> {
  // 1. Token statique manuel (pour tests ou override)
  if (STATIC_TOKEN) return STATIC_TOKEN;

  const now = Date.now();

  // 2. Cache valide (marge de 60 secondes avant expiration)
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  // 3. Renouvellement automatique
  // Verrou pour éviter plusieurs logins simultanés
  if (isRefreshing) {
    // Attendre que le refresh en cours se termine
    await new Promise(resolve => setTimeout(resolve, 500));
    if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
      return tokenCache.token;
    }
  }

  isRefreshing = true;
  try {
    return await loginToKernel();
  } finally {
    isRefreshing = false;
  }
}

/**
 * Retourne les headers complets (base + Authorization Bearer) pour le kernel.
 */
export async function getKernelHeaders(): Promise<Record<string, string>> {
  const token = await getKernelToken();
  return {
    ...getKernelBaseHeaders(),
    'Authorization': `Bearer ${token}`,
  };
}
