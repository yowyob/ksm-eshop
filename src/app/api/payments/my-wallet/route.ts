import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getWalletByOwner, createWallet, rechargeWallet } from '@/lib/payments-api';

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

/**
 * GET /api/payments/my-wallet
 * Récupère le portefeuille du client connecté
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const customerId = getCustomerId(cookieStore);

  if (!customerId) {
    return Response.json({ success: false, message: 'Non connecté' }, { status: 401 });
  }

  try {
    let wallet = await getWalletByOwner(customerId);
    if (!wallet) {
      wallet = await createWallet(customerId);
    }

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
  const customerId = getCustomerId(cookieStore);

  if (!customerId) {
    return Response.json({ success: false, message: 'Non connecté' }, { status: 401 });
  }

  try {
    const { amount, provider, method, payerReference } = await request.json();
    if (!amount || amount <= 0) {
      return Response.json({ success: false, message: 'Montant invalide' }, { status: 400 });
    }

    const wallet = await getWalletByOwner(customerId);
    if (!wallet) {
      return Response.json({ success: false, message: "Vous ne possédez pas encore de portefeuille actif sur le Kernel Core." }, { status: 400 });
    }

    // Détection auto du site url pour le callback de retour
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const callbackUrl = `${protocol}://${host}/account/wallet?recharge=success`;

    const resolvedCurrency = (wallet.currency === 'FCFA' || !wallet.currency) ? 'XAF' : wallet.currency;
    const rechargeResult = await rechargeWallet(
      wallet.id,
      amount,
      {
        provider: provider || 'MYCOOLPAY',
        method: method || 'MOBILE_MONEY',
        payerReference: payerReference || '',
        currency: resolvedCurrency
      },
      callbackUrl
    );

    if (!rechargeResult.redirectUrl) {
      return Response.json({
        success: false,
        message: "Le Kernel Core n'a retourné aucun lien de redirection pour le paiement.",
        debugKernelResponse: (rechargeResult as any).rawResponse || null
      }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      redirectUrl: rechargeResult.redirectUrl, 
      orderId: rechargeResult.orderId 
    });
  } catch (error: any) {
    console.error('[WALLET RECHARGE ERROR]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
