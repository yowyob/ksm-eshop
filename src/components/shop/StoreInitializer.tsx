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
  const { fetchWarehouses, fetchMovements, fetchTransfers, fetchTransformations, fetchInventorySessions } = useInventoryStore();
  const { fetchOrders } = useOrderStore();

  useEffect(() => {
    // Utiliser le tenantId comme orgId (ex: 'demo-org')
    const orgId = tenantId || 'o1';

    // Hydrate all stores with backend data
    fetchProducts(orgId);
    fetchCategories();
    fetchWarehouses();
    fetchMovements(orgId);
    fetchTransfers(orgId);
    fetchTransformations(orgId);
    fetchInventorySessions(orgId);
    fetchOrders(orgId);
  }, [tenantId, fetchProducts, fetchCategories, fetchWarehouses, fetchMovements, fetchTransfers, fetchTransformations, fetchInventorySessions, fetchOrders]);

  return null;
}
