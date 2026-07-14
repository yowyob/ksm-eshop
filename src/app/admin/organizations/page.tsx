'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Organization } from '@/lib/types';
import {
  Building2,
  LogOut,
  ShieldCheck,
  Store,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function OrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/organizations/my');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();

      if (res.ok) {
        let list: Organization[] = [];
        const raw = data.data;
        if (Array.isArray(raw)) list = raw;
        else if (raw?.content && Array.isArray(raw.content)) list = raw.content;
        else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
        setOrgs(list);
      } else {
        setError(data.message || 'Erreur lors de la récupération des organisations.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase italic tracking-tighter text-zinc-900">KSM Core</h1>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Global Admin Layer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isMounted && (
              <>
                <span className="text-xs font-medium text-zinc-500 mr-4">
                  Connecté en tant que: <strong className="text-zinc-900">{user?.name || 'Inconnu'}</strong>
                </span>
                {(user?.email?.toLowerCase().trim() === 'atenaornella@gmail.com' || 
                  user?.username?.toLowerCase().trim() === 'atenaornella@gmail.com' || 
                  user?.name?.toLowerCase().trim() === 'atenaornella@gmail.com') && (
                  <Button onClick={() => router.push('/admin/super-admin')} className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Super Admin
                  </Button>
                )}
              </>
            )}
            <Button onClick={handleLogout} variant="ghost" className="text-zinc-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 mb-2">Organisations</h2>
            <p className="text-zinc-500 font-medium">Gérez l'ensemble des boutiques et locataires de la plateforme KSM.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-2xl mb-8 flex items-center gap-4">
            <ShieldCheck className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-black uppercase tracking-tighter text-lg">Erreur de chargement</h3>
              <p className="font-medium text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-zinc-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-zinc-200">
            <Building2 className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Aucune Organisation</h3>
            <p className="text-zinc-500 mt-2">Commencez par ajouter votre première organisation sur KSM.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs.map((org) => (
              <Card key={org.id} className="group border-2 border-zinc-200 bg-white hover:border-blue-600 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-600/10 rounded-3xl overflow-hidden cursor-pointer flex flex-col" onClick={() => router.push(`/admin/${org.id}`)}>
                <CardHeader className="bg-zinc-50/50 p-6 border-b border-zinc-100 group-hover:bg-blue-50/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 bg-white border-2 border-zinc-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-blue-600 transition-colors">
                      <Store className="h-6 w-6 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Actif
                    </span>
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter text-zinc-900 line-clamp-1">
                    {org.displayName || org.shortName || org.longName || org.name || org.code || 'Boutique Sans Nom'}
                  </CardTitle>
                  <p className="text-zinc-500 font-medium text-xs mt-1">
                    ID: {org.id}
                  </p>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between text-blue-600 mt-4 group-hover:translate-x-2 transition-transform">
                    <span className="font-black uppercase tracking-widest text-xs">Accéder au Dashboard</span>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
