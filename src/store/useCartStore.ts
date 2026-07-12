import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // variantId
  variantId: string;
  productId: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  imageUrl: string;
  quantity: number;
  tenantId?: string;
  selectedOptions?: Record<string, string>;
}

interface AddItemParams {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  imageUrl?: string;
  tenantId?: string;
  selectedOptions?: Record<string, string>;
}

interface CartState {
  items: CartItem[];
  addItem: (params: AddItemParams) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (params) => {
        set((state) => {
          const vId = params.variantId || params.productId;
          const existingItem = state.items.find((item) => item.id === vId);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === vId
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: vId,
                variantId: vId,
                productId: params.productId,
                name: params.name,
                price: params.price,
                wholesalePrice: params.wholesalePrice,
                imageUrl: params.imageUrl || '',
                quantity: 1,
                tenantId: params.tenantId,
                selectedOptions: params.selectedOptions
              }
            ]
          };
        });
      },
      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== variantId),
        }));
      },
      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === variantId ? { ...item, quantity: Math.max(0, quantity) } : item
          ).filter(item => item.quantity > 0),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'ksm-cart-storage',
    }
  )
);
