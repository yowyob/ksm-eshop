'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import ProductCard from '@/components/shop/ProductCard';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, LayoutGrid, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { KernelProduct, Organization, Product } from '@/lib/types';

export default function ShopHomePage() {
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShopData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Charger l'organisation pour avoir son nom/description
        const orgsRes = await fetch('/api/organizations');
        const orgsData = await orgsRes.json();
        if (orgsData.success) {
          const raw = orgsData.data;
          let list: Organization[] = [];
          if (Array.isArray(raw)) list = raw;
          else if (raw?.content && Array.isArray(raw.content)) list = raw.content;
          else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
          const found = list.find(o => o.id === tenantId || o.code === tenantId);
          if (found) {
            setOrganization(found);
          } else {
            setOrganization({ id: tenantId, name: 'Boutique Officielle', description: `Boutique officielle .` });
          }
        }

        // 2. Charger les produits réels de cette organisation
        const prodRes = await fetch(`/api/organizations/${encodeURIComponent(tenantId)}/products`);
        const prodData = await prodRes.json();

        if (prodData.success) {
          const rawProds = prodData.data;
          let rawList: KernelProduct[] = [];
          if (Array.isArray(rawProds)) rawList = rawProds;
          else if (rawProds?.content && Array.isArray(rawProds.content)) rawList = rawProds.content;
          else if (rawProds?.data && Array.isArray(rawProds.data)) rawList = rawProds.data;

          // Adapter les produits au format attendu par les composants UI du shop
          const adaptedProducts: Product[] = rawList.map((kp, idx) => ({
            id: kp.id || `kp-${idx}`,
            tenantId: tenantId,
            organizationId: tenantId,
            code: kp.code || `PROD-${idx}`,
            name: kp.name || `Produit ${idx + 1}`,
            description: kp.description || 'Produit de qualité disponible dans notre boutique.',
            categoryId: kp.categoryId || 'c1',
            status: (kp.status as any) || 'ACTIVE',
            createdAt: kp.createdAt || new Date().toISOString(),
            isFeatured: true, // tout afficher par défaut en vedette
            imageUrl: kp.photo || kp.imageUrl || '',
            price: kp.unitPrice || 0,
            stock: kp.quantity || 0
          }));

          setProducts(adaptedProducts);
        } else {
          setError(prodData.message || 'Erreur lors du chargement des produits de cette organisation.');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur de connexion.');
      } finally {
        setLoading(false);
      }
    }

    if (tenantId) {
      loadShopData();
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-zinc-50">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Chargement de la boutique ...</p>
      </div>
    );
  }

  // Determine if error is a temporary service issue vs a hard failure
  const isTemporaryError = error && (
    error.includes('quota') || 
    error.includes('unavailable') || 
    error.includes('timeout') || 
    error.includes('connexion')
  );

  if (error && !isTemporaryError) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="bg-amber-50 border-2 border-amber-300 p-8 rounded-2xl text-center max-w-xl mx-auto">
          <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight mb-2">Impossible de charger la boutique</h3>
          <p className="text-sm text-amber-800 font-medium mb-6">{error}</p>
          <Link href="/">
            <Button variant="outline" className="border-amber-700 text-amber-900 hover:bg-amber-100 font-bold">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const orgName = organization?.name || 'Boutique Officielle';
  const orgDesc = organization?.description || `Bienvenue dans la boutique officielle synchronisée .`;

  return (
    <div className="flex flex-col gap-12 pb-16 bg-zinc-50 min-h-screen">
      {/* Header Section Simple */}
      <section className="bg-white border-b-4 border-zinc-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-zinc-900 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-blue-400" /> {orgName}
                </span>
                <div className="h-1 w-12 bg-blue-600 rounded-full" />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-zinc-900 uppercase italic mb-4">
                {orgName}
              </h1>
              <p className="text-xl font-bold text-zinc-500 leading-relaxed">
                {orgDesc}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href={`/${tenantId}/products`}>
                <Button size="lg" className="h-16 px-8 text-lg font-black uppercase italic tracking-tighter bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100">
                  <LayoutGrid className="mr-2 h-6 w-6" /> Voir tout le catalogue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Temporary error banner */}
      {isTemporaryError && (
        <section className="container mx-auto px-4">
          <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-2xl flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-black text-amber-900 uppercase text-sm tracking-tight">Service temporairement indisponible</p>
              <p className="text-xs text-amber-700 mt-1">Le serveur rencontre un problème de quota. Les produits s&apos;afficheront automatiquement lorsque le service sera rétabli.</p>
            </div>
            <Button 
              variant="outline" 
              className="border-amber-600 text-amber-900 hover:bg-amber-100 font-bold text-xs"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between border-b-2 border-zinc-200 pb-6 mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase italic">Produits de l&apos;Organisation</h2>
            <p className="mt-2 text-zinc-500 font-bold uppercase text-xs tracking-widest">Articles enregistrés  pour cette enseigne</p>
          </div>
          <Link href={`/${tenantId}/products`} className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-600 hover:text-zinc-900 transition-colors">
            Voir le catalogue complet <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} tenantSlug={tenantId} />
            ))}
          </div>
        ) : (
          <div className="bg-white border-4 border-dashed border-zinc-200 rounded-3xl p-20 text-center">
            <ShoppingBag className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
            <p className="text-xl font-black text-zinc-400 uppercase tracking-tighter">Aucun produit trouvé pour cette organisation</p>
            <p className="text-xs text-zinc-400 mt-2 font-bold uppercase tracking-widest">Les produits ajoutés  s&apos;afficheront automatiquement ici.</p>
          </div>
        )}
      </section>

      {/* Trust Values Bar */}
      <section className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-zinc-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border-2 border-blue-100">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <p className="font-black text-zinc-900 uppercase italic text-sm tracking-tighter">Paiement ePay</p>
              <p className="text-xs font-bold text-zinc-500">Transaction sécurisée KSM</p>
            </div>
          </div>
          <div className="bg-white border-2 border-zinc-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border-2 border-green-100">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="font-black text-zinc-900 uppercase italic text-sm tracking-tighter">Retrait Immédiat</p>
              <p className="text-xs font-bold text-zinc-500">Stock physique vérifié</p>
            </div>
          </div>
          <div className="bg-white border-2 border-zinc-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
            <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center border-2 border-orange-100">
              <span className="text-2xl">🛡️</span>
            </div>
            <div>
              <p className="font-black text-zinc-900 uppercase italic text-sm tracking-tighter">Qualité KSM</p>
              <p className="text-xs font-bold text-zinc-500">Boutique certifiée locale</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
