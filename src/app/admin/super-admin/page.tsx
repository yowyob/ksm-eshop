'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Store,
  User,
  MoreVertical,
  Ban,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    logout();
    router.push('/admin/login');
  };
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'users' | 'organizations'>('organizations');
  const [search, setSearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [suspendedOrgs, setSuspendedOrgs] = useState<Record<string, boolean>>({});
  const [suspendMenuOpen, setSuspendMenuOpen] = useState<string | null>(null); // orgId open

  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalOrganizations: 0,
    orgsWithOrders: 0,
    orders: [] as any[],
    organizations: [] as any[],
    users: [] as any[],
  });

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    
    if (user) {
      const email = user.email?.toLowerCase().trim();
      const username = user.username?.toLowerCase().trim();
      if (email !== 'testk965@yowyob.com' && username !== 'testk965@yowyob.com') {
        router.push('/admin/organizations');
        return;
      }
    } else {
      // Attendre que l'utilisateur soit chargé avant de rediriger
      return;
    }

    const fetchStats = async () => {
      try {
        const statsRes = await fetch('/api/admin/super-stats');
        const statsData = await statsRes.json();

        if (statsData.success) {
          setStats({
            totalTransactions: statsData.data.totalTransactions,
            totalRevenue: statsData.data.totalRevenue,
            totalUsers: statsData.data.totalUsers,
            totalOrganizations: statsData.data.totalOrganizations,
            orgsWithOrders: statsData.data.orgsWithOrders,
            orders: statsData.data.orders || [],
            organizations: statsData.data.organizations || [],
            users: statsData.data.users || [],
          });
          // Charger l'état de suspension depuis l'API
          try {
            const suspendRes = await fetch('/api/organizations?includeAll=true');
            const suspendData = await suspendRes.json();
            if (suspendData.success && Array.isArray(suspendData.data)) {
              const map: Record<string, boolean> = {};
              suspendData.data.forEach((o: any) => { if (o._suspended) map[o.id] = true; });
              setSuspendedOrgs(map);
            }
          } catch {}
        }
      } catch (err) {
        console.error('Erreur chargement super admin', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isMounted, isAuthenticated, user, router]);

  const filteredOrders = stats.orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (o.orderNumber || o.documentNumber || o.id || '').toLowerCase().includes(q) ||
      (o._orgName || '').toLowerCase().includes(q) ||
      (o._customerName || '').toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    // Extraire le numéro de commande numérique (ex: KSM-878462 -> 878462)
    const getOrderNum = (order: any): number => {
      const match = (order.orderNumber || order.documentNumber || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };
    return getOrderNum(b) - getOrderNum(a);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" />
        <p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">
          Interrogation des organisations du Kernel...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase italic tracking-tighter text-white">KSM Super Admin</h1>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Accès Restreint</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="text-zinc-400 hover:text-red-500 hover:bg-zinc-800 font-bold text-xs uppercase tracking-widest">
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 mb-4">Vue Globale KSM</h2>
          <p className="text-zinc-500 font-medium">
            Données consolidées depuis <strong>{stats.totalOrganizations}</strong> organisations sur le Kernel.
            Revenus KSM calculés à <strong>5%</strong> par commande.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-12">

          <Card className={`border-2 shadow-xl rounded-3xl bg-white overflow-hidden cursor-pointer hover:scale-[1.02] transition-all col-span-1 ${activeTab === 'organizations' ? 'border-blue-600 ring-4 ring-blue-600/20' : 'border-zinc-200 hover:border-blue-500'}`}
            onClick={() => setActiveTab('organizations')}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-11 w-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                <Building2 className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Orgs</h3>
              <p className="text-3xl font-black text-zinc-900">{stats.totalOrganizations}</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl rounded-3xl bg-white overflow-hidden border-zinc-200 col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-11 w-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                <Users className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Utilisateurs</h3>
              <p className="text-3xl font-black text-zinc-900">{stats.totalUsers}</p>
            </CardContent>
          </Card>

          <Card
            className={`border-2 shadow-xl rounded-3xl bg-white overflow-hidden cursor-pointer hover:scale-[1.02] transition-all col-span-1 ${activeTab === 'transactions' ? 'border-purple-600 ring-4 ring-purple-600/20' : 'border-zinc-200 hover:border-purple-500'}`}
            onClick={() => setActiveTab('transactions')}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-11 w-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3">
                <CreditCard className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Transactions</h3>
              <p className="text-3xl font-black text-zinc-900">{stats.totalTransactions}</p>
              <div className="mt-2 text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Voir la liste
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl rounded-3xl bg-white overflow-hidden border-zinc-200 col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-11 w-11 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3">
                <AlertTriangle className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Incidents</h3>
              <p className="text-3xl font-black text-zinc-900">0</p>
              <div className="mt-2 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Aucun incident
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-500 shadow-xl shadow-amber-500/10 rounded-3xl bg-amber-50 overflow-hidden col-span-2 md:col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-11 w-11 bg-amber-500 text-white rounded-xl flex items-center justify-center mb-3 shadow-md shadow-amber-500/30">
                <TrendingUp className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Revenu KSM (5%)</h3>
              <p className="text-2xl font-black text-amber-600">{formatPrice(stats.totalRevenue)}</p>
              <p className="text-[9px] text-zinc-400 font-bold mt-1 uppercase">Sur Volume d'Affaires Brut : {formatPrice(stats.totalRevenue * 20)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-3xl p-8 border-2 border-zinc-200 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-zinc-100 gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">Historique des Transactions</h3>
                  <p className="text-zinc-500 font-medium text-sm">
                    {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} trouvée{filteredOrders.length !== 1 ? 's' : ''} sur {stats.totalOrganizations} organisations.
                  </p>
                </div>
              </div>
              {/* Search */}
              <input
                type="text"
                placeholder="Rechercher une commande, client, org..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-72 px-4 py-2 rounded-xl border-2 border-zinc-200 focus:border-purple-500 focus:outline-none text-sm font-medium text-zinc-700 bg-zinc-50"
              />
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest">Aucune transaction trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-zinc-100">
                      <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 pr-4">ID Commande</th>
                      <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 pr-4">Date</th>
                      <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 pr-4">Organisation</th>
                      <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 pr-4">Client</th>
                      <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 pr-4">Montant</th>
                      <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 text-right">Commission KSM (5%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredOrders.map((order, i) => {
                      let amount = order.grossAmount || order.netAmount || order.totalAmount || order.total;
                      if (!amount) {
                        if (order.lines && Array.isArray(order.lines)) {
                          amount = order.lines.reduce((sub: number, line: any) => sub + ((line.unitPrice || line.price || 0) * (line.quantity || 0)), 0);
                        } else if (order.quantity && order.unitPrice) {
                          amount = order.quantity * order.unitPrice;
                        }
                      }
                      amount = amount || 0;
                      const commission = amount * 0.05;
                      // Afficher uniquement la vraie date du Kernel, ou laisser vide si non disponible
                      const rawDate = order.createdAt || order.orderDate || order.date || order.createdDate || order.createdTime || null;
                      const date = rawDate
                        ? new Date(rawDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '';

                      const customerName = order._customerName || '—';

                      return (
                        <tr key={order.id || i} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-4 pr-4 font-mono text-xs text-zinc-900 font-bold">
                            {order.orderNumber || order.documentNumber || order.id?.substring(0, 8) || `CMD-${i + 1}`}
                          </td>
                          <td className="py-4 pr-4 text-xs text-zinc-500 font-medium whitespace-nowrap">{date}</td>
                          <td className="py-4 pr-4">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                              {order._orgName || '—'}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-zinc-700">
                                {customerName}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 pr-4 font-black text-zinc-900 text-sm">
                            {formatPrice(amount)} <span className="text-xs text-zinc-400 font-bold">CFA</span>
                          </td>
                          <td className="py-4 font-black text-amber-600 text-right text-sm">
                            + {formatPrice(commission)} <span className="text-xs text-amber-400 font-bold">CFA</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Total row */}
                  <tfoot>
                    <tr className="border-t-2 border-zinc-200 bg-amber-50">
                      <td colSpan={4} className="pt-4 pb-2 font-black text-sm uppercase tracking-widest text-zinc-700">
                        Total plateforme ({filteredOrders.length} commandes)
                      </td>
                      <td className="pt-4 pb-2 font-black text-zinc-900">
                        {formatPrice(filteredOrders.reduce((acc, o) => {
                          let a = o.grossAmount || o.netAmount || o.totalAmount || o.total;
                          if (!a && o.lines) a = o.lines.reduce((s: number, l: any) => s + ((l.unitPrice || 0) * (l.quantity || 0)), 0);
                          if (!a && o.quantity) a = o.quantity * (o.unitPrice || 0);
                          return acc + (a || 0);
                        }, 0))} <span className="text-xs text-zinc-400">CFA</span>
                      </td>
                      <td className="pt-4 pb-2 font-black text-amber-600 text-right">
                        + {formatPrice(stats.totalRevenue)} <span className="text-xs text-amber-400">CFA</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}




        {/* Organizations Tab (All Orgs) */}
        {activeTab === 'organizations' && (
          <div
            className="bg-white rounded-3xl p-8 border-2 border-zinc-200 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-500"
            onClick={() => suspendMenuOpen && setSuspendMenuOpen(null)}
          >
            <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 mb-6 pb-4 border-b border-zinc-100">
              Toutes les Organisations ({stats.totalOrganizations})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.organizations
                .map((org: any) => {
                  const orgOrders = stats.orders.filter((o: any) => o._orgId === org.id);
                  const orgRevenue = orgOrders.reduce((acc, o) => {
                    let a = o.grossAmount || o.netAmount || o.totalAmount || o.total;
                    if (!a && o.lines) a = o.lines.reduce((s: number, l: any) => s + ((l.unitPrice || 0) * (l.quantity || 0)), 0);
                    if (!a && o.quantity) a = o.quantity * (o.unitPrice || 0);
                    return acc + (a || 0);
                  }, 0);
                  return { org, count: orgOrders.length, revenue: orgRevenue };
                })
                .sort((a, b) => b.count - a.count)
                .map(({ org, count, revenue }) => {
                  const isSuspended = suspendedOrgs[org.id] === true;
                  
                  // Utiliser le plan réel de l'organisation ('free', 'monthly', 'annual')
                  const planId = org.subscriptionPlan || 'free';
                  const planType = planId === 'annual' 
                    ? { name: 'Plan Annuel', color: 'bg-amber-100 text-amber-800 border-amber-200' }
                    : planId === 'monthly'
                      ? { name: 'Plan Mensuel', color: 'bg-blue-100 text-blue-800 border-blue-200' }
                      : { name: 'Free Plan', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' };

                  const totalRevenueAll = stats.orders.reduce((acc, o) => {
                    let a = o.grossAmount || o.netAmount || o.totalAmount || o.total;
                    if (!a && o.lines) a = o.lines.reduce((s: number, l: any) => s + ((l.unitPrice || 0) * (l.quantity || 0)), 0);
                    if (!a && o.quantity) a = o.quantity * (o.unitPrice || 0);
                    return acc + (a || 0);
                  }, 0) || 1;

                  const revenuePercentage = Math.round((revenue / totalRevenueAll) * 100);

                  return (
                    <div
                      key={org.id}
                      className={`relative flex flex-col justify-between p-6 rounded-3xl border-2 transition-all duration-300 ${
                        isSuspended 
                          ? 'border-red-200 bg-red-50/40 opacity-75 shadow-sm' 
                          : count > 0 
                            ? 'border-zinc-100 hover:border-blue-300 hover:shadow-xl bg-white shadow-sm' 
                            : 'border-zinc-50 hover:border-zinc-200 bg-white/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md ${
                            isSuspended 
                              ? 'bg-red-500' 
                              : count > 0 ? 'bg-blue-600' : 'bg-zinc-400'
                          }`}>
                            {(org.displayName || org.shortName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-zinc-950 text-sm truncate leading-tight">{org.displayName || org.shortName}</p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">{org.id.slice(0, 13)}...</p>
                          </div>
                        </div>

                        {/* Dropdown 3 dots */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSuspendMenuOpen(suspendMenuOpen === org.id ? null : org.id); }}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {suspendMenuOpen === org.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border-2 border-zinc-200 shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setSuspendMenuOpen(null);
                                  const newState = !isSuspended;
                                  try {
                                    const res = await fetch(`/api/admin/organizations/${org.id}/suspend`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ suspended: newState })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setSuspendedOrgs(prev => {
                                        const next = { ...prev };
                                        if (newState) next[org.id] = true;
                                        else delete next[org.id];
                                        return next;
                                      });
                                    }
                                  } catch {}
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                                  isSuspended
                                    ? 'hover:bg-emerald-50 text-emerald-700'
                                    : 'hover:bg-red-50 text-red-600'
                                }`}
                              >
                                {isSuspended
                                  ? <><CheckCircle2 className="h-4 w-4" /> Réactiver</>  
                                  : <><Ban className="h-4 w-4" /> Suspendre</>
                                }
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subscription Info & Orders count */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${planType.color}`}>
                          {planType.name}
                        </span>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                          {count} commande{count > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Revenue Progress & Market Share */}
                      {count > 0 ? (
                        <div className="space-y-2 border-t border-zinc-100 pt-4 mt-2">
                          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <span>Part de marché</span>
                            <span className="text-blue-600 font-black">{revenuePercentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.max(3, revenuePercentage)}%` }} />
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Gain KSM (5%)</span>
                            <span className="text-sm font-black text-amber-600">+{formatPrice(revenue * 0.05)} <span className="text-[10px] font-bold">CFA</span></span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 bg-zinc-50 rounded-xl border border-zinc-100 mt-2">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Aucune vente enregistrée</p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
            {stats.organizations.length === 0 && (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest">Aucune organisation trouvée</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
