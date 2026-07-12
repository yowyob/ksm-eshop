'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertTriangle, ShieldCheck, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Organization, Product } from '@/lib/types';
import { GlobalNavbar } from '@/components/global/GlobalNavbar';
import { useCartStore } from '@/store/useCartStore';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';

export default function GlobalMarketplacePage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'NONE' | 'LOW_TO_HIGH' | 'HIGH_TO_LOW'>('NONE');

  const { addItem } = useCartStore();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orgsRes, prodsRes] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/products?organizationId=ALL')
      ]);

      const orgsData = await orgsRes.json();
      const prodsData = await prodsRes.json();

      if (orgsData.success) {
        let list: Organization[] = [];
        const raw = orgsData.data;
        if (Array.isArray(raw)) list = raw;
        else if (raw?.content && Array.isArray(raw.content)) list = raw.content;
        else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
        else if (raw && typeof raw === 'object') list = [raw];
        setOrganizations(list);
      }

      if (prodsData.success) {
        let pList: Product[] = [];
        const raw = prodsData.data;
        if (Array.isArray(raw)) pList = raw;
        else if (raw?.content && Array.isArray(raw.content)) pList = raw.content;
        else if (raw?.data && Array.isArray(raw.data)) pList = raw.data;
        
        // Randomize products initially
        pList.sort(() => Math.random() - 0.5);
        setProducts(pList);
      } else {
        setError(prodsData.message || 'Erreur lors du chargement des produits.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(lowerQ) || 
        p.description?.toLowerCase().includes(lowerQ)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((p: any) => p.categoryCode === selectedCategory || p.familyCode === selectedCategory);
    }

    // Sorting
    if (sortOrder === 'LOW_TO_HIGH') {
      result.sort((a, b) => (a.unitPrice || 0) - (b.unitPrice || 0));
    } else if (sortOrder === 'HIGH_TO_LOW') {
      result.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0));
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortOrder]);

  const dynamicCategories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p: any) => {
      const cId = p.categoryCode || p.familyCode;
      if (!cId) return;
      
      // On utilise categoryCode ou familyCode comme label pour l'instant
      const cName = p.categoryCode || p.familyCode;
      if (!map.has(cId)) {
        map.set(cId, cName);
      }
    });
    
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 font-sans">
      <GlobalNavbar 
        organizations={organizations}
        onSearch={setSearchQuery}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
        categories={dynamicCategories}
      />

      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 py-8">
        
        {/* Banner */}
        <div className="w-full bg-gradient-to-r from-blue-700 to-indigo-900 rounded-lg p-8 mb-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">Bienvenue sur KSM eShop</h1>
            <p className="text-lg opacity-90 max-w-2xl">Découvrez des milliers de produits issus des meilleures boutiques partenaires. Commandez en un clic avec une logistique unifiée.</p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6 border border-zinc-200">
          <div className="text-sm font-bold text-zinc-700 mb-4 sm:mb-0">
            {filteredAndSortedProducts.length} résultats {searchQuery && <span>pour "{searchQuery}"</span>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="font-bold text-zinc-600">Trier par :</label>
            <select 
              className="border border-zinc-300 rounded px-3 py-1.5 outline-none focus:border-amber-500 bg-white shadow-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="NONE">Pertinence (Aléatoire)</option>
              <option value="LOW_TO_HIGH">Prix : Croissant</option>
              <option value="HIGH_TO_LOW">Prix : Décroissant</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
            <p className="text-sm font-bold text-zinc-500">Chargement des produits...</p>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 p-6 rounded-lg text-center text-red-700">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-bold">{error}</p>
            <Button onClick={fetchData} variant="outline" className="mt-4 border-red-200 text-red-700 hover:bg-red-100">
              Réessayer
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAndSortedProducts.map(product => (
              <Card key={product.id} className="group hover:shadow-xl transition-shadow border border-zinc-200 rounded-lg overflow-hidden flex flex-col bg-white">
                <Link href={`/${product.organizationId || 'o1'}/products/${product.id}`} className="block relative aspect-square bg-white p-4">
                  {product.photo ? (
                    <img 
                      src={product.photo} 
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center rounded">
                      <span className="text-zinc-400 text-xs">Image non disponible</span>
                    </div>
                  )}
                  {/* Badge boutique */}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                    {(product as any).tenantName || 'Boutique KSM'}
                  </div>
                </Link>
                
                <CardContent className="p-4 flex flex-col flex-1">
                  <Link href={`/${product.organizationId || 'o1'}/products/${product.id}`} className="block mb-2">
                    <h3 className="font-bold text-zinc-900 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors text-sm">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="mt-auto">
                    <div className="text-xl font-black text-zinc-900 mb-1">
                      {formatPrice(product.unitPrice || 0)} <span className="text-sm font-bold text-zinc-600">{product.currency || 'FCFA'}</span>
                    </div>
                    
                    {(() => {
                      const stockQty = product.stock ?? product.quantity ?? product.stockCount ?? 0;
                      const inStock = stockQty > 0;
                      return (
                        <div className={`text-xs font-bold mb-3 inline-block px-2 py-1 rounded-full border ${inStock ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                          {inStock ? `Disponibilité : ${stockQty} en stock` : 'Épuisé'}
                        </div>
                      );
                    })()}
                    
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (!useCustomerAuthStore.getState().isAuthenticated) {
                          const currentPath = window.location.pathname;
                          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
                          return;
                        }
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: product.unitPrice || 0,
                          imageUrl: product.photo || '',
                          tenantId: product.organizationId
                        });
                      }}
                      disabled={(product.stock ?? product.quantity ?? product.stockCount ?? 0) === 0}
                      className={`w-full font-bold border-none shadow-sm rounded-full text-sm h-9 ${
                        (product.stock ?? product.quantity ?? product.stockCount ?? 0) === 0 
                          ? 'bg-red-100 text-red-500 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {(product.stock ?? product.quantity ?? product.stockCount ?? 0) > 0 ? 'Ajouter au panier' : 'Épuisé'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredAndSortedProducts.length === 0 && (
              <div className="col-span-full text-center py-20">
                <p className="text-zinc-500 font-bold text-lg">Aucun produit ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Pro - Client side */}
      <footer className="py-16 bg-zinc-900 text-zinc-400 border-t-2 border-zinc-950 mt-auto">
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
              <p className="text-xs font-bold">Yaoundé, Cameroun</p>
              <p className="text-xs font-bold text-zinc-500">Intégration technologique de pointe pour les PME locales.</p>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">&copy; {new Date().getFullYear()} KSM Core System. Tous droits réservés.</p>
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
