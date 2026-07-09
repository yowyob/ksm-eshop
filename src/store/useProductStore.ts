import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Product, 
  Category, 
  CategoryI18n, 
  ProductSpec, 
  Variant, 
  VariantAttribute, 
  Price, 
  Batch, 
  MediaAsset 
} from '../lib/types';
import { 
  PRODUCTS as INITIAL_PRODUCTS,
  CATEGORIES as INITIAL_CATEGORIES,
  CATEGORY_I18NS as INITIAL_CATEGORY_I18NS,
  PRODUCT_SPECS as INITIAL_PRODUCT_SPECS,
  VARIANTS as INITIAL_VARIANTS,
  VARIANT_ATTRIBUTES as INITIAL_VARIANT_ATTRIBUTES,
  PRICES as INITIAL_PRICES,
  BATCHES as INITIAL_BATCHES,
  MEDIA_ASSETS as INITIAL_MEDIA_ASSETS
} from '../lib/mock-data';

interface ProductState {
  products: Product[];
  categories: Category[];
  categoryI18ns: CategoryI18n[];
  productSpecs: ProductSpec[];
  variants: Variant[];
  variantAttributes: VariantAttribute[];
  prices: Price[];
  batches: Batch[];
  mediaAssets: MediaAsset[];
  isLoading: boolean;
  error: string | null;

  // Fetch Actions
  fetchProducts: (organizationId?: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchVariants: (productId: string) => Promise<void>;

  // Selectors/Helpers
  getCurrentPrice: (variantId: string, evaluationDate?: string) => Price | undefined;
  getVariantAttributes: (variantId: string) => VariantAttribute[];
  getProductVariants: (productId: string) => Variant[];
  getProductSpecs: (productId: string) => ProductSpec | undefined;
  getProductBatches: (productId: string) => Batch[];

  // Actions
  addProduct: (
    product: Product, 
    specs?: ProductSpec, 
    defaultVariant?: Variant, 
    attributes?: VariantAttribute[], 
    initialPrice?: Price
  ) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;

  addVariant: (variant: Variant, attributes: VariantAttribute[], price: Price) => Promise<boolean>;
  updateVariant: (variant: Variant) => Promise<boolean>;
  deleteVariant: (variantId: string) => Promise<boolean>;

  addPrice: (price: Price) => Promise<boolean>;
  deletePrice: (priceId: string) => Promise<boolean>;

  addBatch: (batch: Batch) => Promise<boolean>;
  deleteBatch: (batchId: string) => Promise<boolean>;

  addCategory: (category: Category, i18nFr: CategoryI18n, i18nEn?: CategoryI18n) => Promise<boolean>;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
      categoryI18ns: INITIAL_CATEGORY_I18NS,
      productSpecs: INITIAL_PRODUCT_SPECS,
      variants: INITIAL_VARIANTS,
      variantAttributes: INITIAL_VARIANT_ATTRIBUTES,
      prices: INITIAL_PRICES,
      batches: INITIAL_BATCHES,
      mediaAssets: INITIAL_MEDIA_ASSETS,
      isLoading: false,
      error: null,

      fetchProducts: async (organizationId = 'o1') => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/products?organizationId=${organizationId}`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            // Map backend products to frontend model if needed, but they are very similar
            const backendProducts = res.data.map((p: any) => ({
              id: p.id,
              tenantId: p.tenantId || 't1',
              organizationId: p.organizationId || organizationId,
              code: p.sku || p.code || 'PRD-UNK',
              name: p.name || 'Produit sans nom',
              description: p.description || '',
              categoryId: p.categoryCode || p.categoryId || 'c1',
              status: p.status || 'ACTIVE',
              createdAt: p.createdAt || new Date().toISOString(),
              isFeatured: p.isFeatured || false,
              imageUrl: p.photo || p.imageUrl || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80',
            }));

            // Also load price and variants from product data if nested
            const fetchedVariants: Variant[] = [];
            const fetchedPrices: Price[] = [];
            res.data.forEach((p: any) => {
              if (p.sku) {
                const defaultVarId = `v-${p.id}`;
                fetchedVariants.push({
                  id: defaultVarId,
                  productId: p.id,
                  sku: p.sku,
                  barcode: p.barcode || '',
                  isDefault: true,
                  status: p.status || 'ACTIVE',
                });
                
                if (p.unitPrice) {
                  fetchedPrices.push({
                    id: `pr-${p.id}`,
                    variantId: defaultVarId,
                    amount: p.unitPrice,
                    currency: p.currency || 'FCFA',
                    priceType: 'RETAIL',
                    effectiveFrom: '2026-01-01',
                  });
                }
              }

              if (Array.isArray(p.allowedSaleSizes)) {
                p.allowedSaleSizes.forEach((sz: any, i: number) => {
                  const varId = `v-${p.id}-${i}`;
                  fetchedVariants.push({
                    id: varId,
                    productId: p.id,
                    sku: `${p.sku || p.code}-${sz.size}`,
                    barcode: '',
                    isDefault: false,
                    status: 'ACTIVE',
                  });
                  fetchedPrices.push({
                    id: `pr-${p.id}-${i}`,
                    variantId: varId,
                    amount: sz.unitPrice,
                    currency: p.currency || 'FCFA',
                    priceType: 'RETAIL',
                    effectiveFrom: '2026-01-01',
                  });
                });
              }
            });

            set({ 
              products: backendProducts, 
              variants: fetchedVariants.length > 0 ? fetchedVariants : get().variants,
              prices: fetchedPrices.length > 0 ? fetchedPrices : get().prices,
              isLoading: false 
            });
          } else {
            set({ error: res.message || 'Failed to fetch products', isLoading: false });
          }
        } catch (err: any) {
          set({ error: err.message || 'Error fetching products', isLoading: false });
        }
      },

      fetchCategories: async () => {
        try {
          const res = await fetch('/api/categories').then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const backendCats = res.data.map((c: any) => ({
              id: c.code || c.id,
              tenantId: 't1', // default fallback
              organizationId: c.organizationId || 'o1',
              code: c.code,
              parentId: c.parentId || null,
              level: c.level || 0,
            }));

            // Map translations to local i18n
            const translations: CategoryI18n[] = [];
            res.data.forEach((c: any) => {
              if (c.translations) {
                Object.entries(c.translations).forEach(([locale, t]: [string, any]) => {
                  translations.push({
                    categoryId: c.code || c.id,
                    locale,
                    name: t.name || c.name || '',
                    description: t.description || '',
                  });
                });
              } else {
                translations.push({
                  categoryId: c.code || c.id,
                  locale: 'fr',
                  name: c.name || c.code,
                  description: c.description || '',
                });
              }
            });

            set({ categories: backendCats, categoryI18ns: translations });
          }
        } catch (err) {
          console.error('Error fetching categories:', err);
        }
      },

      fetchVariants: async (productId: string) => {
        try {
          const res = await fetch(`/api/products/${productId}/variants`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const backendVariants = res.data.map((v: any) => ({
              id: v.id,
              productId: v.productId || productId,
              sku: v.sku,
              barcode: v.barcode,
              isDefault: v.isDefault || false,
              status: v.status || 'ACTIVE',
            }));
            set(state => ({
              variants: [...state.variants.filter(v => v.productId !== productId), ...backendVariants]
            }));
          }
        } catch (err) {
          console.error('Error fetching variants:', err);
        }
      },

      getCurrentPrice: (variantId, evaluationDate) => {
        const date = evaluationDate || new Date().toISOString().split('T')[0];
        const variantPrices = get().prices.filter(p => p.variantId === variantId);
        if (variantPrices.length === 0) return undefined;

        // Sort by effectiveFrom descending
        const sortedPrices = [...variantPrices].sort((a, b) => 
          b.effectiveFrom.localeCompare(a.effectiveFrom)
        );

        // Find the most recent price whose effectiveFrom is <= evaluationDate
        return sortedPrices.find(p => p.effectiveFrom <= date) || sortedPrices[sortedPrices.length - 1];
      },

      getVariantAttributes: (variantId) => {
        return get().variantAttributes.filter(attr => attr.variantId === variantId);
      },

      getProductVariants: (productId) => {
        return get().variants.filter(v => v.productId === productId);
      },

      getProductSpecs: (productId) => {
        return get().productSpecs.find(s => s.productId === productId);
      },

      getProductBatches: (productId) => {
        return get().batches.filter(b => b.productId === productId);
      },

      addProduct: async (product, specs, defaultVariant, attributes, initialPrice) => {
        // Map to CreateProductRequest
        const reqBody = {
          organizationId: product.organizationId || 'o1',
          sku: defaultVariant?.sku || product.code,
          name: product.name,
          categoryCode: product.categoryId,
          barcode: defaultVariant?.barcode || '',
          description: product.description,
          unitPrice: initialPrice?.amount || 0,
          currency: initialPrice?.currency || 'FCFA',
          status: 'ACTIVE',
          photo: product.imageUrl,
          quantity: 0,
        };

        try {
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
          }).then(r => r.json());

          if (res.success) {
            // Trigger local refresh
            await get().fetchProducts(product.organizationId);
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error adding product:', err);
          return false;
        }
      },

      updateProduct: async (updatedProduct) => {
        try {
          const res = await fetch(`/api/products/${updatedProduct.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: updatedProduct.organizationId || 'o1',
              sku: (updatedProduct as any).sku || updatedProduct.code,
              name: updatedProduct.name,
              familyCode: (updatedProduct as any).familyCode || 'STANDARD',
              variantLabel: (updatedProduct as any).variantLabel || 'Standard',
              description: updatedProduct.description,
              unitPrice: (updatedProduct as any).unitPrice && (updatedProduct as any).unitPrice > 0 ? (updatedProduct as any).unitPrice : 1,
              currency: (updatedProduct as any).currency || 'FCFA',
              photo: updatedProduct.imageUrl,
              status: updatedProduct.status,
            }),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchProducts(updatedProduct.organizationId);
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error updating product:', err);
          return false;
        }
      },

      deleteProduct: async (productId) => {
        try {
          const res = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
          }).then(r => r.json());

          if (res.success) {
            set(state => ({
              products: state.products.filter(p => p.id !== productId)
            }));
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error deleting product:', err);
          return false;
        }
      },

      addVariant: async (variant, attributes, price) => {
        try {
          const res = await fetch(`/api/products/${variant.productId}/variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sku: variant.sku,
              barcode: variant.barcode,
              unitPrice: price.amount,
              currency: price.currency,
              status: 'ACTIVE',
            }),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchVariants(variant.productId);
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error adding variant:', err);
          return false;
        }
      },

      updateVariant: async (updatedVariant) => {
        // Fallback local update
        set((state) => ({
          variants: state.variants.map((v) => v.id === updatedVariant.id ? updatedVariant : v)
        }));
        return true;
      },

      deleteVariant: async (variantId) => {
        // Fallback local delete
        set((state) => ({
          variants: state.variants.filter((v) => v.id !== variantId),
          variantAttributes: state.variantAttributes.filter((a) => a.variantId !== variantId),
          prices: state.prices.filter((pr) => pr.variantId !== variantId),
          mediaAssets: state.mediaAssets.filter((m) => m.targetId !== variantId)
        }));
        return true;
      },

      addPrice: async (price) => {
        // Fallback local add
        set((state) => ({
          prices: [...state.prices, price]
        }));
        return true;
      },

      deletePrice: async (priceId) => {
        set((state) => ({
          prices: state.prices.filter((pr) => pr.id !== priceId)
        }));
        return true;
      },

      addBatch: async (batch) => {
        set((state) => ({
          batches: [...state.batches, batch]
        }));
        return true;
      },

      deleteBatch: async (batchId) => {
        set((state) => ({
          batches: state.batches.filter((b) => b.id !== batchId)
        }));
        return true;
      },

      addCategory: async (category, i18nFr, i18nEn) => {
        try {
          const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: category.code,
              name: i18nFr.name,
              description: i18nFr.description,
              organizationId: category.organizationId || 'o1',
            }),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchCategories();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error adding category:', err);
          return false;
        }
      }
    }),
    {
      name: 'ksm-product-storage',
    }
  )
);
