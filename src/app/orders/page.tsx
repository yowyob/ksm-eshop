'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { useOrderStore } from '@/store/useOrderStore';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useCustomerAuthStore();
  const { orders, isLoading } = useOrderStore();
  const [mounted, setMounted] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user) {
      const customerId = user.partyId || user.id || user.thirdPartyId;
      useOrderStore.getState().fetchOrders(undefined, customerId).then(() => {
        setFetchDone(true);
      });
    }
  }, [isAuthenticated, router, user]);

  if (!mounted || !isAuthenticated) return null;

  const displayName = user 
    ? (user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.name || user.email) 
    : '';

  // Les commandes sont filtrées par le backend via l'appel API
  const myOrders = orders;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'processing': return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'En attente';
      case 'processing': return 'En traitement';
      case 'shipped': return 'Expédiée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="bg-white border-b border-zinc-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-zinc-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-black text-zinc-900">Mes Commandes</h1>
          </div>
          {displayName && (
            <p className="text-sm font-bold text-zinc-500 hidden sm:block">{displayName}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Chargement en cours */}
        {(isLoading || !fetchDone) ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="font-bold text-zinc-500">Chargement de vos commandes...</p>
          </div>
        ) : myOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-zinc-200 flex flex-col items-center">
            <div className="h-24 w-24 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <Package className="h-10 w-10 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mb-2">Aucune commande</h2>
            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Vous n'avez pas encore passé de commande sur KSM eShop.</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-8 py-6 h-auto">
                Commencer mes achats
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
                  <div>
                    <p className="text-sm font-bold text-zinc-500 mb-1">Commande N°</p>
                    <p className="text-lg font-black text-zinc-900">{order.id}</p>
                    <p className="text-sm text-zinc-500 mt-1">Effectuée le {order.date}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200">
                      {getStatusIcon(order.status)}
                      <span className="font-bold text-sm text-zinc-700">{getStatusLabel(order.status)}</span>
                    </div>
                    <p className="text-xl font-black text-zinc-900 mt-2">
                      {formatPrice(order.total)} <span className="text-sm">FCFA</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-zinc-900">Articles de la commande</h3>
                  {order.items && order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-16 w-16 object-cover rounded-lg bg-white" />
                      ) : (
                        <div className="h-16 w-16 bg-zinc-200 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-zinc-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-sm text-zinc-900 line-clamp-2">{item.name}</p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(item.selectedOptions).map(([key, val]) => (
                              <span key={key} className="text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full font-bold">
                                {key}: {val as string}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-zinc-500 mt-1">Qté: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-zinc-900">{formatPrice(item.price || item.unitPrice || 0)} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
