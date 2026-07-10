'use client';

import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Wallet, ArrowLeft, Printer, Download, ShieldCheck } from 'lucide-react';
import { useOrderStore, Order } from '@/store/useOrderStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { TENANTS } from '@/lib/mock-data';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { useProductStore } from '@/store/useProductStore';

export default function CheckoutPage() {
  const { tenantId } = useParams();
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { addOrder } = useOrderStore();
  const { dispatchSalesOrder } = useInventoryStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const user = useCustomerAuthStore((state) => state.user);

  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    setIsMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    if (user) {
      const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '';
      setCustomerName(name);
    }
  }, [user]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsProcessing(true);
    
    // Simuler la connexion au microservice ePay KSM
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const tenant = TENANTS.find(t => t.slug === tenantId);
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const orderId = `KSM-${randomId}`;

    // Call dispatchSalesOrder to log outbound movements
    await dispatchSalesOrder(
      tenant?.id || 't1',
      orderId,
      items.map(item => ({ variantId: item.variantId, quantity: item.quantity }))
    );

    // Optimistically decrease stock in useProductStore
    const { decreaseProductStock } = useProductStore.getState();
    items.forEach(item => {
      decreaseProductStock(item.productId || item.variantId.replace('v-', ''), item.quantity);
    });
    
    const newOrder: Order = {
      id: orderId,
      customerName: customerName || 'Client KSM',
      customerId: user?.id || '00000000-0000-0000-0000-000000000000',
      total: totalPrice,
      status: 'pending',
      date: new Date().toLocaleString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      tenantId: tenant?.id || 't1',
      items: [...items],
    };

    try {
      const res = await fetch('/api/bon-commande', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          counterpartyThirdPartyId: user?.id || '00000000-0000-0000-0000-000000000000',
          currency: 'FCFA',
          organizationId: tenant?.organizationId || 'o1',
          lines: items.map(item => ({
            productId: item.productId || item.variantId, // fallback
            quantity: item.quantity,
            unitPrice: item.price,
            taxRate: 0
          }))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error('Erreur API bon-commande:', data);
      }
    } catch (e) {
      console.error('Fetch error bon-commande', e);
    }

    addOrder(newOrder);
    setOrderData(newOrder);
    setIsProcessing(false);
    setIsCompleted(true);
    clearCart();
  };

  if (!isMounted) return null;

  const inputClasses = "w-full rounded-lg border-2 border-zinc-300 bg-zinc-50 p-3 text-sm font-bold text-zinc-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all placeholder:text-zinc-400";

  if (isCompleted && orderData) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter text-center">Paiement Réussi !</h1>
          <p className="mt-3 text-lg font-bold text-zinc-600 text-center">Votre commande a été validée via le service ePay.</p>
        </div>

        <Card className="border-4 border-zinc-900 shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="bg-zinc-900 text-white p-10">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-black italic uppercase text-white">FACTURE</CardTitle>
                <p className="text-zinc-400 font-bold mt-1 tracking-widest text-sm uppercase">N° {orderData.id}</p>
              </div>
              <div className="text-right text-white">
                <p className="font-black text-xl uppercase italic">KSM eShop</p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Douala, Cameroun</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 bg-white">
            <table className="w-full text-md mb-10">
              <thead>
                <tr className="border-b-2 border-zinc-900 text-zinc-500 text-left">
                  <th className="py-3 font-black uppercase text-xs tracking-widest">Produit</th>
                  <th className="py-3 font-black uppercase text-xs tracking-widest text-center">Qté</th>
                  <th className="py-3 font-black uppercase text-xs tracking-widest text-right">Prix</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-100">
                {orderData.items.map((item: any) => (
                  <tr key={item.id} className="font-bold">
                    <td className="py-5 text-zinc-900">{item.name}</td>
                    <td className="py-5 text-center text-zinc-600">{item.quantity}</td>
                    <td className="py-5 text-right text-zinc-900">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-zinc-900">
                  <td colSpan={2} className="pt-8 text-2xl font-black uppercase italic tracking-tighter text-zinc-900">Total Payé</td>
                  <td className="pt-8 text-right text-3xl font-black text-blue-600 tracking-tighter">{formatPrice(orderData.total)}</td>
                </tr>
              </tfoot>
            </table>
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
          <Button onClick={() => router.push(`/${tenantId}`)} className="bg-zinc-900 h-16 px-10 text-lg font-black uppercase italic tracking-tighter">
            Retourner à l&apos;accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-12 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 font-bold border-2 border-zinc-900 uppercase text-xs">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase italic">Caisse & Règlement</h1>
        <div className="w-20" />
      </div>
      
      <form onSubmit={handleCheckout} className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <Card className="border-2 border-zinc-200 shadow-lg">
            <CardHeader className="bg-zinc-50 border-b-2 border-zinc-100">
              <CardTitle className="text-xl uppercase italic tracking-tighter font-black text-zinc-900">Coordonnées de Livraison</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 p-8 bg-white">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Nom Complet</label>
                <input 
                  required 
                  className={inputClasses} 
                  placeholder="Ex: Jean-Luc Moussa" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Téléphone (+237)</label>
                <input required className={inputClasses} placeholder="Ex: 6xx xxx xxx" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Adresse Exacte</label>
                <textarea required className={`${inputClasses} h-24 resize-none`} placeholder="Quartier, Rue, Point de repère..." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-blue-600 bg-blue-50 overflow-hidden shadow-xl">
            <CardHeader className="bg-blue-600 text-white p-6">
              <CardTitle className="text-xl flex items-center gap-3 uppercase italic tracking-tighter font-black text-white">
                <Wallet className="h-6 w-6 text-white" /> 
                Paiement Sécurisé : ePay KSM
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <div className="rounded-2xl border-2 border-blue-600 bg-blue-50/30 p-8 transition-all flex items-center justify-between shadow-inner">
                <div>
                  <p className="text-xl font-black text-zinc-900 uppercase tracking-tighter italic text-left">Portefeuille ePay</p>
                  <p className="text-sm font-bold text-zinc-500 mt-2 text-left">Prélèvement immédiat sur votre compte central.</p>
                </div>
                <div className="h-14 w-24 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-200">
                  <span className="text-white font-black text-xl italic uppercase">ePay</span>
                </div>
              </div>
              <p className="mt-6 text-sm font-bold text-blue-800 bg-blue-100 p-4 rounded-lg border border-blue-200">
                INFO : Pour cette phase pilote, seul le paiement via ePay est autorisé pour garantir la synchronisation instantanée des stocks.
              </p>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card className="sticky top-24 border-4 border-zinc-900 shadow-2xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-zinc-900 text-white">
              <CardTitle className="text-xl uppercase italic tracking-tighter font-black text-white">Résumé Final</CardTitle>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <div className="space-y-6">
                {items.length > 0 ? items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm font-bold">
                    <span className="text-zinc-500">{item.quantity}x <span className="text-zinc-900 uppercase italic tracking-tighter">{item.name}</span></span>
                    <span className="text-zinc-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                )) : (
                  <p className="text-zinc-500 font-bold italic text-center">Votre panier est vide</p>
                )}
                <div className="border-t-2 border-zinc-100 pt-6">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Total Net</span>
                    <span className="text-4xl font-black text-blue-600 tracking-tighter italic">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
              <Button 
                type="submit" 
                className="mt-10 w-full bg-blue-600 hover:bg-blue-700 h-20 text-xl font-black uppercase italic tracking-tighter shadow-xl shadow-blue-100 transition-all hover:scale-105" 
                size="lg" 
                disabled={isProcessing || items.length === 0}
              >
                {isProcessing ? 'Connexion ePay...' : `Confirmer le Paiement`}
              </Button>
              <div className="mt-6 flex items-center justify-center gap-2 text-zinc-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] uppercase font-black tracking-widest">KSM Encryption Active</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
