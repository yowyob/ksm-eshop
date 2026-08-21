import { cookies } from 'next/headers';
import { createPayChallenge, getMyWallet } from '@/lib/yowyob-sdk/payment';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('customerToken')?.value;
  if (!token) return Response.json({ success: false, errorCode: 'SESSION_REQUIRED', message: 'Connectez-vous avant de payer.' }, { status: 401 });

  try {
    const body = await request.json();
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ success: false, message: 'Montant invalide.' }, { status: 400 });
    }
    const wallet = await getMyWallet(token);
    const challenge = await createPayChallenge(token, wallet.id, {
      amount,
      reference: body?.reference || `SHOP-${Date.now()}`,
    });
    return Response.json({ success: true, walletId: wallet.id, challenge });
  } catch (error: any) {
    console.error('[SHOP PAYMENT MFA] Challenge failed:', error?.message || error);
    return Response.json({ success: false, message: error?.message || 'Impossible de démarrer la vérification MFA.' }, { status: 400 });
  }
}
