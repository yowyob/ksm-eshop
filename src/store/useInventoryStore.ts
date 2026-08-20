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
import {
  toLedgerMovementType,
  toShopMovementType,
  toProductId,
  toVariantId,
  balanceKey,
} from '../lib/stock-mapping';

interface InventoryState {
  warehouses: Warehouse[];
  movements: StockMovement[];
  transfers: WarehouseTransfer[];
  transformations: ProductTransformation[];
  inventorySessions: InventorySession[];
  inventorySessionItems: InventorySessionItem[];
  isLoading: boolean;

  /**
   * Les soldes tels que le noyau les tient, par `dépôt:déclinaison`.
   *
   * La boutique repliait elle-même l'historique pour obtenir un stock. Deux calculs pour une même
   * question finissent toujours par diverger, et c'est le noyau qui tranche : il connaît les
   * réservations, les transferts en route et les mouvements que la boutique n'a pas chargés.
   * L'écart comptait surtout pendant un inventaire, où l'on comparait le comptage au calcul de la
   * boutique et non à ce que le système croyait détenir.
   */
  balances: Record<string, number>;
  balancesLoaded: boolean;

  // Fetch Actions
  fetchWarehouses: () => Promise<void>;
  fetchMovements: (organizationId?: string, agencyId?: string, productId?: string) => Promise<void>;
  fetchTransfers: (organizationId?: string) => Promise<void>;
  fetchTransformations: (organizationId?: string) => Promise<void>;
  fetchInventorySessions: (organizationId?: string) => Promise<void>;
  fetchBalances: (organizationId?: string, agencyId?: string) => Promise<void>;

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
      balances: {},
      balancesLoaded: false,

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
        // Le grand-livre se lit produit par produit dans un depot : sans ces deux reperes il n'y a
        // pas d'historique a demander, et on garde ce que la boutique a deja.
        if (!agencyId || !productId) return;

        try {
          const query = new URLSearchParams({
            organizationId,
            agencyId,
            productId: toProductId(productId),
          });

          const res = await fetch(`/api/stock/movements?${query.toString()}`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            const ledgerMovements = res.data.map((m: any) => ({
              id: m.id,
              tenantId: m.tenantId || 't1',
              organizationId: m.organizationId || organizationId,
              variantId: toVariantId(m.productId),
              warehouseId: m.agencyId || agencyId,
              referenceNumber: m.referenceNumber || 'MVT-UNK',
              type: toShopMovementType(m.movementType),
              sourceDoc: m.referenceNumber || undefined,
              // Le grand-livre est en ecriture seule : ce qui y figure a deja bouge le stock.
              // Il n'y a donc pas de brouillon a lire, seulement des mouvements effectifs.
              status: 'VALIDATED' as const,
              quantity: Number(m.quantity) || 0,
              createdAt: m.occurredAt || new Date().toISOString(),
            }));

            set((state) => {
              // Les brouillons n'existent que dans la boutique : les ecraser avec la reponse du
              // noyau ferait disparaitre une saisie en cours sous les doigts de l'utilisateur.
              const localDrafts = state.movements.filter(m => m.status === 'DRAFT');
              const untouched = state.movements.filter(
                m => m.status !== 'DRAFT' && !(m.warehouseId === agencyId && m.variantId === toVariantId(productId))
              );
              return { movements: [...untouched, ...ledgerMovements, ...localDrafts] };
            });
          }
        } catch (err) {
          console.error('Error fetching movements:', err);
        }
      },

      fetchBalances: async (organizationId = 'o1', agencyId) => {
        if (!agencyId) return;
        try {
          const query = new URLSearchParams({ organizationId, agencyId });
          const res = await fetch(`/api/stock/balances?${query.toString()}`).then(r => r.json());
          if (res.success && Array.isArray(res.data)) {
            set((state) => {
              const balances = { ...state.balances };
              for (const b of res.data) {
                balances[balanceKey(agencyId, toVariantId(b.productId))] =
                  Number(b.onHandQuantity) || 0;
              }
              return { balances, balancesLoaded: true };
            });
          }
        } catch (err) {
          // On ne retient rien : un solde absent fait retomber la boutique sur son propre calcul,
          // ce qui vaut mieux qu'un chiffre perime affiche comme s'il faisait foi.
          console.error('Error fetching balances:', err);
        }
      },

      fetchTransfers: async (organizationId = 'o1') => {
        try {
          const res = await fetch(`/api/stock/transfers?organizationId=${organizationId}`).then(r => r.json());
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
          const res = await fetch(`/api/stock/transformations?organizationId=${organizationId}`).then(r => r.json());
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
        // Le solde du noyau fait foi des qu'il est connu.
        //
        // La boutique repliait l'historique pour obtenir un stock. Ce calcul ne peut pas etre juste
        // : il ignore les mouvements qu'elle n'a pas charges, les reservations, et la marchandise
        // en transit. Deux calculs pour une meme question divergent toujours, et l'ecart se payait
        // surtout pendant un inventaire, ou l'on comparait le comptage a l'arithmetique de la
        // boutique au lieu de ce que le systeme croyait detenir.
        if (warehouseId) {
          const authoritative = get().balances[balanceKey(warehouseId, variantId)];
          if (authoritative !== undefined) {
            return Math.max(0, authoritative);
          }
        }

        // Repli, tant que le noyau n'a pas repondu : le mode demonstration ne tient aucun solde, et
        // un ecran vide serait moins utile qu'une estimation clairement locale.
        let total = 0;

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

        const validatedTransformations = get().transformations.filter(tf => tf.status === 'VALIDATED');
        for (const tf of validatedTransformations) {
          if (tf.sourceVariantId === variantId) {
            total -= tf.sourceQuantity;
          }
          if (tf.targetVariantId === variantId) {
            total += tf.targetQuantity;
          }
        }

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
            // Les produits dont le noyau tient un solde dans ce depot : ce sont eux qui font foi, et
            // certains n'apparaissent dans aucun mouvement charge par la boutique.
            ...Object.keys(get().balances)
              .filter(key => key.startsWith(`${warehouseId}:`))
              .map(key => key.slice(warehouseId.length + 1)),
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
        // Un brouillon reste dans la boutique. Le grand-livre est en ecriture seule : y inscrire
        // un mouvement, c'est bouger le stock. L'ecrire des la saisie afficherait « brouillon » a
        // l'ecran alors que le stock aurait deja change — l'inverse de ce que le mot promet.
        const tempMovement: StockMovement = {
          id: `mvt-draft-${Date.now()}`,
          tenantId: movement.tenantId || 't1',
          organizationId: movement.organizationId || 'o1',
          variantId: movement.variantId,
          warehouseId: movement.warehouseId,
          referenceNumber: movement.referenceNumber || `MVT-TMP-${Date.now()}`,
          type: movement.type,
          sourceDoc: movement.sourceDoc,
          status: 'DRAFT',
          quantity: movement.quantity,
          createdAt: new Date().toISOString()
        };
        set((state) => ({ movements: [...state.movements, tempMovement] }));

        // L'ecran propose « immediat » : il faut alors ecrire au grand-livre tout de suite, sans
        // quoi le mouvement resterait un brouillon affiche comme valide — exactement le mensonge
        // que la separation brouillon/validation sert a eviter.
        if ((movement.status || 'DRAFT') === 'VALIDATED') {
          return get().validateMovement(tempMovement.id);
        }
        return true;
      },

      validateMovement: async (id) => {
        // C'est ici que le mouvement entre au grand-livre, et nulle part ailleurs.
        const draft = get().movements.find(m => m.id === id);
        if (!draft) return false;
        if (draft.status === 'VALIDATED') return true;

        try {
          const res = await fetch('/api/stock/movements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: draft.organizationId || 'o1',
              agencyId: draft.warehouseId,
              productId: toProductId(draft.variantId),
              movementType: draft.type,
              quantity: draft.quantity,
              referenceNumber: draft.referenceNumber,
            }),
          }).then(r => r.json());

          if (!res.success) {
            console.error('Movement rejected by the ledger:', res);
            return false;
          }

          // Le brouillon disparait au profit du mouvement tel que le noyau l'a enregistre : c'est
          // lui qui porte l'identifiant et l'horodatage qui feront foi.
          set((state) => ({
            movements: state.movements.map(m =>
              m.id === id
                ? {
                    ...m,
                    id: res.data?.id || m.id,
                    status: 'VALIDATED' as const,
                    referenceNumber: res.data?.referenceNumber || m.referenceNumber,
                    createdAt: res.data?.occurredAt || m.createdAt,
                  }
                : m
            ),
          }));

          await get().fetchBalances(draft.organizationId, draft.warehouseId);
          return true;
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

          const res = await fetch('/api/stock/transfers', {
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
          const res = await fetch(`/api/stock/transfers/${id}/complete`, {
            method: 'POST',
          }).then(r => r.json());

          if (res.success) {
            await get().fetchTransfers();
            // Le transfert a deplace du stock entre deux depots : les deux soldes ont change.
            const transfer = get().transfers.find(t => t.id === id);
            if (transfer) {
              await Promise.all([
                get().fetchBalances(transfer.organizationId, transfer.sourceWarehouseId),
                get().fetchBalances(transfer.organizationId, transfer.targetWarehouseId),
              ]);
            }
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
        // Brouillon local, pour la meme raison que les mouvements : une transformation enregistree
        // a deja consomme la matiere et produit le resultat.
        const tempTransformation: ProductTransformation = {
          id: `trnf-draft-${Date.now()}`,
          tenantId: transformation.tenantId || 't1',
          organizationId: transformation.organizationId || 'o1',
          referenceNumber: `TRNF-TMP-${Date.now()}`,
          sourceVariantId: transformation.sourceVariantId,
          targetVariantId: transformation.targetVariantId,
          sourceQuantity: transformation.sourceQuantity,
          targetQuantity: transformation.targetQuantity,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ transformations: [...state.transformations, tempTransformation] }));
        return true;
      },

      validateTransformation: async (id) => {
        const draft = get().transformations.find(tf => tf.id === id);
        if (!draft) return false;
        if (draft.status === 'VALIDATED') return true;

        try {
          const res = await fetch('/api/stock/transformations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: draft.organizationId || 'o1',
              agencyId: (draft as any).warehouseId,
              sourceProductId: toProductId(draft.sourceVariantId),
              targetProductId: toProductId(draft.targetVariantId),
              sourceQuantity: draft.sourceQuantity,
              targetQuantity: draft.targetQuantity,
            }),
          }).then(r => r.json());

          if (!res.success) {
            console.error('Transformation rejected by the ledger:', res);
            return false;
          }

          set((state) => ({
            transformations: state.transformations.map(tf =>
              tf.id === id
                ? { ...tf, id: res.data?.id || tf.id, status: 'VALIDATED' as const,
                    referenceNumber: res.data?.referenceNumber || tf.referenceNumber }
                : tf
            ),
          }));

          await get().fetchBalances(draft.organizationId, (draft as any).warehouseId);
          return true;
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
            // Un inventaire valide ajuste le stock : c'est precisement ce pour quoi on le fait, et
            // l'ecran doit montrer le solde corrige plutot que celui d'avant comptage.
            const session = get().inventorySessions.find(sess => sess.id === id);
            if (session) {
              await get().fetchBalances(session.organizationId, session.warehouseId);
            }
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
      // Les soldes ne sont delibérément pas conserves d'une visite a l'autre. Un stock evolue a
      // chaque vente, y compris depuis une autre caisse : le relire au demarrage est peu couteux,
      // alors qu'un chiffre perime presente comme faisant foi ferait vendre ce qui n'existe plus.
      partialize: (state) => {
        const { balances, balancesLoaded, ...rest } = state;
        return rest as InventoryState;
      },
    }
  )
);
