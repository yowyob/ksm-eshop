'use client';

import { Product, Variant } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';

import { useRouter, useParams } from 'next/navigation';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';

interface AddToCartButtonProps {
  product: Product;
  selectedVariant: Variant;
  price: number;
  stock: number;
  attributeSuffix: string;
}

export default function AddToCartButton({ product, selectedVariant, price, stock, attributeSuffix }: AddToCartButtonProps) {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantId as string;
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated);

  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    if (!isAuthenticated) {
      // Redirect to login page and pass the current page URL for redirecting back
      const currentPath = window.location.pathname;
      router.push(`/${tenantSlug}/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: `${product.name}${attributeSuffix}`,
      price: price,
      imageUrl: product.imageUrl
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Button 
      className="w-full h-14 text-lg gap-2 transition-all font-bold" 
      disabled={stock === 0}
      onClick={handleAdd}
      variant={isAdded ? 'outline' : 'primary'}
    >
      <ShoppingCart className="h-5 w-5" />
      {isAdded ? 'Ajouté au panier !' : 'Ajouter au panier'}
    </Button>
  );
}
