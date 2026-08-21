/** Configuration commune des SDK Yowyob (server-only). */
export function getYowyobSdkConfig() {
  const baseUrl = (process.env.BACKEND_URL || 'https://kernel-core.yowyob.com').replace(/\/$/, '');
  const clientId = process.env.KERNEL_X_CLIENT_ID || process.env.PAYMENT_X_CLIENT_ID;
  const apiKey = process.env.KERNEL_X_API_KEY || process.env.PAYMENT_X_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error('KERNEL_X_CLIENT_ID et KERNEL_X_API_KEY sont requis côté serveur');
  }

  return { baseUrl, clientId, apiKey };
}

export function sdkHeaders(options: {
  token?: string;
  tenantId?: string;
  organizationId?: string;
} = {}): Record<string, string> {
  const { clientId, apiKey } = getYowyobSdkConfig();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Id': clientId,
    'X-Api-Key': apiKey,
  };
  const tenantId = options.tenantId || process.env.KERNEL_X_TENANT_ID;
  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  if (options.organizationId) headers['X-Organization-Id'] = options.organizationId;
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  return headers;
}

export function unwrap<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data;
  }
  return payload as T | undefined;
}

