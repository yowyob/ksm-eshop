'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, ArrowRight, Printer, Download } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useEffect, Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderIds = searchParams.get('orderIds');
  const router = useRouter();
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Le paiement est réussi, on vide le panier local
    clearCart();
  }, [clearCart]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-10">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter text-center">Paiement Réussi !</h1>
        <p className="mt-3 text-lg font-bold text-zinc-600 text-center">Votre commande a été validée avec succès via Yowyob.</p>
      </div>

      <Card className="border-4 border-zinc-900 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-zinc-900 text-white p-10">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-black italic uppercase text-white">RÉCAPITULATIF</CardTitle>
              {orderIds && <p className="text-zinc-400 font-bold mt-1 tracking-widest text-sm uppercase">N° {orderIds}</p>}
            </div>
            <div className="text-right text-white">
              <p className="font-black text-xl uppercase italic">KSM eShop</p>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Douala, Cameroun</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 bg-white text-center">
          <p className="text-zinc-600 font-bold mb-6">
            Votre paiement a été confirmé. Vous pouvez suivre l'état de votre commande depuis votre espace client.
          </p>
          <Button onClick={() => router.push('/orders')} className="w-full bg-blue-600 hover:bg-blue-700 h-14 font-black uppercase tracking-widest text-sm shadow-xl">
            Voir mes commandes <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
        <CardFooter className="bg-zinc-100 p-8 flex justify-between gap-6">
          <Button variant="outline" className="flex-1 gap-3 h-14 font-black uppercase text-sm border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all" onClick={() => window.print()}>
            <Printer className="h-5 w-5" /> Imprimer
          </Button>
          <Button variant="outline" className="flex-1 gap-3 h-14 font-black uppercase text-sm border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all">
            <Download className="h-5 w-5" /> PDF
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-12 text-center">
        <Button onClick={() => router.push(`/`)} className="bg-zinc-900 h-16 px-10 text-lg font-black uppercase italic tracking-tighter hover:bg-zinc-800">
          Retourner à l'accueil
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Chargement...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
