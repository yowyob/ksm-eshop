'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <div className="text-center mb-10">
        <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-200">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter text-center">Paiement Annulé</h1>
      </div>

      <Card className="border-4 border-zinc-900 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-zinc-900 text-white p-8">
          <CardTitle className="text-2xl font-black italic uppercase text-white text-center">Opération interrompue</CardTitle>
        </CardHeader>
        <CardContent className="p-10 bg-white text-center">
          <p className="text-zinc-600 font-bold mb-8 text-lg">
            Le processus de paiement a été annulé ou n'a pas pu aboutir. Aucun montant n'a été débité.
          </p>
          <div className="flex flex-col gap-4">
            <Button onClick={() => router.push('/cart')} className="w-full bg-blue-600 hover:bg-blue-700 h-14 font-black uppercase tracking-widest text-sm shadow-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Revenir au panier
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full h-14 font-black uppercase tracking-widest text-sm border-2 border-zinc-900">
              Retourner à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
