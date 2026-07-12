'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/useCartStore';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, AlertTriangle, ArrowLeft, ShieldCheck, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { tenantId, productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

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
          setOrganizations(orgsData.data || []);
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
            
            // Find similar products based on categoryCode
            const similar = pList.filter(p => 
              p.id !== productId && 
              (p as any).categoryCode === (currentProduct as any).categoryCode
            ).slice(0, 5); // Take up to 5 similar products
            setSimilarProducts(similar);
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

  const handleSearch = (query: string) => {
    if (query.trim()) router.push(`/?search=${encodeURIComponent(query)}`);
  };

  // Extraire toutes les images valides
  const imageList = ((product as any)?.photo || (product as any)?.imageUrl || '')
    .split(',')
    .map((img: string) => img.trim())
    .filter((img: string) => img !== '');

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
              Retour à l'accueil
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
                <p className="text-zinc-500 font-medium leading-relaxed mb-8">{product.description || 'Aucune description disponible pour ce produit.'}</p>
                
                <div className="flex flex-col gap-2 mb-6">
                  {product.wholesalePrice ? (
                    <>
                      <div className="flex items-end gap-3">
                        <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider w-20">Détail :</span>
                        <span className="text-2xl font-black text-zinc-900">
                          {formatPrice(product.unitPrice || 0)} <span className="text-sm font-bold text-zinc-500">{product.currency || 'FCFA'}</span>
                        </span>
                      </div>
                      <div className="flex items-end gap-3">
                        <span className="text-sm font-bold text-blue-600 uppercase tracking-wider w-20">Gros :</span>
                        <span className="text-4xl font-black text-blue-600">
                          {formatPrice(product.wholesalePrice)} <span className="text-xl font-bold text-blue-400">{product.currency || 'FCFA'}</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-4xl font-black text-zinc-900">
                      {formatPrice(product.unitPrice || 0)} <span className="text-xl font-bold text-zinc-500">{product.currency || 'FCFA'}</span>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <div className={`text-sm font-black px-4 py-2 inline-flex items-center gap-2 rounded-full border ${
                    ((product as any).stock ?? (product as any).quantity ?? (product as any).stockCount ?? 0) > 0 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      ((product as any).stock ?? (product as any).quantity ?? (product as any).stockCount ?? 0) > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    {((product as any).stock ?? (product as any).quantity ?? (product as any).stockCount ?? 0) > 0 
                      ? `${((product as any).stock ?? (product as any).quantity ?? (product as any).stockCount ?? 0)} unités en stock`
                      : 'Épuisé'
                    }
                  </div>
                </div>

                {/* Variants Selection */}
                {product.options && product.options.length > 0 && (
                  <div className="mb-8 space-y-6 border-t border-zinc-100 pt-6">
                    {product.options.map((opt, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-sm">{opt.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          {opt.values.map((val, vIdx) => (
                            <button
                              key={vIdx}
                              onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val }))}
                              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                selectedOptions[opt.name] === val 
                                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-md scale-105'
                                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={() => {
                    if (!isAuthenticated) {
                      const currentPath = window.location.pathname;
                      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
                      return;
                    }
                    const allOptionsSelected = product.options ? product.options.every(opt => selectedOptions[opt.name]) : true;
                    if (!allOptionsSelected) {
                      alert('Veuillez sélectionner toutes les options avant d\'ajouter au panier.');
                      return;
                    }

                    // Create a composite variantId based on product ID and selected options
                    const optionsString = Object.entries(selectedOptions).sort().map(([k,v]) => `${k}=${v}`).join('|');
                    const variantId = optionsString ? `${product.id}-${optionsString}` : product.id;
                    const variantNameAppendix = optionsString ? ` (${Object.values(selectedOptions).join(', ')})` : '';

                    addItem({
                      productId: product.id,
                      variantId: variantId,
                      name: product.name + variantNameAppendix,
                      price: product.unitPrice || 0,
                      wholesalePrice: product.wholesalePrice,
                      imageUrl: activeImage || '',
                      tenantId: product.organizationId,
                      selectedOptions: selectedOptions
                    });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                  disabled={((product as any).stock ?? (product as any).quantity ?? (product as any).stockCount ?? 0) === 0 || (product.options ? !product.options.every(opt => selectedOptions[opt.name]) : false)}
                >
                  <ShoppingCart className="h-6 w-6" />
                  {((product as any).stock ?? (product as any).quantity ?? (product as any).stockCount ?? 0) > 0 
                    ? (product.options && !product.options.every(opt => selectedOptions[opt.name]) ? 'Sélectionnez vos options' : 'Ajouter au panier') 
                    : 'Rupture de stock'}
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
                            <span className="text-zinc-300 font-bold text-xs uppercase">Pas d'image</span>
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
