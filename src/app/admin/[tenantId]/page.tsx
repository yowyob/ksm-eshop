'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, Users, ShoppingCart, Loader2, ArrowRight, TrendingUp, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { tenantId } = useParams() as { tenantId: string };
  const router = useRouter();

  const [stats, setStats] = useState({
    products: 0,
    clients: 0,
    orders: 0,
    revenue: 0,
    recentOrders: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const t = Date.now();
        
        // Fetch Products
        const prodRes = await fetch(`/api/admin/products?organizationId=${tenantId}&size=1000&t=${t}`);
        if (prodRes.status === 401) {
          router.push('/admin/login');
          return;
        }
        const prodData = await prodRes.json();
        let productsCount = 0;
        if (prodData.success || prodRes.ok) {
          const raw = prodData.data || prodData;
          if (raw?.totalElements !== undefined) productsCount = raw.totalElements;
          else if (raw?.total !== undefined) productsCount = raw.total;
          else if (Array.isArray(raw)) productsCount = raw.length;
          else if (raw?.content && Array.isArray(raw.content)) productsCount = raw.content.length;
          else if (raw?.data && Array.isArray(raw.data)) productsCount = raw.data.length;
        }

        // Fetch Clients
        const clientsRes = await fetch(`/api/admin/clients?organizationId=${tenantId}&size=1000&t=${t}`);
        const clientsData = await clientsRes.json();
        let clientsCount = 0;
        if (clientsData.success || clientsRes.ok) {
           const raw = clientsData.data || clientsData;
           if (raw?.totalElements !== undefined) clientsCount = raw.totalElements;
           else if (raw?.total !== undefined) clientsCount = raw.total;
           else if (Array.isArray(raw)) clientsCount = raw.length;
           else if (raw?.content && Array.isArray(raw.content)) clientsCount = raw.content.length;
           else if (raw?.data && Array.isArray(raw.data)) clientsCount = raw.data.length;
        }

        // Fetch Orders
        const ordersRes = await fetch(`/api/orders?organizationId=${tenantId}&size=1000&t=${t}`);
        const ordersData = await ordersRes.json();
        let ordersCount = 0;
        let revenue = 0;
        let recentOrders = [];
        
        if (ordersData.success || ordersRes.ok) {
           const raw = ordersData.data || ordersData;
           const ordersList = Array.isArray(raw) ? raw : (raw?.content || raw?.data || []);
           
           if (raw?.totalElements !== undefined) ordersCount = raw.totalElements;
           else if (raw?.total !== undefined) ordersCount = raw.total;
           else ordersCount = ordersList.length;
           
           // Le tenant reçoit 95% du total (5% vont à la plateforme)
           const totalAmount = ordersList.reduce((acc: number, o: any) => {
             let amt = o.grossAmount || o.netAmount || o.totalAmount || o.total;
             if (!amt) {
               if (o.lines && Array.isArray(o.lines)) {
                 amt = o.lines.reduce((sub: number, line: any) => sub + ((line.unitPrice || line.price || 0) * (line.quantity || 0)), 0);
               } else if (o.quantity && o.unitPrice) {
                 amt = o.quantity * o.unitPrice;
               }
             }
             return acc + (amt || 0);
           }, 0);
           revenue = totalAmount * 0.95;
           
           recentOrders = ordersList.sort((a: any, b: any) => {
             const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
             const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
             return dB - dA;
           }).slice(0, 5);
        }

        setStats({
          products: productsCount,
          clients: clientsCount,
          orders: ordersCount,
          revenue,
          recentOrders
        });
      } catch (err: any) {
        setError("Erreur lors de la récupération des statistiques.");
      } finally {
        setLoading(false);
      }
    }

    if (tenantId) {
      fetchStats();
    }
  }, [tenantId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
        <p className="font-bold uppercase tracking-widest text-sm">Chargement du Tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">Tableau de bord</h1>
        <p className="text-zinc-500 font-medium">Vue d'ensemble de votre boutique et résumé de vos activités.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Stat Card */}
        <Card className="border-2 border-amber-500 bg-amber-50 shadow-xl shadow-amber-500/10 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform">
          <CardHeader className="p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700">
              Revenus Net (-5%)
            </CardTitle>
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-4xl font-black text-amber-600 mb-4">{formatPrice(stats.revenue)}</div>
            <div className="text-xs font-bold text-amber-600/70 uppercase tracking-widest">Générés par la boutique</div>
          </CardContent>
        </Card>
        
        {/* Orders Stat Card */}
        <Card className="border-2 border-zinc-200 bg-white hover:border-purple-600 transition-colors shadow-sm rounded-3xl overflow-hidden group">
          <CardHeader className="p-6 bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between group-hover:bg-purple-50/50 transition-colors">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-purple-600 transition-colors">
              Commandes
            </CardTitle>
            <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-zinc-900 mb-4">{stats.orders}</div>
            <Link href={`/admin/${tenantId}/orders`} className="flex items-center text-purple-600 font-black uppercase tracking-widest text-xs hover:text-purple-700">
              Gérer les commandes <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        {/* Products Stat Card */}
        <Card className="border-2 border-zinc-200 bg-white hover:border-blue-600 transition-colors shadow-sm rounded-3xl overflow-hidden group">
          <CardHeader className="p-6 bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between group-hover:bg-blue-50/50 transition-colors">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-600 transition-colors">
              Produits
            </CardTitle>
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-zinc-900 mb-4">{stats.products}</div>
            <Link href={`/admin/${tenantId}/products`} className="flex items-center text-blue-600 font-black uppercase tracking-widest text-xs hover:text-blue-700">
              Gérer les produits <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        {/* Clients Stat Card */}
        <Card className="border-2 border-zinc-200 bg-white hover:border-emerald-600 transition-colors shadow-sm rounded-3xl overflow-hidden group">
          <CardHeader className="p-6 bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between group-hover:bg-emerald-50/50 transition-colors">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-emerald-600 transition-colors">
              Clients
            </CardTitle>
            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-zinc-900 mb-4">{stats.clients}</div>
            <Link href={`/admin/${tenantId}/clients`} className="flex items-center text-emerald-600 font-black uppercase tracking-widest text-xs hover:text-emerald-700">
              Voir les clients <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl p-8 border-2 border-zinc-200 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">Dernières Commandes</h3>
              <p className="text-zinc-500 font-medium text-sm">Les 5 dernières commandes enregistrées sur votre boutique.</p>
            </div>
          </div>
          <Link href={`/admin/${tenantId}/orders`}>
            <div className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer">
              Voir tout
            </div>
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest">Aucune commande récente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-zinc-100">
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">ID Commande</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Date</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Client</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Statut</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {stats.recentOrders.map((order, i) => {
                  let amount = order.grossAmount || order.netAmount || order.totalAmount || order.total;
                  if (!amount) {
                    if (order.lines && Array.isArray(order.lines)) {
                      amount = order.lines.reduce((sub: number, line: any) => sub + ((line.unitPrice || line.price || 0) * (line.quantity || 0)), 0);
                    } else if (order.quantity && order.unitPrice) {
                      amount = order.quantity * order.unitPrice;
                    }
                  }
                  amount = amount || 0;
                  const date = order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR') : (order.date || 'Récent');
                  const customerName = order._customerName || order.counterparty?.name || order.counterparty?.displayName || order.counterparty?.longName || order.customerName || order.clientName || (order.counterpartyThirdPartyId ? `Client-${String(order.counterpartyThirdPartyId).substring(0,8)}` : 'Client Inconnu');
                  const status = order.status || 'PENDING';
                  
                  return (
                    <tr key={order.id || i} className="hover:bg-zinc-50 transition-colors group">
                      <td className="py-4 font-mono text-sm text-zinc-900 font-bold">
                        {order.orderNumber || order.documentNumber || order.id?.substring(0,8) || `CMD-${i}`}
                      </td>
                      <td className="py-4 text-sm text-zinc-500 font-medium">{date}</td>
                      <td className="py-4 text-sm font-bold text-zinc-900">
                        {customerName}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          status.toUpperCase() === 'PAID' || status.toUpperCase() === 'COMPLETED' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 font-black text-zinc-900 text-right">
                        {formatPrice(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
