'use client';

import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const { tenantId } = useParams();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { items, removeItem, updateQuantity } = useCartStore();

  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    setIsMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const handleRemoveItem = (productId: string, productName: string) => {
    if (confirm(`Voulez-vous vraiment supprimer "${productName}" ? Cette action est définitive.`)) {
      removeItem(productId);
    }
  };

  if (!isMounted) return null;

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex h-[60vh] flex-col items-center justify-center px-4 bg-white rounded-3xl border-4 border-zinc-200 mt-12 shadow-inner">
        <div className="rounded-full bg-zinc-100 p-8 mb-6 border-4 border-zinc-50">
          <ShoppingBag className="h-16 w-16 text-zinc-300" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter text-center">Votre panier est vide</h1>
        <p className="mt-2 text-lg font-bold text-zinc-400 text-center">Commencez vos achats pour synchroniser vos stocks.</p>
        <Link href={`/${tenantId}/products`} className="mt-10">
          <Button className="h-16 px-8 gap-3 bg-zinc-900 font-black uppercase italic tracking-tighter transition-all hover:scale-105">
            <ArrowLeft className="h-5 w-5" /> Explorer le catalogue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 font-bold border-2 border-zinc-900 uppercase text-xs">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase italic">Récapitulatif Panier</h1>
        <div className="w-20" />
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <Card key={item.id} className="border-4 border-zinc-200 overflow-hidden shadow-lg transition-all hover:border-zinc-900">
              <CardContent className="flex items-center p-6 bg-white">
                <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-50 bg-zinc-50 shadow-inner">
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="ml-8 flex flex-1 flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black text-zinc-900 uppercase italic tracking-tighter">{item.name}</h3>
                    <p className="text-2xl font-black text-blue-600 tracking-tighter">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <p className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest">Prix unitaire: {formatPrice(item.price)}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center rounded-xl border-4 border-zinc-900 bg-white overflow-hidden shadow-md">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-3 hover:bg-zinc-100 border-r-2 border-zinc-900 transition-colors"
                      >
                        <Minus className="h-5 w-5 text-zinc-900" />
                      </button>
                      <span className="w-12 text-center text-lg font-black text-zinc-900 italic">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-3 hover:bg-zinc-100 border-l-2 border-zinc-900 transition-colors"
                      >
                        <Plus className="h-5 w-5 text-zinc-900" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      className="text-red-600 hover:bg-red-50 p-3 rounded-xl transition-all border-2 border-transparent hover:border-red-200"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <aside>
          <Card className="border-4 border-zinc-900 shadow-2xl bg-white rounded-3xl overflow-hidden sticky top-24">
            <div className="bg-zinc-900 p-6 text-white text-center">
               <h2 className="text-xl font-black uppercase italic tracking-tighter">Validation ePay</h2>
            </div>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between text-zinc-500 uppercase font-black text-xs tracking-widest">
                  <p>Articles ({items.length})</p>
                  <p>{formatPrice(totalPrice)}</p>
                </div>
                <div className="flex items-center justify-between text-zinc-500 uppercase font-black text-xs tracking-widest">
                  <p>Livraison (Portail KSM)</p>
                  <p className="text-zinc-400 italic">Facultatif</p>
                </div>
                <div className="border-t-4 border-zinc-100 pt-6 flex flex-col items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Net à Payer</p>
                  <p className="text-4xl font-black text-blue-600 tracking-tighter italic">{formatPrice(totalPrice)}</p>
                </div>
              </div>
              
              <div className="mt-10 space-y-4">
                <Link href={`/${tenantId}/checkout`} className="block w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-20 text-xl font-black uppercase italic tracking-tighter shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]">
                    Passer à la paye <ArrowLeft className="ml-3 h-6 w-6 rotate-180" />
                  </Button>
                </Link>
                <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  Synchronisation immédiate des stocks physiques via KSM Core
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
