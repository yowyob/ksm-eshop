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

import { useRouter } from 'next/navigation';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';

interface ProductCardProps {
  product: Product;
  tenantSlug: string;
}

export default function ProductCard({ product, tenantSlug }: ProductCardProps) {
  const router = useRouter();
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated);
  
  const addItem = useCartStore((state) => state.addItem);
  const { getProductVariants, getCurrentPrice, getVariantAttributes } = useProductStore();
  const { getVariantStock } = useInventoryStore();

  const variants = getProductVariants(product.id);
  const defaultVariant = variants.length > 0 ? (variants.find(v => v.isDefault) || variants[0]) : null;
  
  let price = product.price || 0;
  let stock = product.stock || 0;
  let attributes: any[] = [];
  let variantId = defaultVariant ? defaultVariant.id : product.id;

  if (defaultVariant) {
    const currentPriceObj = getCurrentPrice(defaultVariant.id);
    if (currentPriceObj) price = currentPriceObj.amount;
    // Overwrite with mock stock if variant exists in mock store
    const mockStock = getVariantStock(defaultVariant.id);
    if (mockStock !== undefined && mockStock > 0) stock = mockStock;
    attributes = getVariantAttributes(defaultVariant.id);
  }

  const attributeSuffix = attributes.length > 0 
    ? ` - ${attributes.map(a => a.attributeValue).join(', ')}`
    : '';

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Redirect to login page and pass the current page URL for redirecting back
      const currentPath = window.location.pathname;
      router.push(`/${tenantSlug}/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    addItem({
      productId: product.id,
      variantId: variantId,
      name: `${product.name}${attributeSuffix}`,
      price: price,
      imageUrl: product.imageUrl
    });
  };

  return (
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
  );
}
