import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Order {
  id: string;
  customerName: string;
  customerId?: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  tenantId: string;
  items: any[];
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: (organizationId?: string, customerId?: string) => Promise<void>;
  addOrder: (order: Order) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
}

const INITIAL_ORDERS: Order[] = [];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: INITIAL_ORDERS,
      isLoading: false,
      error: null,

      fetchOrders: async (organizationId?: string, customerId?: string) => {
        set({ isLoading: true, error: null });
        try {
          const params = new URLSearchParams();
          if (organizationId) params.append('organizationId', organizationId);
          if (customerId) params.append('customerId', customerId);
          
          const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;
          const res = await fetch(url).then(r => r.json());
          if (res.success || res.ok) {
            let rawData = res.data || res;
            if (rawData.content && Array.isArray(rawData.content)) {
              rawData = rawData.content;
            } else if (rawData.data && Array.isArray(rawData.data)) {
              rawData = rawData.data;
            }
            
            if (Array.isArray(rawData)) {
              const backendOrders = rawData.map((o: any) => ({
                id: o.documentNumber || o.orderNumber || o.id,
                // _customerName est résolu par l'API depuis les tiers du kernel
                customerName: o._customerName || o.counterparty?.name || o.counterparty?.displayName || o.customerName || o.customerThirdPartyId || 'Client',
                customerId: o.counterparty?.id || o.customerThirdPartyId || o.counterpartyThirdPartyId || o.customerId,
                total: o.totalAmount || o.subtotalAmount || o.total || 0,
                status: o.status?.toLowerCase() || 'pending',
                date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : (o.date || new Date().toLocaleDateString('fr-FR')),
                tenantId: o._orgId || o.organizationId || o.tenantId || 't1', 
                items: o.lines || o.items || [],
              }));
              
              set({ orders: backendOrders, isLoading: false });
            } else {
              set({ error: 'Format de données invalide', isLoading: false });
            }
          } else {
            set({ error: res.message || 'Failed to fetch orders', isLoading: false });
          }
        } catch (err: any) {
          set({ error: err.message || 'Error fetching orders', isLoading: false });
        }
      },

      addOrder: async (order) => {
        // Optimistic UI update
        set((state) => ({ orders: [order, ...state.orders] }));

        const reqBody = {
          organizationId: order.tenantId,
          counterpartyThirdPartyId: order.customerId || order.customerName, // Use UUID if available
          customerName: order.customerName,
          totalAmount: order.total,
          orderNumber: order.id,
          currency: 'FCFA',
          lines: order.items.map(item => ({
            productId: item.productId || item.variantId || item.id,
            name: item.name,
            image: item.imageUrl || item.image, // Fallback for image
            quantity: item.quantity,
            unitPrice: item.price,
            wholesalePrice: item.wholesalePrice,
            selectedOptions: item.selectedOptions,
            taxRate: 0
          })),
        };

        try {
          const res = await fetch('/api/bon-commande', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchOrders();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error adding order:', err);
          return false;
        }
      },

      updateOrderStatus: async (orderId, status) => {
        try {
          let url = `/api/orders/${orderId}`;
          let method = 'PATCH';

          if (status === 'delivered') {
            url = `/api/orders/${orderId}/confirm`;
            method = 'POST';
          } else if (status === 'cancelled') {
            url = `/api/orders/${orderId}/cancel`;
            method = 'POST';
          }

          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'PATCH' ? JSON.stringify({ status }) : undefined,
          }).then(r => r.json());

          if (res.success) {
            await get().fetchOrders();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error updating order status:', err);
          return false;
        }
      },
    }),
    {
      name: 'ksm-order-storage',
    }
  )
);
