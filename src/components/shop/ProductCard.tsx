'use client';

import { Product } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useProductStore } from '@/store/useProductStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Eye, Package, X } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  tenantSlug: string;
}

function parseVariantLabel(product: any): { label: string; values: string[] } | null {
  const raw: string = (product?.variantLabel || '').trim();
  if (!raw || raw === 'Standard') return null;

  const colonIdx = raw.indexOf(':');
  if (colonIdx < 0) return null;

  const label  = raw.slice(0, colonIdx).trim();
  const values = raw.slice(colonIdx + 1).split(',').map(v => v.trim()).filter(v => v !== '');
  if (!label || values.length === 0) return null;
  return { label, values };
}

export default function ProductCard({ product, tenantSlug }: ProductCardProps) {
  const router = useRouter();
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated);
  
  const addItem = useCartStore((state) => state.addItem);
  
  // États de sélection de variantes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('');

  const variantInfo = parseVariantLabel(product);
  const hasVariants = variantInfo !== null;
  
  let price = product.price || 0;
  let stock = product.stock || 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/${tenantSlug}/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (hasVariants && !selectedVariant) {
      // Ouvrir le pop-up pour forcer la sélection
      setIsModalOpen(true);
      return;
    }

    const variantSuffix = selectedVariant ? ` (${selectedVariant})` : '';
    const finalVariantId = selectedVariant ? `${product.id}-${selectedVariant}` : product.id;

    addItem({
      productId: product.id,
      variantId: finalVariantId,
      name: `${product.name}${variantSuffix}`,
      price: price,
      imageUrl: product.imageUrl,
      tenantId: product.organizationId || tenantSlug,
      selectedOptions: selectedVariant ? { [variantInfo?.label || 'Variante']: selectedVariant } : {}
    });

    // Refermer le modal après ajout
    setIsModalOpen(false);
    setSelectedVariant('');
  };

  return (
    <>
      <Card className="overflow-hidden group transition-all hover:shadow-xl border-zinc-200">
        <div className="relative aspect-square overflow-hidden bg-zinc-100 border-b border-zinc-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-zinc-100 text-zinc-300 transition-transform duration-300 group-hover:scale-105">
              <Package className="h-24 w-24 opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
             <Link href={`/${tenantSlug}/products/${product.id}`}>
              <Button size="icon" variant="secondary" className="rounded-full bg-white text-zinc-900 shadow-lg animate-in zoom-in-50 duration-200">
                <Eye className="h-5 w-5" />
              </Button>
             </Link>
          </div>
          {stock <= 5 && stock > 0 && (
            <span className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md animate-pulse">
              Stock Limité ({stock})
            </span>
          )}
          {stock === 0 && (
            <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">
              Épuisé
            </span>
          )}
        </div>
        <CardContent className="p-4 bg-white">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-base text-zinc-800 line-clamp-1">{product.name}</h3>
          </div>
          <p className="text-xs text-zinc-500 line-clamp-2 min-h-[2rem] leading-relaxed">
            {product.description}
          </p>
          <p className="mt-3 text-lg font-bold text-blue-600">
            {formatPrice(price)}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 bg-white">
          <Button 
            className="w-full gap-2 h-10 text-sm font-medium shadow-sm bg-zinc-900 hover:bg-zinc-800 transition-colors" 
            disabled={stock === 0}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            {hasVariants ? 'Choisir les options' : 'Ajouter au panier'}
          </Button>
        </CardFooter>
      </Card>

      {/* POP-UP DE SÉLECTION DE VARIANTES (FORCÉ) */}
      {isModalOpen && hasVariants && variantInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-zinc-100 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-6 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} className="h-full w-full object-cover" alt={product.name} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-300"><Package className="h-5 w-5" /></div>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-sm text-zinc-900 uppercase italic line-clamp-1">{product.name}</h4>
                  <p className="text-blue-600 font-bold text-xs mt-0.5">{formatPrice(price)}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedVariant('');
                }} 
                className="h-8 w-8 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corps du Modal */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Choisir {variantInfo.label} <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variantInfo.values.map((val, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVariant(val)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        selectedVariant === val
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-105'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 font-black uppercase text-xs h-11 border-2"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedVariant('');
                }}
              >
                Annuler
              </Button>
              <Button 
                disabled={!selectedVariant}
                className="flex-1 font-black uppercase text-xs h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Confirmer l&apos;ajout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
