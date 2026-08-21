import { getYowyobSdkConfig, sdkHeaders, unwrap } from './config';

export type Wallet = {
  id: string;
  ownerId: string;
  ownerType?: 'USER' | 'ORGANIZATION';
  balance: number;
  currency: string;
  status?: string;
};

async function call<T>(token: string, path: string, method: 'GET' | 'POST', body?: unknown, organizationId?: string) {
  const { baseUrl } = getYowyobSdkConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: sdkHeaders({ token, organizationId }),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || `Payment Core ${response.status}`);
  return unwrap<T>(payload) as T;
}

export const getMyWallet = (token: string) => call<Wallet>(token, '/api/payments/wallets/mine', 'GET');
export const ensureMyWallet = (token: string, ownerName?: string) =>
  call<Wallet>(token, '/api/payments/wallets/mine', 'POST', { ownerName: ownerName || null });

export function getWalletByOwner(token: string, ownerId: string, organizationId?: string) {
  return call<Wallet>(token, `/api/payments/wallets/owner/${encodeURIComponent(ownerId)}`, 'GET', undefined, organizationId);
}

export function ensureOrganizationWallet(token: string, organizationId: string) {
  return call<Wallet>(token, '/api/payments/wallets', 'POST', {
    ownerId: organizationId,
    ownerType: 'ORGANIZATION',
    ownerName: `org:${organizationId}`,
  }, organizationId);
}

export function payFromWallet(token: string, walletId: string, input: {
  recipientWalletId: string;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
  challengeToken?: string;
  code?: string;
}) {
  return call(token, `/api/payments/wallets/${encodeURIComponent(walletId)}/pay`, 'POST', input);
}

export function createRecharge(token: string, walletId: string, input: {
  amount: number;
  currency?: string;
  provider?: string;
  method?: string;
  payerReference?: string;
  idempotencyKey: string;
}) {
  return call(token, `/api/payments/wallets/${encodeURIComponent(walletId)}/recharge`, 'POST', input);
}

