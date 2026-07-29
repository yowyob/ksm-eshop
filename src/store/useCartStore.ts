import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // variantId
  variantId: string;
  productId: string;
  name: string;
  price: number; // Prix unitaire actuel résolu en fonction de la quantité
  basePrice: number; // Prix de détail de base
  wholesalePrice?: number;
  imageUrl: string;
  quantity: number;
  tenantId?: string;
  selectedOptions?: Record<string, string>;
  allowedSaleSizes?: any[];
  selectedForPurchase?: boolean;
}

interface AddItemParams {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  basePrice?: number;
  wholesalePrice?: number;
  imageUrl?: string;
  tenantId?: string;
  selectedOptions?: Record<string, string>;
  allowedSaleSizes?: any[];
  quantity?: number;
}

interface CartState {
  items: CartItem[];
  userId: string | null;
  addItem: (params: AddItemParams) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  toggleSelectForPurchase: (variantId: string) => void;
  clearCart: () => void;
  clearCheckedItems: () => void;
  setUserId: (userId: string | null) => void;
}

// Fonction utilitaire pour trouver le bon prix unitaire basé sur la quantité et allowedSaleSizes
function resolveUnitPrice(quantity: number, basePrice: number, allowedSaleSizes?: any[]): number {
  let sizes = allowedSaleSizes;
  
  // Si le tableau allowedSaleSizes est vide ou absent, on génère un fallback automatique (90% pour demi-gros, 80% pour gros, 70% pour super gros)
  if (!sizes || sizes.length === 0) {
    sizes = [
      { size: 'DETAIL', unitPrice: basePrice, minQuantity: 1, active: true },
      { size: 'DEMIS_GROS', unitPrice: Math.round(basePrice * 0.9), minQuantity: 5, active: true },
      { size: 'GROS', unitPrice: Math.round(basePrice * 0.8), minQuantity: 10, active: true },
      { size: 'SUPER_GROS', unitPrice: Math.round(basePrice * 0.7), minQuantity: 20, active: true }
    ];
  }

  // Trier par minQuantity décroissante pour tester les plus gros paliers en premier
  const sortedSizes = [...sizes]
    .filter(s => s.active && typeof s.unitPrice === 'number')
    .sort((a, b) => b.minQuantity - a.minQuantity);

  for (const size of sortedSizes) {
    if (quantity >= size.minQuantity) {
      return size.unitPrice;
    }
  }

  return basePrice;
}

async function syncCartWithServer(userId: string, items: any[]) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items })
    });
  } catch (error) {
    console.error('Failed to sync cart with server:', error);
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      addItem: (params) => {
        set((state) => {
          const vId = params.variantId || params.productId;
          const existingItem = state.items.find((item) => item.id === vId);
          const addQty = params.quantity || 1;
          const bPrice = params.basePrice !== undefined ? params.basePrice : params.price;
          
          let newItems = [];
          if (existingItem) {
            const newQty = existingItem.quantity + addQty;
            const resolvedPrice = resolveUnitPrice(newQty, bPrice, params.allowedSaleSizes);
            newItems = state.items.map((item) =>
              item.id === vId
                ? { ...item, quantity: newQty, price: resolvedPrice }
                : item
            );
          } else {
            const resolvedPrice = resolveUnitPrice(addQty, bPrice, params.allowedSaleSizes);
            newItems = [
              ...state.items,
              {
                id: vId,
                variantId: vId,
                productId: params.productId,
                name: params.name,
                price: resolvedPrice,
                basePrice: bPrice,
                wholesalePrice: params.wholesalePrice,
                imageUrl: params.imageUrl || '',
                quantity: addQty,
                tenantId: params.tenantId,
                selectedOptions: params.selectedOptions,
                allowedSaleSizes: params.allowedSaleSizes,
                selectedForPurchase: true
              }
            ];
          }

          // Sauvegarde automatique du panier par utilisateur
          if (state.userId && typeof window !== 'undefined') {
            localStorage.setItem(`ksm-cart-${state.userId}`, JSON.stringify(newItems));
            syncCartWithServer(state.userId, newItems);
          }
          return { items: newItems };
        });
      },
      removeItem: (variantId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== variantId);
          if (state.userId && typeof window !== 'undefined') {
            localStorage.setItem(`ksm-cart-${state.userId}`, JSON.stringify(newItems));
            syncCartWithServer(state.userId, newItems);
          }
          return { items: newItems };
        });
      },
      updateQuantity: (variantId, quantity) => {
        set((state) => {
          const newItems = state.items.map((item) => {
            if (item.id === variantId) {
              const qty = Math.max(0, quantity);
              const resolvedPrice = resolveUnitPrice(qty, item.basePrice, item.allowedSaleSizes);
              return { 
                ...item, 
                quantity: qty, 
                price: resolvedPrice,
                selectedForPurchase: qty === 0 ? false : item.selectedForPurchase
              };
            }
            return item;
          });

          if (state.userId && typeof window !== 'undefined') {
            localStorage.setItem(`ksm-cart-${state.userId}`, JSON.stringify(newItems));
            syncCartWithServer(state.userId, newItems);
          }
          return { items: newItems };
        });
      },
      toggleSelectForPurchase: (variantId) => {
        set((state) => {
          const newItems = state.items.map((item) =>
            item.id === variantId
              ? { ...item, selectedForPurchase: !(item.selectedForPurchase !== false) }
              : item
          );
          if (state.userId && typeof window !== 'undefined') {
            localStorage.setItem(`ksm-cart-${state.userId}`, JSON.stringify(newItems));
            syncCartWithServer(state.userId, newItems);
          }
          return { items: newItems };
        });
      },
      clearCart: () => {
        const uId = get().userId;
        if (uId && typeof window !== 'undefined') {
          localStorage.removeItem(`ksm-cart-${uId}`);
          syncCartWithServer(uId, []);
        }
        set({ items: [] });
      },
      clearCheckedItems: () => {
        set((state) => {
          const newItems = state.items.filter((item) => item.selectedForPurchase === false);
          if (state.userId && typeof window !== 'undefined') {
            localStorage.setItem(`ksm-cart-${state.userId}`, JSON.stringify(newItems));
            syncCartWithServer(state.userId, newItems);
          }
          return { items: newItems };
        });
      },
      setUserId: async (uId) => {
        if (typeof window === 'undefined') return;

        if (uId) {
          // 1. Tenter de charger le panier depuis l'API serveur de l'e-shop
          try {
            const res = await fetch(`/api/cart?userId=${uId}`);
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              set({ userId: uId, items: json.data });
              localStorage.setItem(`ksm-cart-${uId}`, JSON.stringify(json.data));
              return;
            }
          } catch (e) {
            console.warn('[CartStore] API loading failed, fallback to local:', e);
          }

          // 2. Fallback local
          const savedCart = localStorage.getItem(`ksm-cart-${uId}`);
          if (savedCart) {
            try {
              const parsed = JSON.parse(savedCart);
              set({ userId: uId, items: parsed });
              syncCartWithServer(uId, parsed);
              return;
            } catch {}
          }
          
          // Si l'utilisateur n'avait pas de panier sauvegardé, on associe les articles actuels (invité) à son compte
          const currentItems = get().items;
          if (currentItems.length > 0) {
            localStorage.setItem(`ksm-cart-${uId}`, JSON.stringify(currentItems));
            syncCartWithServer(uId, currentItems);
          }
          set({ userId: uId });
        } else {
          // Déconnexion : repasser à l'état invité en chargeant le panier invité si besoin
          const guestCart = localStorage.getItem('ksm-cart-guest');
          const guestItems = guestCart ? JSON.parse(guestCart) : [];
          set({ userId: null, items: guestItems });
        }
      }
    }),
    {
      name: 'ksm-cart-storage',
    }
  )
);
