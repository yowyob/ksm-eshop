import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { X, ShoppingBag, Calendar, Tag, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  customerId?: string;
}

export default function OrdersHistoryModal({ isOpen, onClose, userName, userEmail, customerId }: OrdersHistoryModalProps) {
  const { tenantId } = useParams(); // URL slug (tenant identifier)
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tenantId) {
      const fetchMyOrders = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/orders?organizationId=${tenantId}${customerId ? `&customerId=${customerId}` : ''}`);
          const data = await res.json();
          if (data.success && data.data) {
            let rawData = Array.isArray(data.data) ? data.data : (data.data.content || data.data.data || []);
            const mappedOrders = rawData.map((o: any) => {
              const orderNumMatch = (o.documentNumber || o.orderNumber || '').match(/\d+/);
              const num = orderNumMatch ? parseInt(orderNumMatch[0], 10) : 0;
              
              // Date réelle ou vide par défaut si manquante
              const dateString = o.createdAt 
                ? new Date(o.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : '';

              return {
                id: o.documentNumber || o.orderNumber || o.id,
                orderNum: num,
                customerName: o.counterparty?.name || o.customerThirdPartyId || o.counterpartyThirdPartyId || o.customerName || 'Client',
                customerId: o.counterparty?.id || o.customerThirdPartyId || o.counterpartyThirdPartyId || o.customerId,
                total: o.totalAmount || o.subtotalAmount || o.total || 0,
                status: o.status?.toLowerCase() || 'pending',
                createdAt: o.createdAt,
                date: dateString,
                tenantId: o.organizationId || o.tenantId || 't1', 
                items: o.lines || o.items || [],
              };
            });
            
            // Trier par le numéro de commande décroissant (plus récents en premier)
            const sortedOrders = mappedOrders.sort((a: any, b: any) => b.orderNum - a.orderNum);
            
            if (!customerId) {
               setCustomerOrders(sortedOrders.filter((o: any) => 
                 o.customerName.toLowerCase().includes(userName.toLowerCase()) || 
                 o.customerName.toLowerCase() === 'client ksm' ||
                 o.customerName === ''
               ));
            } else {
               setCustomerOrders(sortedOrders);
            }
          } else {
             setCustomerOrders([]);
          }
        } catch (e) {
          console.error("Error fetching orders:", e);
        }
        setIsLoading(false);
      };
      fetchMyOrders();
    }
  }, [isOpen, tenantId, customerId, userName]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs font-black uppercase tracking-tighter bg-amber-100 text-amber-800 rounded-full border border-amber-200">En attente</span>;
      case 'processing':
        return <span className="px-3 py-1 text-xs font-black uppercase tracking-tighter bg-blue-100 text-blue-800 rounded-full border border-blue-200">Traitement</span>;
      case 'shipped':
        return <span className="px-3 py-1 text-xs font-black uppercase tracking-tighter bg-purple-100 text-purple-800 rounded-full border border-purple-200">Expédié</span>;
      case 'delivered':
        return <span className="px-3 py-1 text-xs font-black uppercase tracking-tighter bg-green-100 text-green-800 rounded-full border border-green-200">Livré</span>;
      default:
        return <span className="px-3 py-1 text-xs font-black uppercase tracking-tighter bg-zinc-100 text-zinc-800 rounded-full border border-zinc-200">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden bg-white border-2 border-zinc-900 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-zinc-900 text-white border-b-2 border-zinc-900">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Historique de Commandes</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-zinc-500 font-bold text-sm">Chargement de vos commandes...</p>
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-800">Aucune commande</h3>
              <p className="text-zinc-500 font-bold text-sm">Vous n'avez pas encore passé de commande sur cette boutique.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {customerOrders.map((order) => (
                <div key={order.id} className="border-2 border-zinc-200 rounded-2xl p-5 hover:border-zinc-900 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-black uppercase italic text-zinc-900 tracking-tight text-lg">Commande {order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-500">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {order.date}</span>
                      {order.items && order.items.length > 0 && (
                        <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> {order.items.length} produit(s)</span>
                      )}
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="text-xs font-bold text-zinc-600 mt-2 bg-zinc-50 p-2.5 rounded-lg">
                        {order.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex flex-col gap-1 border-b border-zinc-100 last:border-0 pb-2 last:pb-0">
                            <div className="flex justify-between">
                              <span>{it.quantity}x {it.name}</span>
                              <span>{formatPrice(it.price * it.quantity || it.unitPrice * it.quantity || 0)}</span>
                            </div>
                            {it.selectedOptions && Object.keys(it.selectedOptions).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(it.selectedOptions).map(([key, val]) => (
                                  <span key={key} className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest font-black">
                                    {key}: {val as string}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col justify-between items-end border-t md:border-t-0 pt-3 md:pt-0">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Total Payé</span>
                    <span className="text-2xl font-black text-blue-600 tracking-tighter italic">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-zinc-50 border-t-2 border-zinc-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-widest">KSM Encryption</span>
          </div>
          <Button onClick={onClose} className="bg-zinc-900 text-white font-bold text-xs uppercase px-5">
            Fermer
          </Button>
        </div>

      </div>
    </div>
  );
}
