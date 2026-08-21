import { getYowyobSdkConfig, sdkHeaders, unwrap } from './config';

export type YowyobSession = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: Record<string, unknown>;
};

/** SDK Auth server-side : le token reste dans le cookie httpOnly du BFF shop. */
export async function loginWithYowyob(input: {
  principal: string;
  password: string;
  tenantId?: string;
}): Promise<YowyobSession> {
  const { baseUrl } = getYowyobSdkConfig();
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: sdkHeaders({ tenantId: input.tenantId }),
    body: JSON.stringify({ principal: input.principal, password: input.password }),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message || `Échec de connexion YowAuth (${response.status})`);
    (error as Error & { code?: string }).code = payload?.errorCode;
    throw error;
  }
  const data = unwrap<Record<string, any>>(payload) || {};
  const accessToken = data.accessToken || data.sessionToken || payload.accessToken || payload.token;
  if (!accessToken) throw new Error('YowAuth n’a retourné aucun access token');
  return {
    accessToken,
    refreshToken: data.refreshToken || payload.refreshToken,
    expiresIn: data.expiresInSeconds || data.expiresIn || 3600,
    user: data.user || data,
  };
}

