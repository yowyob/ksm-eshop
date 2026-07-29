import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getWalletByOwner, getWalletTransactions } from '@/lib/payments-api';

function getCustomerId(cookieStore: any): string | null {
  const customerToken = cookieStore.get('customerToken')?.value;
  if (!customerToken) return null;
  try {
    const parts = customerToken.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedJson);
    return payload.sub || payload.actor || null;
  } catch (e) {
    console.error('[getCustomerId] Erreur décodage JWT:', e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const customerId = getCustomerId(cookieStore);

  if (!customerId) {
    return Response.json({ success: false, message: 'Non connecté' }, { status: 401 });
  }

  try {
    const wallet = await getWalletByOwner(customerId);
    if (!wallet) {
      return Response.json({ success: true, transactions: [] });
    }

    const transactions = await getWalletTransactions(wallet.id);
    return Response.json({ success: true, transactions });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
