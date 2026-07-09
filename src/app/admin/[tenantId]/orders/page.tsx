'use client';

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
  ChevronRight
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useOrderStore } from '@/store/useOrderStore';
import { TENANTS } from '@/lib/mock-data';

export default function AdminOrdersPage() {
  const { tenantId } = useParams();
  const { orders } = useOrderStore();
  const tenant = TENANTS.find(t => t.slug === tenantId);

  if (!tenant) return null;

  const tenantOrders = orders.filter(o => o.tenantId === tenant.id);

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
          {tenantOrders.map((order) => (
            <div key={order.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-50 transition-colors">
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
                   <Button variant="outline" className="border-2 border-zinc-900 h-10 w-10 p-0">
                     <ChevronRight className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" className="h-10 w-10 p-0 border-2 border-transparent">
                     <MoreVertical className="h-4 w-4 text-zinc-400" />
                   </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
