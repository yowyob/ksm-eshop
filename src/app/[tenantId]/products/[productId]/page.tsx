'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/useCartStore';
import { useTranslations, useLocale } from 'next-intl';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, AlertTriangle, ArrowLeft, ShieldCheck, ShoppingCart, Tag, PackageCheck } from 'lucide-react';
import Link from 'next/link';

function translateVariantLabel(label: string, locale: string): string {
  if (locale !== 'en') return label;
  const l = label.toLowerCase().trim();
  if (l === 'couleur') return 'Color';
  if (l === 'taille') return 'Size';
  if (l === 'mémoire') return 'Memory';
  if (l === 'capacité') return 'Capacity';
  return label;
}

function translateVariantValue(value: string, locale: string): string {
  if (locale !== 'en') return value;
  const v = value.toLowerCase().trim();
  if (v === 'noir' || v === 'noir sidéral') return 'Space Gray';
  if (v === 'blanc') return 'White';
  if (v === 'rouge') return 'Red';
  if (v === 'argent') return 'Silver';
  if (v === 'or') return 'Gold';
  if (v === 'bleu') return 'Blue';
  if (v === 'vert') return 'Green';
  if (v === 'gris') return 'Gray';
  return value;
}

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

function splitImagesString(str: string): string[] {
  if (!str) return [];
  const rawParts = str.split(',').map(s => s.trim()).filter(Boolean);
  const result: string[] = [];
  
  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (part.startsWith('data:image/') && part.endsWith('base64') && i + 1 < rawParts.length) {
      result.push(part + ',' + rawParts[i + 1]);
      i++;
    } else {
      result.push(part);
    }
  }
  return result;
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
  const [quantity, setQuantity] = useState<number>(1);

  const { addItem } = useCartStore();
  const t = useTranslations('Product');
  const locale = useLocale();
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
            const images = splitImagesString((currentProduct as any).photo || (currentProduct as any).imageUrl || '')
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
  const imageList = splitImagesString((product as any)?.photo || (product as any)?.imageUrl || '')
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
          {t('back')}
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
                
                {/* Affichage des tarifs dégressifs Alibaba style */}
                <div className="mb-6 space-y-4">
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-blue-600" /> {t('priceGrid')}
                  </h3>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    {/* DETAIL */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 bg-white shadow-sm">
                      <span className="text-[10px] font-black uppercase text-zinc-400">{t('detail')}</span>
                      <span className="text-sm font-semibold text-zinc-500">{t('retailQty')}</span>
                      <span className="text-base font-black text-zinc-900 mt-1">
                        {formatPrice(product.unitPrice || 0)} <span className="text-[10px]">{product.currency || 'FCFA'}</span>
                      </span>
                    </div>

                    {/* DEMI_GROS */}
                    {(() => {
                      const sizes = (product as any).allowedSaleSizes || [];
                      const semiGros = sizes.find((s: any) => s.size === 'DEMIS_GROS' || s.size === 'SEMI_GROS');
                      const sPrice = semiGros ? semiGros.unitPrice : Math.round((product.unitPrice || 0) * 0.9);
                      const sMin = semiGros ? semiGros.minQuantity : 5;
                      
                      return (
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 bg-white shadow-sm">
                          <span className="text-[10px] font-black uppercase text-blue-600">{t('semiWholesale')}</span>
                          <span className="text-sm font-semibold text-zinc-500">{t('minQtyFrom', {qty: sMin})}</span>
                          <span className="text-base font-black text-blue-600 mt-1">
                            {formatPrice(sPrice)} <span className="text-[10px]">{product.currency || 'FCFA'}</span>
                          </span>
                        </div>
                      );
                    })()}

                    {/* GROS */}
                    {(() => {
                      const sizes = (product as any).allowedSaleSizes || [];
                      const gros = sizes.find((s: any) => s.size === 'GROS');
                      const gPrice = gros ? gros.unitPrice : Math.round((product.unitPrice || 0) * 0.8);
                      const gMin = gros ? gros.minQuantity : 10;
                      
                      return (
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 bg-white shadow-sm">
                          <span className="text-[10px] font-black uppercase text-amber-600">{t('wholesale')}</span>
                          <span className="text-sm font-semibold text-zinc-500">{t('minQtyFrom', {qty: gMin})}</span>
                          <span className="text-base font-black text-amber-600 mt-1">
                            {formatPrice(gPrice)} <span className="text-[10px]">{product.currency || 'FCFA'}</span>
                          </span>
                        </div>
                      );
                    })()}

                    {/* SUPER_GROS */}
                    {(() => {
                      const sizes = (product as any).allowedSaleSizes || [];
                      const superGros = sizes.find((s: any) => s.size === 'SUPER_GROS');
                      const sgPrice = superGros ? superGros.unitPrice : Math.round((product.unitPrice || 0) * 0.7);
                      const sgMin = superGros ? superGros.minQuantity : 20;
                      
                      return (
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 bg-white shadow-sm">
                          <span className="text-[10px] font-black uppercase text-purple-600">{t('superWholesale')}</span>
                          <span className="text-sm font-semibold text-zinc-500">{t('minQtyFrom', {qty: sgMin})}</span>
                          <span className="text-base font-black text-purple-600 mt-1">
                            {formatPrice(sgPrice)} <span className="text-[10px]">{product.currency || 'FCFA'}</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Prix total calculé dynamiquement */}
                  {(() => {
                    const sizes = (product as any).allowedSaleSizes || [];
                    const detailPrice = product.unitPrice || 0;
                    
                    const semiGros = sizes.find((s: any) => s.size === 'DEMIS_GROS' || s.size === 'SEMI_GROS');
                    const sPrice = semiGros ? semiGros.unitPrice : Math.round(detailPrice * 0.9);
                    const sMin = semiGros ? semiGros.minQuantity : 5;

                    const gros = sizes.find((s: any) => s.size === 'GROS');
                    const gPrice = gros ? gros.unitPrice : Math.round(detailPrice * 0.8);
                    const gMin = gros ? gros.minQuantity : 10;

                    const superGros = sizes.find((s: any) => s.size === 'SUPER_GROS');
                    const sgPrice = superGros ? superGros.unitPrice : Math.round(detailPrice * 0.7);
                    const sgMin = superGros ? superGros.minQuantity : 20;

                    let resolvedPrice = detailPrice;
                    let tariffLabel = t('detail');
                    if (quantity >= sgMin) {
                      resolvedPrice = sgPrice;
                      tariffLabel = t('superWholesale');
                    } else if (quantity >= gMin) {
                      resolvedPrice = gPrice;
                      tariffLabel = t('wholesale');
                    } else if (quantity >= sMin) {
                      resolvedPrice = sPrice;
                      tariffLabel = t('semiWholesale');
                    }

                    return (
                      <div className="bg-blue-50/55 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('appliedTariff')} : {tariffLabel}</p>
                          <p className="text-xs font-semibold text-zinc-500">{t('unitPriceLabel')} : {formatPrice(resolvedPrice)} {product.currency || 'FCFA'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('estimatedTotal')}</p>
                          <p className="text-2xl font-black text-zinc-900">{formatPrice(resolvedPrice * quantity)} <span className="text-sm font-bold text-zinc-500">{product.currency || 'FCFA'}</span></p>
                        </div>
                      </div>
                    );
                  })()}
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
                      ? t('inStockWithCount', {qty: stockQty})
                      : 'Épuisé'
                    }
                  </div>
                  <ShieldCheck className="h-5 w-5 text-zinc-300" />
                  <span className="text-xs text-zinc-400 font-medium">{t('verifiedStock')}</span>
                </div>

                {/* Variantes */}
                {hasVariants && variantInfo && (
                  <div className="mb-6 space-y-3 border-t border-zinc-100 pt-6">
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
                        {translateVariantLabel(variantInfo.label, locale)}
                        {selectedVariant && (
                          <span className="ml-2 text-zinc-900 normal-case tracking-normal">— {translateVariantValue(selectedVariant, locale)}</span>
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
                            {translateVariantValue(val, locale)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}


                {/* Sélecteur de {t('quantity')} */}
                {stockQty > 0 && (
                  <div className="mb-6 space-y-2 border-t border-zinc-100 pt-6">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{t('quantity')}</p>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-xl border-2 border-zinc-200 bg-white hover:border-zinc-400 font-bold flex items-center justify-center text-lg active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-base font-black text-zinc-900">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(q => Math.min(stockQty, q + 1))}
                        className="w-10 h-10 rounded-xl border-2 border-zinc-200 bg-white hover:border-zinc-400 font-bold flex items-center justify-center text-lg active:scale-95 transition-transform"
                      >
                        +
                      </button>
                      <span className="text-xs font-medium text-zinc-400">{t('maxQty', {qty: stockQty})}</span>
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
                      basePrice: product.unitPrice || 0,
                      imageUrl: activeImage || '',
                      tenantId: product.organizationId,
                      selectedOptions: selectedVariant ? { [variantInfo?.label || 'Variante']: selectedVariant } : {},
                      allowedSaleSizes: (product as any).allowedSaleSizes || [],
                      quantity: quantity
                    });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                  disabled={stockQty === 0 || !allOptionsSelected}
                >
                  <ShoppingCart className="h-6 w-6" />
                  {stockQty === 0
                    ? t('outOfStock')
                    : !allOptionsSelected
                      ? 'Sélectionnez vos options'
                      : t('addToCart')
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
                            src={splitImagesString((sim as any).photo || '')[0]} 
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
