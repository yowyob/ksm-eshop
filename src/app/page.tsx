'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Zap, Globe, BarChart3, ArrowRight, Building2, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Organization } from '@/lib/types';

export default function KSMCoreLandingPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/organizations');
      const data = await res.json();
      if (data.success) {
        let list: Organization[] = [];
        const raw = data.data;
        if (Array.isArray(raw)) list = raw;
        else if (raw?.content && Array.isArray(raw.content)) list = raw.content;
        else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
        else if (raw && typeof raw === 'object') list = [raw];
        setOrganizations(list);
      } else {
        setError(data.message || 'Impossible de charger les organisations depuis le kernel.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Définir des couleurs thématiques dynamiques basées sur l'ID/nom
  const getThemeColor = (index: number) => {
    const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2'];
    return colors[index % colors.length];
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 font-sans text-zinc-950">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-zinc-200 bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase">KSM eShop</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors">Fonctionnalités</Link>
            <Link href="#tenants" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors">Boutiques</Link>
          </nav>
          <div className="flex gap-4">
             <Link href="/admin/organizations">
               <Button variant="outline" className="border-zinc-300 font-bold hover:bg-zinc-50">Espace Admin Kernel</Button>
             </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section - Premium & Explanatory */}
        <section className="relative py-24 md:py-32 bg-white border-b border-zinc-200 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200">
              Plateforme Multi-Boutiques Camerounaise
            </span>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl text-zinc-900 mt-6 leading-[1.1]">
              Toutes vos boutiques préférées <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">au même endroit.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg md:text-xl text-zinc-600 font-medium leading-relaxed">
              KSM eShop rassemble les meilleures enseignes commerciales locales sur une seule et unique plateforme. 
              Naviguez d'une boutique à l'autre, consultez leurs stocks en temps réel et achetez en toute simplicité.
            </p>
            <div className="mt-12 flex justify-center gap-4 flex-wrap">
              <Link href="#tenants">
                <Button size="lg" className="h-16 px-10 text-lg gap-3 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl transition-all hover:scale-105 font-bold rounded-2xl">
                  Parcourir les vitrines <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Brand Concept Section */}
        <section className="py-20 bg-zinc-50 border-b border-zinc-200">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="border-2 border-zinc-200 bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 italic">1. Choisissez votre enseigne</h3>
                <p className="mt-3 text-sm font-medium text-zinc-500 leading-relaxed">
                  Chaque vendeur possède son propre espace personnalisé, ses produits uniques et sa gestion logistique autonome.
                </p>
              </Card>
              <Card className="border-2 border-zinc-200 bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 italic">2. Stock 100% réel</h3>
                <p className="mt-3 text-sm font-medium text-zinc-500 leading-relaxed">
                  Grâce à la synchronisation directe avec le Kernel KSM, les stocks physiques en magasin correspondent à la vitrine web.
                </p>
              </Card>
              <Card className="border-2 border-zinc-200 bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 italic">3. Paiement Unique ePay</h3>
                <p className="mt-3 text-sm font-medium text-zinc-500 leading-relaxed">
                  Réglez vos achats en toute confiance avec votre portefeuille centralisé ePay KSM, rapide et crypté.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Boutiques Section - Grille dynamique connectée au Kernel */}
        <section id="tenants" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter italic">Visitez les Boutiques Partenaires</h2>
              <p className="mt-2 text-zinc-500 font-bold uppercase text-xs tracking-widest">Sélectionnez une enseigne pour commencer vos achats</p>
              <div className="h-1.5 w-24 bg-blue-600 mx-auto mt-4 rounded-full" />
            </div>
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Chargement des vitrines en direct...</p>
              </div>
            )}

            {error && (
              <div className="max-w-2xl mx-auto bg-amber-50 border-2 border-amber-300 p-8 rounded-2xl text-center">
                <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight mb-2">Authentification Kernel Requise</h3>
                <p className="text-sm text-amber-800 font-medium mb-6">
                  {error} <br />
                  <span className="text-xs text-amber-700 mt-2 block font-normal">
                    (Veuillez fournir le code MFA pour activer la synchronisation live)
                  </span>
                </p>
                <Button onClick={fetchOrganizations} variant="outline" className="border-amber-700 text-amber-900 hover:bg-amber-100 font-bold">
                  Réessayer la connexion
                </Button>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:max-w-5xl mx-auto">
                {organizations.map((org, idx) => {
                  const themeColor = getThemeColor(idx);
                  const displayName = org.displayName || org.shortName || org.longName || org.name || "Boutique Partenaire";
                  return (
                    <Card key={org.id} className="group hover:border-zinc-900 transition-all duration-300 overflow-hidden border-2 border-zinc-200 rounded-3xl shadow-sm hover:shadow-xl">
                      <CardContent className="p-0">
                        <div className="p-8">
                          <div className="flex items-center gap-5 mb-6">
                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner shrink-0" style={{ backgroundColor: themeColor }}>
                              {displayName[0].toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase italic">{displayName}</h3>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Enseigne Officielle</p>
                            </div>
                          </div>
                          <p className="text-zinc-500 font-bold text-sm mb-8 leading-relaxed line-clamp-2">
                            {org.description || `Bienvenue chez ${displayName}. Venez découvrir notre large gamme de produits de qualité et nos stocks synchronisés en temps réel.`}
                          </p>
                          <Link href={`/${org.id}`}>
                            <Button className="w-full h-14 text-md font-black uppercase tracking-wider shadow-md hover:opacity-90 transition-opacity rounded-xl text-white" style={{ backgroundColor: themeColor }}>
                              Entrer dans la boutique
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {organizations.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white rounded-2xl border-2 border-dashed border-zinc-300">
                    <Building2 className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                    <p className="text-zinc-500 font-bold uppercase text-sm">Aucune organisation trouvée dans le kernel.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section Commerçant - Sombre pour trancher */}
        <section className="py-20 bg-zinc-950 text-white relative overflow-hidden border-t-2 border-zinc-900">
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Espace Logistique & Administration</h2>
            <p className="mt-4 text-zinc-400 font-medium max-w-xl mx-auto text-sm leading-relaxed">
              Gérants de boutiques ? Connectez-vous à votre interface pour piloter vos stocks physiques, suivre vos transactions et administrer vos clients.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/admin/organizations">
                <Button variant="outline" className="border-2 border-zinc-700 text-white hover:bg-white hover:text-black font-black uppercase text-xs tracking-wider h-14 px-8 rounded-xl shadow-lg transition-all">
                  Accéder au Panneau d'Administration
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features - Éléments visuels clairs */}
        <section id="features" className="py-24 bg-zinc-50 border-t border-zinc-200">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-black text-center text-zinc-900 uppercase italic tracking-tighter mb-16">Propulsé par la Suite KSM</h2>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center group">
                <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors border-2 border-blue-100">
                  <Zap className="h-10 w-10 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 uppercase italic">Stock Synchrone</h3>
                <p className="mt-3 text-zinc-500 font-bold text-xs leading-relaxed max-w-xs">
                  Mise à jour automatique et instantanée entre vos dépôts physiques et le eShop.
                </p>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="h-20 w-20 bg-green-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors border-2 border-green-100">
                  <ShieldCheck className="h-10 w-10 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 uppercase italic">ePay Intégré</h3>
                <p className="mt-3 text-zinc-500 font-bold text-xs leading-relaxed max-w-xs">
                  Sécurité des règlements électroniques par prélèvements cryptés et traçables.
                </p>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="h-20 w-20 bg-purple-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors border-2 border-purple-100">
                  <Globe className="h-10 w-10 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 uppercase italic">Multi-Tenancy</h3>
                <p className="mt-3 text-zinc-500 font-bold text-xs leading-relaxed max-w-xs">
                  Chaque vendeur est 100% autonome avec sa marque et sa logistique propre.
                </p>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="h-20 w-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors border-2 border-orange-100">
                  <BarChart3 className="h-10 w-10 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 uppercase italic">Analytics Pro</h3>
                <p className="mt-3 text-zinc-500 font-bold text-xs leading-relaxed max-w-xs">
                  Suivez votre performance commerciale, vos ventes et vos stocks par boutique.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Pro - Client side */}
      <footer className="py-16 bg-zinc-900 text-zinc-400 border-t-2 border-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="text-lg font-black tracking-tight text-white uppercase italic">KSM eShop</span>
              </div>
              <p className="text-xs font-bold leading-relaxed max-w-sm">
                La première plateforme camerounaise multi-boutiques connectée en direct avec le progiciel Kernel Core pour une gestion logistique parfaite.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-white font-black uppercase text-xs tracking-widest">Liens Utiles</h3>
              <ul className="space-y-2 text-xs font-bold uppercase">
                <li><Link href="#features" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="#tenants" className="hover:text-white transition-colors">Explorer les Boutiques</Link></li>
                <li><Link href="/admin/organizations" className="hover:text-white transition-colors">Espace Gérant</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-white font-black uppercase text-xs tracking-widest">Informations</h3>
              <p className="text-xs font-bold">Douala, Cameroun</p>
              <p className="text-xs font-bold text-zinc-500">Intégration technologique de pointe pour les PME locales.</p>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">&copy; 2026 KSM Core System. Tous droits réservés.</p>
            <div className="flex items-center gap-2 text-zinc-600">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] uppercase font-black tracking-widest">Sécurité Chiffrée Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
