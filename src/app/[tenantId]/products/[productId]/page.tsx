'use client';

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { TENANTS } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import AddToCartButton from '@/components/shop/AddToCartButton';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  RefreshCcw, 
  Sliders, 
  Activity, 
  Layers,
  Scale,
  Maximize2
} from 'lucide-react';
import Link from 'next/link';
import { useProductStore } from '@/store/useProductStore';
import { useInventoryStore } from '@/store/useInventoryStore';

export default function ProductDetailPage() {
  const { tenantId, productId } = useParams();
  const { 
    products, 
    getProductVariants, 
    getCurrentPrice, 
    getVariantAttributes,
    getProductSpecs,
    getProductBatches
  } = useProductStore();

  const { getVariantStock } = useInventoryStore();
  
  const tenant = TENANTS.find((t) => t.slug === tenantId);
  const product = products.find((p) => p.id === productId && p.tenantId === tenant?.id);

  const productVariants = product ? getProductVariants(product.id) : [];
  const defaultVar = productVariants.find(v => v.isDefault) || productVariants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVar?.id || '');

  if (!tenant || !product) {
    notFound();
  }

  const selectedVariant = productVariants.find(v => v.id === selectedVariantId) || defaultVar;
  if (!selectedVariant) return null;

  const currentPriceObj = getCurrentPrice(selectedVariant.id);
  const price = currentPriceObj ? currentPriceObj.amount : 0;

  // Stock computed reactively
  const stock = getVariantStock(selectedVariant.id);

  const attributes = getVariantAttributes(selectedVariant.id);
  const attributeSuffix = attributes.length > 0 
    ? ` - ${attributes.map(a => a.attributeValue).join(', ')}`
    : '';

  const specs = getProductSpecs(product.id);
  const batches = getProductBatches(product.id);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link 
          href={`/${tenant.slug}/products`} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-black hover:border-zinc-400 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Product Image */}
        <div className="overflow-hidden rounded-3xl border-2 border-zinc-900 bg-zinc-50 aspect-square">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="h-full w-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="bg-zinc-900 text-white text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest">
                {tenant.name}
              </span>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900 mt-2">{product.name}</h1>
              <p className="text-[10px] text-zinc-400 font-mono mt-1">CODE: {product.code}</p>
            </div>

            <p className="text-3xl font-black text-blue-600 tracking-tighter italic">
              {formatPrice(price)}
            </p>
            
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Sélectionner Variante</h3>
              <div className="flex flex-wrap gap-2">
                {productVariants.map((v) => {
                  const attrs = getVariantAttributes(v.id);
                  const isSelected = v.id === selectedVariantId;
                  const label = attrs.map(a => a.attributeValue).join(', ') || v.sku;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' 
                          : 'border-zinc-200 bg-white hover:border-zinc-400 text-zinc-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</h3>
              <p className="mt-2 text-sm text-zinc-600 font-bold leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specifications (product-core Spec) */}
            {specs && (
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5" /> Spécifications Techniques
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-zinc-400" />
                    <span>Poids : <strong className="text-zinc-900">{specs.weightKg} Kg</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize2 className="h-4 w-4 text-zinc-400" />
                    <span>Dimensions : <strong className="text-zinc-900">{specs.lengthCm}x{specs.widthCm}x{specs.heightCm} cm</strong></span>
                  </div>
                  <div className="col-span-2 border-t pt-2">
                    <span>Composants / Matières : <strong className="text-zinc-900">{specs.materials}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Batches Tracing */}
            {batches.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> Informations de Traçabilité (Lots)
                </h4>
                <div className="space-y-1.5">
                  {batches.map(b => (
                    <div key={b.id} className="flex justify-between items-center text-xs font-bold text-amber-900">
                      <span>Lot : <span className="font-mono text-zinc-800">{b.lotNumber}</span></span>
                      <span className="text-[10px] text-zinc-400">Exp : {b.expiryDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-bold text-zinc-700">
                  {stock > 0 ? `Stock Vérifié (${stock} disponibles)` : 'Rupture de stock physique'}
                </span>
              </div>
              <div className="flex items-center gap-2 border-l pl-4">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">KSM Securisé</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <AddToCartButton 
              product={product} 
              selectedVariant={selectedVariant}
              price={price}
              stock={stock}
              attributeSuffix={attributeSuffix}
            />
            
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-zinc-50 border">
                <Truck className="h-4 w-4 mb-1.5 text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-800">Livraison</span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Douala / Ydé</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-zinc-50 border">
                <RefreshCcw className="h-4 w-4 mb-1.5 text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-800">Retours</span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Sous 14j</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-zinc-50 border">
                <ShieldCheck className="h-4 w-4 mb-1.5 text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-800">Garantie</span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Certifiée</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
