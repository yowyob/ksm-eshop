'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, Users, ShoppingCart, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { tenantId } = useParams() as { tenantId: string };
  const router = useRouter();

  const [stats, setStats] = useState({
    products: 0,
    clients: 0,
    orders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const t = Date.now();
        // Fetch Products count
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

        // Fetch Clients count
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

        // Fetch Orders count
        const ordersRes = await fetch(`/api/orders?organizationId=${tenantId}&size=1000&t=${t}`);
        const ordersData = await ordersRes.json();
        let ordersCount = 0;
        if (ordersData.success || ordersRes.ok) {
           const raw = ordersData.data || ordersData;
           if (raw?.totalElements !== undefined) ordersCount = raw.totalElements;
           else if (raw?.total !== undefined) ordersCount = raw.total;
           else if (Array.isArray(raw)) ordersCount = raw.length;
           else if (raw?.content && Array.isArray(raw.content)) ordersCount = raw.content.length;
           else if (raw?.data && Array.isArray(raw.data)) ordersCount = raw.data.length;
        }

        setStats({
          products: productsCount,
          clients: clientsCount,
          orders: ordersCount
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">Tableau de bord</h1>
        <p className="text-zinc-500 font-medium">Vue d'ensemble de l'organisation et résumé des activités.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products Stat Card */}
        <Card className="border-2 border-zinc-200 bg-white hover:border-blue-600 transition-colors shadow-sm rounded-3xl overflow-hidden group">
          <CardHeader className="p-6 bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between group-hover:bg-blue-50/50 transition-colors">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-600 transition-colors">
              Produits en catalogue
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
              Clients Enregistrés
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

        {/* Orders Stat Card */}
        <Card className="border-2 border-zinc-200 bg-white hover:border-amber-600 transition-colors shadow-sm rounded-3xl overflow-hidden group">
          <CardHeader className="p-6 bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between group-hover:bg-amber-50/50 transition-colors">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-amber-600 transition-colors">
              Commandes (Global)
            </CardTitle>
            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-zinc-900 mb-4">{stats.orders}</div>
            <Link href={`/admin/${tenantId}/orders`} className="flex items-center text-amber-600 font-black uppercase tracking-widest text-xs hover:text-amber-700">
              Gérer les commandes <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
