'use client';

import { Product } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useProductStore } from '@/store/useProductStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import Link from 'next/link';
import { ShoppingCart, Eye, Package } from 'lucide-react';

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
  
  let price = product.price || 0;
  let stock = product.stock || 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/${tenantSlug}/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Ajout direct au panier (sans variante spécifiée pour le moment, à choisir dans le panier)
    addItem({
      productId: product.id,
      variantId: product.id, // Initialement ID produit, sera mis à jour dans le panier
      name: product.name,
      price: price,
      imageUrl: product.imageUrl,
      tenantId: product.organizationId || tenantSlug,
      selectedOptions: {} // Initialement vide, requis d'être configuré dans le panier
    });
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
            Ajouter au panier
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
