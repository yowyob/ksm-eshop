import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // variantId
  variantId: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface AddItemParams {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  imageUrl: string;
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
          const existingItem = state.items.find((item) => item.id === params.variantId);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === params.variantId
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: params.variantId,
                variantId: params.variantId,
                productId: params.productId,
                name: params.name,
                price: params.price,
                imageUrl: params.imageUrl,
                quantity: 1
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
