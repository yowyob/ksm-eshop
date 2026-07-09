import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Warehouse, 
  StockMovement, 
  WarehouseTransfer, 
  ProductTransformation, 
  InventorySession, 
  InventorySessionItem 
} from '../lib/types';
import { 
  WAREHOUSES as INITIAL_WAREHOUSES,
  STOCK_MOVEMENTS as INITIAL_STOCK_MOVEMENTS,
  WAREHOUSE_TRANSFERS as INITIAL_WAREHOUSE_TRANSFERS,
  PRODUCT_TRANSFORMATIONS as INITIAL_PRODUCT_TRANSFORMATIONS,
  INVENTORY_SESSIONS as INITIAL_INVENTORY_SESSIONS,
  INVENTORY_SESSION_ITEMS as INITIAL_INVENTORY_SESSION_ITEMS
} from '../lib/mock-data';

interface InventoryState {
  warehouses: Warehouse[];
  movements: StockMovement[];
  transfers: WarehouseTransfer[];
  transformations: ProductTransformation[];
  inventorySessions: InventorySession[];
  inventorySessionItems: InventorySessionItem[];
  isLoading: boolean;

  // Fetch Actions
  fetchWarehouses: () => Promise<void>;
  fetchMovements: (organizationId?: string, agencyId?: string, productId?: string) => Promise<void>;
  fetchTransfers: (organizationId?: string) => Promise<void>;
  fetchTransformations: (organizationId?: string) => Promise<void>;
  fetchInventorySessions: (organizationId?: string) => Promise<void>;

  // Selectors
  getVariantStock: (variantId: string, warehouseId?: string) => number;
  getWarehouseStockList: (warehouseId: string) => { variantId: string, stock: number }[];
  isReferenceNumberUnique: (referenceNumber: string) => boolean;

  // Actions
  addWarehouse: (warehouse: Warehouse) => Promise<boolean>;
  
  createMovement: (movement: Omit<StockMovement, 'id' | 'createdAt' | 'referenceNumber'> & { referenceNumber?: string }) => Promise<boolean>;
  validateMovement: (id: string) => Promise<boolean>;
  deleteMovement: (id: string) => Promise<boolean>; // only if DRAFT
  
  createTransfer: (transfer: Omit<WarehouseTransfer, 'id' | 'createdAt' | 'referenceNumber' | 'status'>) => Promise<boolean>;
  completeTransfer: (id: string) => Promise<boolean>;
  deleteTransfer: (id: string) => Promise<boolean>; // only if REQUESTED
  
  createTransformation: (transformation: Omit<ProductTransformation, 'id' | 'createdAt' | 'referenceNumber' | 'status'> & { warehouseId: string }) => Promise<boolean>;
  validateTransformation: (id: string) => Promise<boolean>;
  deleteTransformation: (id: string) => Promise<boolean>; // only if DRAFT
  
  createInventorySession: (
    session: Omit<InventorySession, 'id' | 'createdAt' | 'referenceNumber' | 'status'>,
    items: Omit<InventorySessionItem, 'id' | 'sessionId'>[]
  ) => Promise<boolean>;
  validateInventorySession: (id: string) => Promise<boolean>;
  deleteInventorySession: (id: string) => Promise<boolean>; // only if DRAFT

  dispatchSalesOrder: (tenantId: string, orderId: string, items: { variantId: string, quantity: number }[]) => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      warehouses: INITIAL_WAREHOUSES,
      movements: INITIAL_STOCK_MOVEMENTS,
      transfers: INITIAL_WAREHOUSE_TRANSFERS,
      transformations: INITIAL_PRODUCT_TRANSFORMATIONS,
      inventorySessions: INITIAL_INVENTORY_SESSIONS,
      inventorySessionItems: INITIAL_INVENTORY_SESSION_ITEMS,
      isLoading: false,

      fetchWarehouses: async () => {
        try {
          const res = await fetch('/api/warehouses').then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const backendWarehouses = res.data.map((w: any) => ({
              id: w.code || w.id,
              tenantId: w.ownerId || 't1',
              organizationId: w.organizationId || 'o1',
              name: w.name || 'Dépôt',
              code: w.code || 'WH-UNK',
              type: w.agencyType === 'RETAIL' ? ('RETAIL' as const) : ('WAREHOUSE' as const),
            }));
            set({ warehouses: backendWarehouses });
          }
        } catch (err) {
          console.error('Error fetching warehouses:', err);
        }
      },

      fetchMovements: async (organizationId = 'o1', agencyId, productId) => {
        try {
          const query = new URLSearchParams({ organizationId });
          if (agencyId) query.append('agencyId', agencyId);
          if (productId) query.append('productId', productId);

          const res = await fetch(`/api/inventory/movements?${query.toString()}`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const backendMovements = res.data.map((m: any) => ({
              id: m.id,
              tenantId: m.tenantId || 't1',
              organizationId: m.organizationId || organizationId,
              variantId: m.productId ? `v-${m.productId}` : 'v1_1',
              warehouseId: m.agencyId || 'wh1_1',
              referenceNumber: m.referenceNumber || 'MVT-UNK',
              type: m.movementType === 'INBOUND' ? ('INBOUND' as const) : m.movementType === 'OUTBOUND' ? ('OUTBOUND' as const) : ('ADJUSTMENT' as const),
              sourceDoc: m.sourceDocumentNumber || undefined,
              status: m.status === 'VALIDATED' ? ('VALIDATED' as const) : ('DRAFT' as const),
              quantity: m.quantity || 0,
              createdAt: m.createdAt || new Date().toISOString(),
            }));
            set({ movements: backendMovements });
          }
        } catch (err) {
          console.error('Error fetching movements:', err);
        }
      },

      fetchTransfers: async (organizationId = 'o1') => {
        try {
          const res = await fetch(`/api/inventory/transfers?organizationId=${organizationId}`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const backendTransfers = res.data.map((t: any) => ({
              id: t.id,
              tenantId: t.tenantId || 't1',
              organizationId: t.organizationId || organizationId,
              referenceNumber: t.referenceNumber || 'TRSF-UNK',
              sourceWarehouseId: t.sourceAgencyId || 'wh1_1',
              targetWarehouseId: t.targetAgencyId || 'wh1_2',
              variantId: t.productId ? `v-${t.productId}` : 'v1_1',
              quantity: t.quantity || 0,
              status: t.status === 'COMPLETED' ? ('COMPLETED' as const) : ('REQUESTED' as const),
              createdAt: t.createdAt || new Date().toISOString(),
            }));
            set({ transfers: backendTransfers });
          }
        } catch (err) {
          console.error('Error fetching transfers:', err);
        }
      },

      fetchTransformations: async (organizationId = 'o1') => {
        try {
          const res = await fetch(`/api/inventory/transformations?organizationId=${organizationId}`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const backendTransformations = res.data.map((t: any) => ({
              id: t.id,
              tenantId: t.tenantId || 't1',
              organizationId: t.organizationId || organizationId,
              referenceNumber: t.referenceNumber || 'TRNF-UNK',
              sourceVariantId: t.sourceProductId ? `v-${t.sourceProductId}` : 'v1_1',
              targetVariantId: t.targetProductId ? `v-${t.targetProductId}` : 'v2_1',
              sourceQuantity: t.sourceQuantity || 0,
              targetQuantity: t.targetQuantity || 0,
              status: t.status === 'VALIDATED' ? ('VALIDATED' as const) : ('DRAFT' as const),
              createdAt: t.createdAt || new Date().toISOString(),
            }));
            set({ transformations: backendTransformations });
          }
        } catch (err) {
          console.error('Error fetching transformations:', err);
        }
      },

      fetchInventorySessions: async (organizationId = 'o1') => {
        try {
          const res = await fetch(`/api/inventory/sessions?organizationId=${organizationId}`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const backendSessions = res.data.map((s: any) => ({
              id: s.id,
              tenantId: s.tenantId || 't1',
              organizationId: s.organizationId || organizationId,
              referenceNumber: s.referenceNumber || 'SESS-UNK',
              warehouseId: s.agencyId || 'wh1_1',
              status: s.status === 'VALIDATED' ? ('VALIDATED' as const) : ('DRAFT' as const),
              createdAt: s.createdAt || new Date().toISOString(),
            }));
            set({ inventorySessions: backendSessions });
          }
        } catch (err) {
          console.error('Error fetching inventory sessions:', err);
        }
      },

      getVariantStock: (variantId, warehouseId) => {
        let total = 0;

        // 1. Sum up movements (only VALIDATED)
        const filteredMovements = get().movements.filter(m => 
          m.variantId === variantId && 
          m.status === 'VALIDATED' &&
          (!warehouseId || m.warehouseId === warehouseId)
        );
        for (const m of filteredMovements) {
          if (m.type === 'INBOUND') {
            total += m.quantity;
          } else if (m.type === 'OUTBOUND') {
            total -= m.quantity;
          } else if (m.type === 'ADJUSTMENT') {
            total += m.quantity;
          }
        }

        // 2. Add transformations (only VALIDATED)
        const validatedTransformations = get().transformations.filter(tf => tf.status === 'VALIDATED');
        for (const tf of validatedTransformations) {
          if (tf.sourceVariantId === variantId) {
            total -= tf.sourceQuantity;
          }
          if (tf.targetVariantId === variantId) {
            total += tf.targetQuantity;
          }
        }

        // 3. Add completed transfers (only COMPLETED)
        const completedTransfers = get().transfers.filter(t => t.status === 'COMPLETED' && t.variantId === variantId);
        for (const t of completedTransfers) {
          if (warehouseId) {
            if (t.sourceWarehouseId === warehouseId) {
              total -= t.quantity;
            }
            if (t.targetWarehouseId === warehouseId) {
              total += t.quantity;
            }
          }
        }

        return Math.max(0, total);
      },

      getWarehouseStockList: (warehouseId) => {
        const distinctVariants = Array.from(
          new Set([
            ...get().movements.map(m => m.variantId),
            ...get().transfers.map(t => t.variantId),
            ...get().transformations.map(tf => tf.sourceVariantId),
            ...get().transformations.map(tf => tf.targetVariantId)
          ])
        );

        return distinctVariants.map(vId => ({
          variantId: vId,
          stock: get().getVariantStock(vId, warehouseId)
        })).filter(item => item.stock > 0);
      },

      isReferenceNumberUnique: (referenceNumber) => {
        const refs = [
          ...get().movements.map(m => m.referenceNumber),
          ...get().transfers.map(t => t.referenceNumber),
          ...get().transformations.map(tf => tf.referenceNumber),
          ...get().inventorySessions.map(s => s.referenceNumber)
        ];
        return !refs.includes(referenceNumber);
      },

      addWarehouse: async (warehouse) => {
        try {
          const res = await fetch('/api/warehouses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: warehouse.code,
              name: warehouse.name,
              ownerId: warehouse.tenantId,
              organizationId: warehouse.organizationId || 'o1',
              agencyType: warehouse.type,
            }),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchWarehouses();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error adding warehouse:', err);
          return false;
        }
      },
      
      createMovement: async (movement) => {
        try {
          // Extract product ID from variantId (v-p1 -> p1)
          const productId = movement.variantId.replace('v-', '');

          // Optimistic update so UI reflects stock changes immediately
          const tempMovement: StockMovement = {
            id: `temp-${Date.now()}-${Math.random()}`,
            tenantId: movement.tenantId || 't1',
            organizationId: movement.organizationId || 'o1',
            variantId: movement.variantId,
            warehouseId: movement.warehouseId,
            referenceNumber: movement.referenceNumber || `MVT-TMP-${Date.now()}`,
            type: movement.type,
            sourceDoc: movement.sourceDoc,
            status: movement.status || 'DRAFT',
            quantity: movement.quantity,
            createdAt: new Date().toISOString()
          };
          set((state) => ({ movements: [...state.movements, tempMovement] }));

          const res = await fetch('/api/inventory/movements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: movement.organizationId || 'o1',
              agencyId: movement.warehouseId,
              productId,
              referenceNumber: movement.referenceNumber,
              movementType: movement.type,
              quantity: movement.quantity,
              status: movement.status || 'DRAFT',
            }),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchMovements(movement.organizationId);
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error creating movement:', err);
          return false;
        }
      },

      validateMovement: async (id) => {
        try {
          const res = await fetch(`/api/inventory/movements/${id}/validate`, {
            method: 'POST',
          }).then(r => r.json());

          if (res.success) {
            await get().fetchMovements();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error validating movement:', err);
          return false;
        }
      },

      deleteMovement: async (id) => {
        set((state) => ({
          movements: state.movements.filter(m => m.id !== id || m.status === 'DRAFT')
        }));
        return true;
      },
      
      createTransfer: async (transfer) => {
        try {
          const productId = transfer.variantId.replace('v-', '');

          const res = await fetch('/api/inventory/transfers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: transfer.organizationId || 'o1',
              sourceAgencyId: transfer.sourceWarehouseId,
              targetAgencyId: transfer.targetWarehouseId,
              productId,
              quantity: transfer.quantity,
            }),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchTransfers(transfer.organizationId);
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error creating transfer:', err);
          return false;
        }
      },

      completeTransfer: async (id) => {
        try {
          const res = await fetch(`/api/inventory/transfers/${id}/complete`, {
            method: 'POST',
          }).then(r => r.json());

          if (res.success) {
            await get().fetchTransfers();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error completing transfer:', err);
          return false;
        }
      },

      deleteTransfer: async (id) => {
        set((state) => ({
          transfers: state.transfers.filter(t => t.id !== id || t.status === 'REQUESTED')
        }));
        return true;
      },
      
      createTransformation: async (transformation) => {
        try {
          const sourceProductId = transformation.sourceVariantId.replace('v-', '');
          const targetProductId = transformation.targetVariantId.replace('v-', '');

          const res = await fetch('/api/inventory/transformations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: transformation.organizationId || 'o1',
              sourceProductId,
              targetProductId,
              sourceQuantity: transformation.sourceQuantity,
              targetQuantity: transformation.targetQuantity,
            }),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchTransformations(transformation.organizationId);
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error creating transformation:', err);
          return false;
        }
      },

      validateTransformation: async (id) => {
        try {
          const res = await fetch(`/api/inventory/transformations/${id}/validate`, {
            method: 'POST',
          }).then(r => r.json());

          if (res.success) {
            await get().fetchTransformations();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error validating transformation:', err);
          return false;
        }
      },

      deleteTransformation: async (id) => {
        set((state) => ({
          transformations: state.transformations.filter(tf => tf.id !== id || tf.status === 'DRAFT')
        }));
        return true;
      },
      
      createInventorySession: async (session, items) => {
        try {
          const res = await fetch('/api/inventory/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: session.organizationId || 'o1',
              agencyId: session.warehouseId,
              items: items.map(item => ({
                productId: item.variantId.replace('v-', ''),
                countedQuantity: item.quantityCounted,
              })),
            }),
          }).then(r => r.json());

          if (res.success) {
            await get().fetchInventorySessions(session.organizationId);
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error creating inventory session:', err);
          return false;
        }
      },

      validateInventorySession: async (id) => {
        try {
          const res = await fetch(`/api/inventory/sessions/${id}/validate`, {
            method: 'POST',
          }).then(r => r.json());

          if (res.success) {
            await get().fetchInventorySessions();
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error validating inventory session:', err);
          return false;
        }
      },

      deleteInventorySession: async (id) => {
        set((state) => ({
          inventorySessions: state.inventorySessions.filter(s => s.id !== id || s.status === 'DRAFT'),
          inventorySessionItems: state.inventorySessionItems.filter(item => item.sessionId !== id)
        }));
        return true;
      },

      dispatchSalesOrder: async (tenantId, orderId, items) => {
        // Find tenant's retail warehouse or fallback to first warehouse
        const tenantWarehouses = get().warehouses.filter(w => w.tenantId === tenantId);
        const retailWh = tenantWarehouses.find(w => w.type === 'RETAIL') || tenantWarehouses[0];
        
        if (!retailWh) return false;

        // Check availability for all items
        for (const item of items) {
          const currentStock = get().getVariantStock(item.variantId, retailWh.id);
          if (currentStock < item.quantity) {
            return false;
          }
        }

        // Record OUTBOUND movements for each item
        for (const item of items) {
          await get().createMovement({
            tenantId,
            organizationId: retailWh.organizationId,
            variantId: item.variantId,
            warehouseId: retailWh.id,
            type: 'OUTBOUND',
            sourceDoc: orderId,
            status: 'VALIDATED',
            quantity: item.quantity
          });
        }

        return true;
      }
    }),
    {
      name: 'ksm-inventory-storage',
    }
  )
);
