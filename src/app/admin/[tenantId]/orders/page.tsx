'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  Package, 
  User,
  MoreVertical,
  Search,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/store/useOrderStore';

export default function AdminOrdersPage() {
  const params = useParams();
  const organizationId = params?.tenantId as string;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!organizationId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/bon-commande?organizationId=${organizationId}`).then(r => r.json());
        if (res.success || res.ok) {
          let rawData = res.data || res;
          if (rawData.content && Array.isArray(rawData.content)) rawData = rawData.content;
          else if (rawData.data && Array.isArray(rawData.data)) rawData = rawData.data;

          if (Array.isArray(rawData)) {
            const backendOrders = rawData.map((o: any) => ({
              id: o.documentNumber || o.orderNumber || o.id,
              customerName: o.customerName || o.counterparty?.name || o.customerThirdPartyId || o.counterpartyThirdPartyId || 'Client',
              customerId: o.counterparty?.id || o.customerThirdPartyId || o.counterpartyThirdPartyId || o.customerId,
              total: o.totalAmount || o.subtotalAmount || o.total || 0,
              status: o.status?.toLowerCase() || 'pending',
              date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              }) : (o.date || new Date().toLocaleDateString('fr-FR')),
              tenantId: o.organizationId || o.tenantId || organizationId,
              items: o.lines || o.items || [],
            }));
            setOrders(backendOrders);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [organizationId]);

  const tenantOrders = orders;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'processing': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase italic">Suivi Commandes</h1>
          <p className="text-zinc-500 font-bold mt-1 uppercase text-xs tracking-widest">Flux eShop & ePay</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-2 border-zinc-900 font-black uppercase text-xs">Exporter (CSV)</Button>
          <Button className="bg-zinc-900 font-black uppercase text-xs">Imprimer les Bons</Button>
        </div>
      </div>

      <Card className="border-4 border-zinc-900 overflow-hidden shadow-2xl bg-white">
        <div className="p-6 border-b-4 border-zinc-50 flex items-center justify-between">
           <div className="relative w-96">
             <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
             <input placeholder="Rechercher une commande..." className="w-full h-10 bg-zinc-50 border-2 border-zinc-100 rounded-xl pl-10 pr-4 text-xs font-bold" />
           </div>
           <div className="flex gap-2">
             <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest bg-zinc-900 text-white">Tout</Button>
             <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest text-zinc-400">En attente</Button>
             <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Validé</Button>
           </div>
        </div>
        
        <div className="divide-y-4 divide-zinc-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
              <p className="font-bold uppercase tracking-widest text-xs">Chargement des commandes...</p>
            </div>
          ) : tenantOrders.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-sm">Aucune commande trouvée</p>
            </div>
          ) : (
            tenantOrders.map((order) => (
              <div key={order.id} className="flex flex-col border-b-4 border-zinc-50 last:border-0">
                <div 
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-black text-xl text-zinc-900 tracking-tighter uppercase italic">{order.id}</p>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                          <User className="h-3 w-3" /> {order.customerName}
                        </p>
                        <p className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {order.date}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Montant ePay</p>
                      <p className="text-2xl font-black text-blue-600 tracking-tighter italic">{formatPrice(order.total)}</p>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant="outline" 
                         className={`border-2 border-zinc-900 h-10 w-10 p-0 transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''}`}
                       >
                         <ChevronRight className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" className="h-10 w-10 p-0 border-2 border-transparent">
                         <MoreVertical className="h-4 w-4 text-zinc-400" />
                       </Button>
                    </div>
                  </div>
                </div>
                
                {/* DÉTAILS DE LA COMMANDE */}
                {expandedOrderId === order.id && (
                  <div className="bg-zinc-50 p-6 border-t-2 border-zinc-100 flex gap-8">
                    <div className="flex-1">
                      <h4 className="font-black uppercase text-xs tracking-widest text-zinc-400 mb-4">Détails des Articles</h4>
                      <div className="space-y-3">
                        {order.items && order.items.length > 0 ? order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border-2 border-zinc-100">
                            <div className="flex items-center gap-4">
                              {/* Product Image */}
                              <div className="h-12 w-12 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.name || 'Produit'} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-5 w-5 text-zinc-400" />
                                )}
                              </div>
                              {/* Product Details */}
                              <div>
                                <p className="font-bold text-sm text-zinc-900">{item.name || `Produit (${item.productId || 'ID inconnu'})`}</p>
                                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Qté: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-black text-blue-600">{formatPrice((item.unitPrice || item.price || 0) * (item.quantity || 1))}</p>
                          </div>
                        )) : (
                          <p className="text-xs font-bold text-zinc-400 italic">Aucun article enregistré pour cette commande.</p>
                        )}
                      </div>
                    </div>
                    <div className="w-64 bg-white p-5 rounded-2xl border-2 border-zinc-100 h-fit">
                       <h4 className="font-black uppercase text-xs tracking-widest text-zinc-400 mb-4">Résumé Client</h4>
                       <p className="font-bold text-sm mb-1">{order.customerName}</p>
                       <p className="text-xs text-zinc-500 mb-4">Client KSM</p>
                       <div className="pt-4 border-t-2 border-zinc-50 space-y-2">
                         <Button className="w-full h-8 text-[10px] uppercase font-black tracking-widest bg-zinc-900">Valider</Button>
                         <Button variant="outline" className="w-full h-8 text-[10px] uppercase font-black tracking-widest">Contacter</Button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
