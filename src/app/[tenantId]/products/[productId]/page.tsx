'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/useCartStore';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, AlertTriangle, ArrowLeft, ShieldCheck, ShoppingCart, Tag, PackageCheck } from 'lucide-react';
import Link from 'next/link';

/**
 * Parse le champ `variantLabel` du backend.
 * Format stocké: "Couleur: Noir, Blanc, Rouge" ou simplement "Standard".
 * Retourne null si pas de variantes réelles.
 */
function parseVariantLabel(product: any): { label: string; values: string[] } | null {
  const raw: string = (product?.variantLabel || '').trim();
  if (!raw || raw === 'Standard') return null;

  const colonIdx = raw.indexOf(':');
  if (colonIdx < 0) {
    // Pas de deux-points → c'est juste un label sans valeurs
    return null;
  }

  const label  = raw.slice(0, colonIdx).trim();
  const values = raw.slice(colonIdx + 1).split(',').map(v => v.trim()).filter(v => v !== '');
  if (!label || values.length === 0) return null;
  return { label, values };
}

export default function ProductDetailPage() {
  const { tenantId, productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');

  const { addItem } = useCartStore();
  const { isAuthenticated } = useCustomerAuthStore();

  useEffect(() => {
    const fetchProductAndSimilar = async () => {
      setLoading(true);
      setError(null);
      try {
        const [orgsRes, prodsRes] = await Promise.all([
          fetch('/api/organizations'),
          fetch(`/api/products?organizationId=${tenantId === 'all' ? 'ALL' : tenantId}`)
        ]);

        const orgsData = await orgsRes.json();
        const prodsData = await prodsRes.json();

        if (orgsData.success) {
          // organisations chargées (non utilisées directement ici)
        }

        if (prodsData.success) {
          let pList: Product[] = [];
          const raw = prodsData.data;
          if (Array.isArray(raw)) pList = raw;
          else if (raw?.content) pList = raw.content;
          else if (raw?.data) pList = raw.data;

          const currentProduct = pList.find(p => p.id === productId);
          if (currentProduct) {
            setProduct(currentProduct);
            
            // Initialiser l'image active
            const images = ((currentProduct as any).photo || (currentProduct as any).imageUrl || '')
              .split(',')
              .map((img: string) => img.trim())
              .filter((img: string) => img !== '');
            if (images.length > 0) {
              setActiveImage(images[0]);
            }
            
            // Algorithme de similarité de nom (mots en commun)
            const getNameSimilarity = (n1: string, n2: string): number => {
              const w1 = n1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
              const w2 = n2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
              let common = 0;
              w1.forEach(w => {
                if (w2.includes(w)) common++;
              });
              return common;
            };

            // Trier les produits par score de similarité décroissant
            const sortedSimilar = pList
              .filter(p => p.id !== productId)
              .map(p => ({
                product: p,
                score: getNameSimilarity(currentProduct.name, p.name)
              }))
              .sort((a, b) => b.score - a.score)
              .map(item => item.product)
              .slice(0, 5);

            setSimilarProducts(sortedSimilar);
          } else {
            setError('Produit non trouvé.');
          }
        }
      } catch (err: any) {
        setError('Erreur de connexion au serveur.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductAndSimilar();
    }
  }, [tenantId, productId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  // Extraire toutes les images valides
  const imageList = ((product as any)?.photo || (product as any)?.imageUrl || '')
    .split(',')
    .map((img: string) => img.trim())
    .filter((img: string) => img !== '');

  const stockQty = (product as any)?.stock ?? (product as any)?.quantity ?? (product as any)?.stockCount ?? 0;
  const variantInfo = product ? parseVariantLabel(product) : null;
  const hasVariants = variantInfo !== null;
  const allOptionsSelected = hasVariants ? selectedVariant !== '' : true;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-8">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
            <p className="font-bold text-zinc-500">Chargement du produit...</p>
          </div>
        ) : error || !product ? (
          <div className="max-w-xl mx-auto bg-red-50 border border-red-200 p-8 rounded-2xl text-center text-red-700">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="font-black text-xl mb-2">{error || 'Produit introuvable'}</p>
            <Button onClick={() => router.push('/')} variant="outline" className="mt-6 border-red-200 text-red-700 hover:bg-red-100 rounded-full font-bold px-8">
              Retour à l&apos;accueil
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Product Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-zinc-100">
              {/* Product Images Area */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square bg-zinc-50 rounded-2xl overflow-hidden flex items-center justify-center relative p-6 border border-zinc-100">
                  {(product as any).tenantName && (
                    <div className="absolute top-4 left-4 bg-zinc-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest z-10 shadow-lg">
                      {(product as any).tenantName}
                    </div>
                  )}
                  {activeImage ? (
                    <img 
                      src={activeImage} 
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Aucune image</span>
                  )}
                </div>

                {/* Thumbnails row */}
                {imageList.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-zinc-200">
                    {imageList.map((imgUrl: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(imgUrl)}
                        className={`w-20 h-20 bg-zinc-50 border-2 rounded-xl overflow-hidden flex items-center justify-center p-2 flex-shrink-0 transition-all ${
                          activeImage === imgUrl ? 'border-blue-600 shadow-md scale-105' : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`${product.name} - image ${idx + 1}`}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-center">
                <div className="mb-2">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {(product as any).categoryCode || 'Général'}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight mb-4">{product.name}</h1>
                <p className="text-zinc-500 font-medium leading-relaxed mb-6">{product.description || 'Aucune description disponible pour ce produit.'}</p>
                
                {/* Prix */}
                <div className="flex flex-col gap-3 mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-black text-zinc-500 uppercase tracking-wider">
                      <Tag className="h-3.5 w-3.5" /> Prix
                    </span>
                    <span className="text-3xl font-black text-zinc-900">
                      {formatPrice(product.unitPrice || 0)} <span className="text-lg font-bold text-zinc-500">{product.currency || 'FCFA'}</span>
                    </span>
                  </div>
                </div>

                {/* Stock */}
                <div className="mb-6 flex items-center gap-3">
                  <div className={`flex items-center gap-2 text-sm font-black px-4 py-2.5 rounded-full border-2 ${
                    stockQty > 0 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <PackageCheck className={`h-4 w-4 ${stockQty > 0 ? 'text-emerald-500' : 'text-red-400'}`} />
                    {stockQty > 0 
                      ? `${stockQty} unité${stockQty > 1 ? 's' : ''} en stock`
                      : 'Épuisé'
                    }
                  </div>
                  <ShieldCheck className="h-5 w-5 text-zinc-300" />
                  <span className="text-xs text-zinc-400 font-medium">Stock vérifié</span>
                </div>

                {/* Variantes */}
                {hasVariants && variantInfo && (
                  <div className="mb-6 space-y-3 border-t border-zinc-100 pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
                        {variantInfo.label}
                        {selectedVariant && (
                          <span className="ml-2 text-zinc-900 normal-case tracking-normal">— {selectedVariant}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {variantInfo.values.map((val, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedVariant(val)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                              selectedVariant === val
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-md scale-105'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}


                <Button 
                  onClick={() => {
                    if (!isAuthenticated) {
                      const currentPath = window.location.pathname;
                      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
                      return;
                    }
                    if (!allOptionsSelected) {
                      alert(`Veuillez sélectionner ${variantInfo?.label || 'une variante'} avant d'ajouter au panier.`);
                      return;
                    }

                    const variantSuffix = selectedVariant ? ` (${selectedVariant})` : '';
                    const variantId = selectedVariant ? `${product.id}-${selectedVariant}` : product.id;

                    addItem({
                      productId: product.id,
                      variantId: variantId,
                      name: product.name + variantSuffix,
                      price: product.unitPrice || 0,
                      imageUrl: activeImage || '',
                      tenantId: product.organizationId,
                      selectedOptions: selectedVariant ? { [variantInfo?.label || 'Variante']: selectedVariant } : {}
                    });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                  disabled={stockQty === 0 || !allOptionsSelected}
                >
                  <ShoppingCart className="h-6 w-6" />
                  {stockQty === 0
                    ? 'Rupture de stock'
                    : !allOptionsSelected
                      ? 'Sélectionnez vos options'
                      : 'Ajouter au panier'
                  }
                </Button>
              </div>
            </div>

            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter">Produits Similaires</h2>
                  <div className="h-[2px] flex-1 bg-zinc-200 ml-6" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {similarProducts.map(sim => (
                    <Card key={sim.id} className="group hover:shadow-xl transition-all duration-300 border border-zinc-200 rounded-2xl overflow-hidden flex flex-col bg-white hover:-translate-y-1">
                      <Link href={`/${sim.organizationId || 'o1'}/products/${sim.id}`} className="block relative aspect-square bg-zinc-50 p-4">
                        {(sim as any).photo ? (
                          <img 
                            src={(sim as any).photo} 
                            alt={sim.name}
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-zinc-300 font-bold text-xs uppercase">Pas d&apos;image</span>
                          </div>
                        )}
                      </Link>
                      <CardContent className="p-4 flex flex-col flex-1">
                        <Link href={`/${sim.organizationId || 'o1'}/products/${sim.id}`} className="block mb-1">
                          <h3 className="font-bold text-zinc-900 line-clamp-1 group-hover:text-blue-600 transition-colors text-sm">
                            {sim.name}
                          </h3>
                        </Link>
                        <div className="mt-auto pt-2">
                          <div className="text-base font-black text-zinc-900">
                            {formatPrice(sim.unitPrice || 0)} <span className="text-xs font-bold text-zinc-500">{sim.currency || 'FCFA'}</span>
                          </div>
                          {(sim as any).wholesalePrice > 0 && (
                            <div className="text-xs font-bold text-blue-500 mt-0.5">
                              Gros: {formatPrice((sim as any).wholesalePrice)} {sim.currency || 'FCFA'}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
