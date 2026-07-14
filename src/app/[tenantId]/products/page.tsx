'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Filter, ChevronRight, X, Search, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { KernelProduct, Organization, Product } from '@/lib/types';

export default function ProductsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProductsData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Charger l'organisation
        const orgsRes = await fetch('/api/organizations');
        const orgsData = await orgsRes.json();
        if (orgsData.success) {
          const raw = orgsData.data;
          let list: Organization[] = [];
          if (Array.isArray(raw)) list = raw;
          else if (raw?.content && Array.isArray(raw.content)) list = raw.content;
          else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
          const found = list.find(o => o.id === tenantId || o.code === tenantId);
          if (found) setOrganization(found);
        }

        // 2. Charger les produits réels
        const prodRes = await fetch(`/api/organizations/${encodeURIComponent(tenantId)}/products`);
        const prodData = await prodRes.json();

        if (prodData.success) {
          const rawProds = prodData.data;
          let rawList: KernelProduct[] = [];
          if (Array.isArray(rawProds)) rawList = rawProds;
          else if (rawProds?.content && Array.isArray(rawProds.content)) rawList = rawProds.content;
          else if (rawProds?.data && Array.isArray(rawProds.data)) rawList = rawProds.data;

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
            isFeatured: true,
            imageUrl: kp.photo || kp.imageUrl || '',
            price: kp.unitPrice || 0,
            stock: kp.quantity || 0,
            variantLabel: (kp as any).variantLabel || 'Standard'
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
      loadProductsData();
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-zinc-50">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Chargement du catalogue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="bg-amber-50 border-2 border-amber-300 p-8 rounded-2xl text-center max-w-xl mx-auto">
          <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight mb-2">Impossible de charger le catalogue</h3>
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

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header Breadcrumb style */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
            <Link href="/" className="hover:text-zinc-900">KSM eShop</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/${tenantId}`} className="hover:text-zinc-900">{orgName}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-blue-600">catalogue</span>
          </nav>
          <h1 className="text-5xl font-black tracking-tighter text-zinc-900 uppercase italic">Catalogue Complet</h1>
        </div>
        <div className="bg-zinc-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span className="text-2xl font-black italic tracking-tighter">{products.length}</span>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none text-zinc-400">Articles<br/>Disponibles</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
        {/* Advanced Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            <Card className="border-4 border-zinc-900 overflow-hidden shadow-xl">
              <div className="bg-zinc-900 p-4 flex items-center gap-2 text-white">
                <Filter className="h-5 w-5" />
                <span className="font-black uppercase italic tracking-tighter">Filtres</span>
              </div>
              <CardContent className="p-6 space-y-8 bg-white">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 border-b pb-2">Catégories</h3>
                  <div className="space-y-2">
                    <Link 
                      href={`/${tenantId}/products`} 
                      className="flex items-center justify-between p-3 rounded-xl border-2 bg-blue-600 border-blue-600 text-white font-bold text-sm shadow-lg"
                    >
                      <span>Tous les articles</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-zinc-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="Filtrer par nom..." 
                      className="w-full h-10 bg-zinc-50 border-2 border-zinc-100 rounded-xl pl-10 pr-4 text-xs font-bold focus:border-zinc-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="flex h-[50vh] flex-col items-center justify-center rounded-3xl border-4 border-dashed border-zinc-200 bg-white">
              <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-zinc-300" />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter">Aucun produit trouvé</h3>
              <p className="mt-2 text-zinc-500 font-bold">Aucun produit n&apos;est enregistré  pour cette enseigne.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} tenantSlug={tenantId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
