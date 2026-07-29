import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getWalletByOwner, createWallet } from '@/lib/payments-api';
import { getKernelBase, getKernelBaseHeaders } from '@/lib/kernel-auth';

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
 * POST /api/payments/my-wallet/credit
 * Simule ou effectue un crédit direct sur le portefeuille de l'utilisateur connecté (pour le développement local)
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const customerId = getCustomerId(cookieStore);

  if (!customerId) {
    return Response.json({ success: false, message: 'Non connecté' }, { status: 401 });
  }

  try {
    const { amount } = await request.json();
    if (!amount || amount <= 0) {
      return Response.json({ success: false, message: 'Montant invalide' }, { status: 400 });
    }

    let wallet = await getWalletByOwner(customerId);
    if (!wallet) {
      wallet = await createWallet(customerId);
    }

    // Le Kernel Core ne dispose pas d'API de crédit arbitraire directe pour des raisons de sécurité,
    // mais pour le développement local, nous pouvons simuler cela en mettant à jour le cache 
    // ou en appelant la recharge simulée.
    // Pour que le solde change réellement en dev, nous allons simuler un paiement réussi sur le wallet.
    // Si la plateforme de dev supporte un virement depuis un portefeuille système (ex: 'system-vault'),
    // nous pouvons essayer. Sinon, nous simulons la mise à jour locale.
    
    // Pour la phase pilote locale, nous allons simuler le solde en modifiant temporairement 
    // l'objet portefeuille retourné ou en utilisant un stockage temporaire.
    // Pour une solution robuste et immédiate en local, nous pouvons faire un virement depuis 
    // un portefeuille "administrateur/system" s'il existe, ou simplement mettre à jour le solde simulé.
    
    // Tentons de recharger via le connecteur de recharge si possible
    // Sinon, nous stockons le crédit simulé en cache cookie ou mémoire.
    const currentBalance = wallet.balance || 0;
    const newBalance = currentBalance + amount;

    // Pour persister cela en local de façon simple et instantanée sans casser le Kernel :
    // Nous pouvons stocker le solde additionnel dans un cookie crypté ou de session "wallet_override"
    cookieStore.set('wallet_override', JSON.stringify({
      walletId: wallet.id,
      balance: newBalance
    }), { maxAge: 60 * 60 * 24 }); // 1 jour

    return Response.json({ 
      success: true, 
      walletId: wallet.id, 
      balance: newBalance,
      message: `Portefeuille crédité de +${amount} FCFA avec succès.` 
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
