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
  fetchOrders: (organizationId?: string) => Promise<void>;
  addOrder: (order: Order) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
}

const INITIAL_ORDERS: Order[] = [
  { id: 'KSM-129482', customerName: 'Moussa Ibrahim', total: 4500, status: 'shipped', date: 'Aujourd\'hui, 14:20', tenantId: 't1', items: [] },
  { id: 'KSM-129483', customerName: 'Alice Ngo', total: 12500, status: 'pending', date: 'Aujourd\'hui, 11:05', tenantId: 't1', items: [] },
  { id: 'KSM-129484', customerName: 'Jean Dupont', total: 850, status: 'delivered', date: 'Hier, 18:45', tenantId: 't1', items: [] },
  { id: 'KSM-129485', customerName: 'Céline Atangana', total: 250000, status: 'processing', date: 'Hier, 09:12', tenantId: 't2', items: [] },
];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: INITIAL_ORDERS,
      isLoading: false,
      error: null,

      fetchOrders: async (organizationId = 'o1') => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/orders?organizationId=${organizationId}`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const backendOrders = res.data.map((o: any) => ({
              id: o.documentNumber || o.orderNumber || o.id,
              customerName: o.counterparty?.name || o.customerThirdPartyId || 'Client',
              customerId: o.counterparty?.id || o.customerThirdPartyId,
              total: o.totalAmount || o.subtotalAmount || 0,
              status: o.status?.toLowerCase() || 'pending',
              date: new Date(o.createdAt || Date.now()).toLocaleDateString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              tenantId: 't1', // fallback
              items: o.lines || [],
            }));
            set({ orders: backendOrders, isLoading: false });
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
          customerThirdPartyId: order.customerId || order.customerName, // Use UUID if available
          orderNumber: order.id,
          currency: 'FCFA',
          lines: order.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        };

        try {
          const res = await fetch('/api/orders', {
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
