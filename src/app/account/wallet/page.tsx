'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Wallet, ArrowLeft, Loader2, ArrowUpRight, ArrowDownLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { formatPrice } from '@/lib/utils';

export default function AccountWalletPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useCustomerAuthStore();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ORANGE_MONEY');
  const [payerReference, setPayerReference] = useState('');
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    async function loadWalletData() {
      try {
        const res = await fetch('/api/payments/my-wallet');
        const data = await res.json();
        if (data.success && data.wallet) {
          setWallet(data.wallet);
          // Récupération des transactions réelles
          try {
            const txRes = await fetch('/api/payments/my-wallet/transactions');
            const txData = await txRes.json();
            if (txData.success && Array.isArray(txData.transactions)) {
              setTransactions(txData.transactions);
            }
          } catch (txErr) {
            console.error('Error loading real transactions:', txErr);
          }
        }
      } catch (err) {
        console.error('Error loading wallet details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWalletData();
  }, [isAuthenticated, router]);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Veuillez entrer un montant valide.');
      return;
    }

    // Déterminer les paramètres réels à envoyer au Kernel
    let provider = 'MYCOOLPAY';
    let method = 'MOBILE_MONEY';

    if (paymentMethod === 'STRIPE') {
      provider = 'STRIPE';
      method = 'CARD';
    }

    // Formater le numéro de téléphone si Cameroun (9 chiffres commençant par 6)
    let formattedPhone = payerReference;
    if (paymentMethod !== 'STRIPE' && payerReference.length === 9 && payerReference.startsWith('6')) {
      formattedPhone = '237' + payerReference;
    }

    setIsRecharging(true);
    try {
      const res = await fetch('/api/payments/my-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amt, 
          provider, 
          method, 
          payerReference: paymentMethod !== 'STRIPE' ? formattedPhone : '' 
        })
      });
      const data = await res.json().catch(() => ({ success: false, message: 'Réponse JSON invalide du serveur' }));
      if (data.success) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          alert(`Demande de recharge initiée avec succès ! (Ref: ${data.orderId || 'N/A'}). Veuillez valider le paiement sur votre téléphone (saisie du code PIN).`);
          setRechargeAmount('');
          setPayerReference('');
        }
      } else {
        const detailMsg = data.debugKernelResponse 
          ? `\n\n[DEBUG KERNEL]: ${JSON.stringify(data.debugKernelResponse)}`
          : '';
        alert((data.message || `Erreur lors de l'initiation de la recharge (Code: ${res.status}).`) + detailMsg);
      }
    } catch (err: any) {
      alert(`Une erreur réseau est survenue : ${err.message || err}`);
    } finally {
      setIsRecharging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-zinc-50">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Chargement de votre compte KSM Pay...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 font-bold border-2 border-zinc-900 uppercase text-xs">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase italic">Mon Portefeuille KSM</h1>
        <div className="w-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Solde Card */}
        <Card className="md:col-span-2 border-4 border-zinc-900 bg-zinc-900 text-white shadow-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wallet className="h-40 w-40" />
          </div>
          <CardContent className="p-8 flex flex-col justify-between h-full min-h-[220px]">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Solde Disponible</p>
              <h2 className="text-5xl font-black tracking-tighter italic text-blue-400 mt-2">
                {wallet ? formatPrice(wallet.balance) : '0 FCFA'}
              </h2>
            </div>
            <div className="border-t border-zinc-800 pt-6 mt-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Propriétaire du compte</p>
                <p className="text-sm font-bold text-white truncate">{user?.name || user?.email}</p>
              </div>
              <span className="bg-blue-600/20 text-blue-400 border border-blue-600/30 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                KSM Pay Actif
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Recharge Form */}
        <Card className="border-2 border-zinc-200 shadow-sm rounded-3xl">
          <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-blue-600" />
              Recharge Rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleRecharge} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Montant (FCFA)</label>
                <input 
                  type="number"
                  required
                  placeholder="Ex: 10000"
                  className="w-full rounded-lg border-2 border-zinc-300 bg-zinc-50 p-3 text-sm font-bold text-zinc-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Moyen de Paiement</label>
                <select 
                  className="w-full rounded-lg border-2 border-zinc-300 bg-zinc-50 p-3 text-sm font-bold text-zinc-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="MTN_MOMO">MTN Mobile Money</option>
                  <option value="STRIPE">Stripe (Carte Bancaire / Visa / MasterCard)</option>
                </select>
              </div>
              {paymentMethod !== 'STRIPE' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Numéro de téléphone payeur</label>
                  <input 
                    type="tel"
                    required
                    placeholder="Ex: 690123456"
                    className="w-full rounded-lg border-2 border-zinc-300 bg-zinc-50 p-3 text-sm font-bold text-zinc-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                    value={payerReference}
                    onChange={(e) => setPayerReference(e.target.value)}
                  />
                </div>
              )}
              <Button 
                type="submit" 
                disabled={isRecharging}
                className="w-full bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-xs h-12 shadow-md shadow-blue-600/15"
              >
                {isRecharging ? 'Redirection...' : 'Recharger mon compte'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Transactions History */}
      <Card className="border-2 border-zinc-200 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-6">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-900">Historique des Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-100">
            {transactions.map((tx) => {
              const txAmount = tx.amount !== undefined ? tx.amount : (tx.value || 0);
              const txDate = tx.createdAt || tx.date || new Date().toISOString();
              const isDeposit = tx.type === 'RECHARGE' || tx.type === 'DEPOSIT' || tx.operationType === 'DEPOSIT' || txAmount > 0;
              const statusLabel = tx.status === 'SUCCESS' || tx.status === 'COMPLETED' ? 'Réussi' : (tx.status === 'PENDING' ? 'En attente' : 'Échoué');
              const txTitle = tx.type === 'RECHARGE' || tx.operationType === 'DEPOSIT' ? 'Recharge de Portefeuille' : (tx.description || tx.desc || 'Paiement / Achat');
              
              return (
                <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDeposit ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {isDeposit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-sm truncate">
                        {txTitle}
                      </p>
                      <p className="text-xs text-zinc-400 font-medium">
                        {new Date(txDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${isDeposit ? 'text-emerald-600' : 'text-zinc-900'}`}>
                      {isDeposit ? '+' : ''}{formatPrice(txAmount)}
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      statusLabel === 'Réussi' ? 'bg-emerald-50 text-emerald-600' : (statusLabel === 'En attente' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')
                    }`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div className="p-12 text-center text-zinc-400">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <p className="font-bold uppercase tracking-widest text-xs">Aucune transaction enregistrée</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
