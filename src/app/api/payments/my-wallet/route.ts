import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getMyWallet, ensureMyWallet, createRecharge } from '@/lib/yowyob-sdk/payment';

/**
 * Récupère l'ID du client actuellement connecté via les cookies de session.
 */
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

function getCustomerToken(cookieStore: any): string | null {
  return cookieStore.get('customerToken')?.value || null;
}

/**
 * GET /api/payments/my-wallet
 * Récupère le portefeuille du client connecté
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = getCustomerToken(cookieStore);
  const customerId = getCustomerId(cookieStore);

  if (!customerId || !token) {
    return Response.json({ success: false, message: 'Non connecté' }, { status: 401 });
  }

  try {
    let wallet;
    try { wallet = await getMyWallet(token); } catch { wallet = await ensureMyWallet(token, customerId); }

    return Response.json({ success: true, wallet });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/payments/my-wallet
 * Initie une recharge de portefeuille
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = getCustomerToken(cookieStore);
  const customerId = getCustomerId(cookieStore);

  if (!customerId || !token) {
    return Response.json({ success: false, message: 'Non connecté' }, { status: 401 });
  }

  try {
    const { amount, provider, method, payerReference } = await request.json();
    if (!amount || amount <= 0) {
      return Response.json({ success: false, message: 'Montant invalide' }, { status: 400 });
    }

    const wallet = await getMyWallet(token);
    if (!wallet) {
      return Response.json({ success: false, message: "Vous ne possédez pas encore de portefeuille actif sur le Kernel Core." }, { status: 400 });
    }

    // Détection auto du site url pour le callback de retour
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const callbackUrl = `${protocol}://${host}/account/wallet?recharge=success`;

    const resolvedCurrency = (wallet.currency === 'FCFA' || !wallet.currency) ? 'XAF' : wallet.currency;
    const rechargeResult: any = await createRecharge(token, wallet.id, {
      amount,
      provider: provider || 'MYCOOLPAY',
      method: method || 'MOBILE_MONEY',
      payerReference: payerReference || '',
      currency: resolvedCurrency,
      idempotencyKey: `shop-recharge-${wallet.id}-${Date.now()}`,
    });

    if (!rechargeResult.redirectUrl) {
      return Response.json({
        success: false,
        message: "Le Kernel Core n'a retourné aucun lien de redirection pour le paiement.",
        debugKernelResponse: (rechargeResult as any).rawResponse || null
      }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      redirectUrl: (rechargeResult as any).redirectUrl || (rechargeResult as any).paymentUrl,
      orderId: (rechargeResult as any).orderId || (rechargeResult as any).id,
    });
  } catch (error: any) {
    console.error('[WALLET RECHARGE ERROR]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
