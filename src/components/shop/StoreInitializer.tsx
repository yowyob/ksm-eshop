'use client';

import { useEffect } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useOrderStore } from '@/store/useOrderStore';

interface StoreInitializerProps {
  tenantId: string;
}

export default function StoreInitializer({ tenantId }: StoreInitializerProps) {
  const { fetchProducts, fetchCategories } = useProductStore();
  const { fetchWarehouses, fetchTransfers, fetchTransformations, fetchInventorySessions, fetchBalances } =
    useInventoryStore();
  const { fetchOrders } = useOrderStore();

  useEffect(() => {
    // Utiliser le tenantId comme orgId (ex: 'demo-org')
    const orgId = tenantId || 'o1';

    fetchProducts(orgId);
    fetchCategories();
    fetchTransfers(orgId);
    fetchTransformations(orgId);
    fetchInventorySessions(orgId);
    fetchOrders(orgId);

    // Les soldes se demandent dépôt par dépôt, ce qui suppose de connaître les dépôts : d'où
    // l'enchaînement plutôt que des appels en parallèle.
    //
    // Les mouvements, eux, ne sont plus chargés ici. Le grand-livre se lit produit par produit, et
    // le stock affiché ne vient plus de leur repliement mais du solde que le noyau tient — ce qui
    // était le but : une seule réponse à la question « combien en reste-t-il ? ».
    (async () => {
      await fetchWarehouses();
      const warehouses = useInventoryStore.getState().warehouses;
      await Promise.all(warehouses.map(w => fetchBalances(orgId, w.id)));
    })();
  }, [
    tenantId,
    fetchProducts,
    fetchCategories,
    fetchWarehouses,
    fetchTransfers,
    fetchTransformations,
    fetchInventorySessions,
    fetchBalances,
    fetchOrders,
  ]);

  return null;
}
