'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, CreditCard, Lock, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useState, Suspense } from 'react';

function MockStripeContent() {
  const searchParams = useSearchParams();
  const orderIds = searchParams.get('orderIds');
  const amountParam = searchParams.get('amount');
  const amount = amountParam ? parseInt(amountParam, 10) : 0;
  
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    setIsPaying(true);
    
    // Simuler le délai de traitement bancaire
    await new Promise(r => setTimeout(r, 2000));

    // Envoyer le webhook pour simuler la notification Stripe -> Serveur
    try {
      await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'TRANSACTION_SUCCEEDED',
          metadata: { orderIds }
        })
      });
      
      // Rediriger vers la page de succès de l'application
      router.push(`/checkout/success?orderIds=${orderIds}`);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la simulation du paiement.');
      setIsPaying(false);
    }
  };

  const handleCancel = () => {
    router.push('/checkout/cancel');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-zinc-500" />
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Paiement Sécurisé (Simulation)</span>
          </div>
          <h1 className="text-2xl font-black italic uppercase text-zinc-900">Yowyob Stripe Checkout</h1>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl">
          <CardHeader className="bg-zinc-900 text-white p-8 text-center">
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-2">Montant à payer</p>
            <div className="text-4xl font-black italic tracking-tighter">{formatPrice(amount)}</div>
            <p className="text-zinc-400 text-sm mt-2">Ref: {orderIds}</p>
          </CardHeader>
          <CardContent className="p-8 bg-white space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Numéro de carte</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                  <input disabled value="**** **** **** 4242" className="w-full pl-10 pr-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-lg text-zinc-500 font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Expiration</label>
                  <input disabled value="12/28" className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-lg text-zinc-500 font-bold text-center" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">CVC</label>
                  <input disabled value="***" className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-lg text-zinc-500 font-bold text-center" />
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePayment} 
              disabled={isPaying}
              className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-lg font-black uppercase italic tracking-widest transition-all shadow-lg"
            >
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Traitement...
                </>
              ) : (
                `Payer ${formatPrice(amount)}`
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              disabled={isPaying}
              className="w-full font-bold text-zinc-500 hover:text-zinc-900 h-12"
            >
              Annuler et retourner à la boutique
            </Button>
          </CardContent>
          <CardFooter className="bg-zinc-100 p-4 flex justify-center text-zinc-400 gap-2 text-xs">
            <ShieldCheck className="h-4 w-4" /> Mode Simulation - Aucun vrai paiement
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function MockStripePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">Chargement de la page de paiement...</div>}>
      <MockStripeContent />
    </Suspense>
  );
}
