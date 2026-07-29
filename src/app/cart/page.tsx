'use client';

import { useCartStore } from '@/store/useCartStore';
import { useTranslations, useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

function translateVariantInName(name: string, locale: string): string {
  if (locale !== 'en') return name;
  const match = name.match(/\(([^)]+)\)$/);
  if (!match) return name;
  const rawVal = match[1];
  const lowerVal = rawVal.toLowerCase().trim();
  let translated = rawVal;
  if (lowerVal === 'noir' || lowerVal === 'noir sidéral') translated = 'Space Gray';
  else if (lowerVal === 'blanc') translated = 'White';
  else if (lowerVal === 'rouge') translated = 'Red';
  else if (lowerVal === 'argent') translated = 'Silver';
  else if (lowerVal === 'or') translated = 'Gold';
  else if (lowerVal === 'bleu') translated = 'Blue';
  else if (lowerVal === 'vert') translated = 'Green';
  else if (lowerVal === 'gris') translated = 'Gray';
  else if (lowerVal === 'petit') translated = 'Small';
  else if (lowerVal === 'moyen') translated = 'Medium';
  else if (lowerVal === 'grand') translated = 'Large';
  return name.slice(0, match.index) + `(${translated.toUpperCase()})`;
}

export default function CartPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { items, removeItem, updateQuantity, toggleSelectForPurchase } = useCartStore();
  const t = useTranslations('Cart');
  const locale = useLocale();

  // Stocke les informations des variantes chargées du backend pour chaque produit
  const [productDetails, setProductDetails] = useState<Record<string, { label: string; values: string[] } | null>>({});
  const [loadingDetails, setLoadingDetails] = useState(true);

  const totalPrice = items
    .filter(item => item.selectedForPurchase !== false && item.quantity > 0)
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Charger les détails des variantes pour chaque produit du panier
  useEffect(() => {
    if (!isMounted || items.length === 0) return;

    async function fetchAllDetails() {
      setLoadingDetails(true);
      const details: Record<string, any> = {};
      try {
        for (const item of items) {
          // Si on a déjà chargé, on ne re-fetch pas
          if (productDetails[item.productId]) continue;

          // Charger le produit du backend (pour avoir variantLabel)
          const res = await fetch(`/api/products?organizationId=${item.tenantId}`);
          const data = await res.json();
          if (data.success && data.data) {
            const list = Array.isArray(data.data) ? data.data : (data.data.content || []);
            const prod = list.find((p: any) => p.id === item.productId);
            if (prod && prod.variantLabel && prod.variantLabel !== 'Standard') {
              const raw = prod.variantLabel.trim();
              const colonIdx = raw.indexOf(':');
              if (colonIdx >= 0) {
                const label = raw.slice(0, colonIdx).trim();
                const values = raw.slice(colonIdx + 1).split(',').map((v: any) => v.trim()).filter((v: any) => v !== '');
                if (label && values.length > 0) {
                  details[item.productId] = { label, values };
                }
              }
            }
          }
        }
        setProductDetails(prev => ({ ...prev, ...details }));
      } catch (e) {
        console.error('Erreur chargement variantes dans panier:', e);
      } finally {
        setLoadingDetails(false);
      }
    }

    fetchAllDetails();
  }, [isMounted, items]);

  const handleRemoveItem = (productId: string, productName: string) => {
    if (confirm(`Voulez-vous vraiment supprimer "${productName}" ? Cette action est définitive.`)) {
      removeItem(productId);
    }
  };

  // Mettre à jour la variante sélectionnée pour un produit dans le panier
  const handleSelectVariant = (itemId: string, variantVal: string, baseProductName: string, label: string) => {
    // Retrouver l'item dans le panier
    const item = items.find(it => it.id === itemId);
    if (!item) return;

    const variantSuffix = ` (${variantVal})`;
    
    // Mettre à jour l'item dans le panier avec la variante choisie
    // On met à jour selectedOptions et le variantId
    const updatedOptions = { [label]: variantVal };
    const updatedVariantId = `${item.productId}-${variantVal}`;

    // Le store de panier n'a pas de méthode générique updateItem, mais on peut simuler en modifiant l'état
    // ou en réajoutant. Dans notre store `useCartStore`, modifions l'objet de façon réactive
    useCartStore.setState((state) => ({
      items: state.items.map((it) => 
        it.id === itemId 
          ? { 
              ...it, 
              variantId: updatedVariantId, 
              name: baseProductName.split(' (')[0] + variantSuffix, 
              selectedOptions: updatedOptions 
            } 
          : it
      )
    }));
  };

  if (!isMounted) return null;

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex h-[60vh] flex-col items-center justify-center px-4 bg-white rounded-3xl border-4 border-zinc-200 mt-12 shadow-inner">
        <div className="rounded-full bg-zinc-100 p-8 mb-6 border-4 border-zinc-50">
          <ShoppingBag className="h-16 w-16 text-zinc-300" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter text-center">Votre panier est vide</h1>
        <p className="mt-2 text-lg font-bold text-zinc-400 text-center">Commencez vos achats pour synchroniser vos stocks.</p>
        <Link href={`/`} className="mt-10">
          <Button className="h-16 px-8 gap-3 bg-zinc-900 font-black uppercase italic tracking-tighter transition-all hover:scale-105">
            <ArrowLeft className="h-5 w-5" /> Explorer le catalogue
          </Button>
        </Link>
      </div>
    );
  }

  // Vérifier si tous les articles sélectionnés pour l'achat nécessitant une variante en ont une sélectionnée
  const selectedItems = items.filter((item) => item.selectedForPurchase !== false && item.quantity > 0);
  const isCheckoutAllowed = selectedItems.length > 0 && selectedItems.every((item) => {
    const varInfo = productDetails[item.productId];
    if (!varInfo) return true; // Pas de variantes requises
    
    // Si variantes requises, l'utilisateur doit avoir fait une sélection
    const selected = item.selectedOptions && Object.values(item.selectedOptions)[0];
    return !!selected;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 font-bold border-2 border-zinc-900 uppercase text-xs">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase italic">{t('cartSummary')}</h1>
        <div className="w-20" />
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => {
            const varInfo = productDetails[item.productId];
            const hasRequiredVariants = varInfo !== undefined && varInfo !== null;
            const currentSelectedVal = item.selectedOptions ? Object.values(item.selectedOptions)[0] as string : '';

            return (
              <Card key={item.id} className={`border-4 overflow-hidden shadow-lg transition-all ${
                item.quantity === 0 
                  ? 'border-dashed border-zinc-200 bg-zinc-50/50 opacity-60' 
                  : 'border-zinc-200 hover:border-zinc-900 bg-white'
              }`}>
                <CardContent className="flex flex-col md:flex-row items-start md:items-center p-6 gap-6">
                  {/* Checkbox de sélection individuelle */}
                  <div className="flex items-center justify-center pr-2 flex-shrink-0">
                    <input
                      type="checkbox"
                      disabled={item.quantity === 0}
                      checked={item.quantity > 0 && item.selectedForPurchase !== false}
                      onChange={() => toggleSelectForPurchase(item.id)}
                      className={`h-6 w-6 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 transition-all accent-blue-600 scale-125 ${
                        item.quantity === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                    />
                  </div>

                  <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-50 bg-zinc-50 shadow-inner mx-auto md:mx-0">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col w-full">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-black text-zinc-900 uppercase italic tracking-tighter">{translateVariantInName(item.name, locale)}</h3>
                      </div>
                      <p className="text-xl font-black text-blue-600 tracking-tighter">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                      {t('unitPrice')}: {formatPrice(item.price)}
                      {(() => {
                        const sizes = item.allowedSaleSizes && item.allowedSaleSizes.length > 0
                          ? item.allowedSaleSizes
                          : [
                              { size: 'DETAIL', minQuantity: 1 },
                              { size: 'DEMIS_GROS', minQuantity: 5 },
                              { size: 'GROS', minQuantity: 10 },
                              { size: 'SUPER_GROS', minQuantity: 20 }
                            ];
                        
                        const semiGros = sizes.find((s: any) => s.size === 'DEMIS_GROS' || s.size === 'SEMI_GROS');
                        const gros = sizes.find((s: any) => s.size === 'GROS');
                        const superGros = sizes.find((s: any) => s.size === 'SUPER_GROS');
                        
                        if (superGros && item.quantity >= superGros.minQuantity) {
                          return <span className="bg-purple-100 text-purple-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{t('superWholesale')}</span>;
                        }
                        if (gros && item.quantity >= gros.minQuantity) {
                          return <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{t('wholesale')}</span>;
                        }
                        if (semiGros && item.quantity >= semiGros.minQuantity) {
                          return <span className="bg-blue-100 text-blue-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{t('semiWholesale')}</span>;
                        }
                        return null;
                      })()}
                    </p>

                    {item.quantity === 0 && (
                      <p className="text-[10px] font-black text-amber-600 bg-amber-50/50 border border-amber-200/50 p-2 rounded-xl mt-1 mb-3 uppercase tracking-wider">
                        {t('qtyZeroWarning')}
                      </p>
                    )}
 
                    {/* SÉLECTEUR DE VARIANTE INTÉGRÉ AU PANIER */}
                    {hasRequiredVariants && varInfo && (
                      <div className={`mb-4 p-4 rounded-2xl border-2 transition-all ${
                        !currentSelectedVal 
                          ? 'bg-red-50/50 border-red-500 shadow-md shadow-red-50' 
                          : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                          {locale === 'en' ? `Select ${translateVariantLabel(varInfo.label, locale)}` : `Sélectionnez ${varInfo.label}`} :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {varInfo.values.map((val, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectVariant(item.id, val, item.name, varInfo.label)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                                currentSelectedVal === val
                                  ? 'bg-zinc-900 text-white border-zinc-900'
                                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                              }`}
                            >
                               {translateVariantValue(val, locale)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center rounded-xl border-4 border-zinc-900 bg-white overflow-hidden shadow-md">
                        <button
                          disabled={item.quantity === 0}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className={`p-3 hover:bg-zinc-100 border-r-2 border-zinc-900 transition-colors ${
                            item.quantity === 0 ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                        >
                          <Minus className="h-5 w-5 text-zinc-900" />
                        </button>
                        <span className="w-12 text-center text-lg font-black text-zinc-900 italic">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-3 hover:bg-zinc-100 border-l-2 border-zinc-900 transition-colors"
                        >
                          <Plus className="h-5 w-5 text-zinc-900" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="text-red-600 hover:bg-red-50 p-3 rounded-xl transition-all border-2 border-transparent hover:border-red-200"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <aside>
          <Card className="border-4 border-zinc-900 shadow-2xl bg-white rounded-3xl overflow-hidden sticky top-24">
            <div className="bg-zinc-900 p-6 text-white text-center">
               <h2 className="text-xl font-black uppercase italic tracking-tighter">{t('validationEPay')}</h2>
            </div>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between text-zinc-500 uppercase font-black text-xs tracking-widest">
                  <p>{t('articlesCount', {count: items.length})}</p>
                  <p>{formatPrice(totalPrice)}</p>
                </div>
                <div className="flex items-center justify-between text-zinc-500 uppercase font-black text-xs tracking-widest">
                  <p>{t('delivery')}</p>
                  <p className="text-zinc-400 italic">{t('optional')}</p>
                </div>
                <div className="border-t-4 border-zinc-100 pt-6 flex flex-col items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t('netToPay')}</p>
                  <p className="text-4xl font-black text-blue-600 tracking-tighter italic">{formatPrice(totalPrice)}</p>
                </div>
              </div>
              
              <div className="mt-10 space-y-4">
                {isCheckoutAllowed ? (
                  <Link href={`/checkout`} className="block w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 h-20 text-xl font-black uppercase italic tracking-tighter shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]">
                      {t('checkout')} <ArrowLeft className="ml-3 h-6 w-6 rotate-180" />
                    </Button>
                  </Link>
                ) : (
                  <div>
                    <Button disabled className="w-full bg-zinc-300 text-zinc-500 h-20 text-sm font-black uppercase tracking-widest cursor-not-allowed">
                      {t('selectVariantsBtn')}
                    </Button>
                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center mt-2">
                      {t('selectVariantsWarn')}
                    </p>
                  </div>
                )}
                <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  {t('syncStockDesc')}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
