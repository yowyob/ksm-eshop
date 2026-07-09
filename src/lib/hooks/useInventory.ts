import useSWR from 'swr';
import { StockMovement, WarehouseTransfer, ProductTransformation, InventorySession } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useStockMovements(organizationId = 'o1', agencyId?: string, productId?: string) {
  const queryParams = new URLSearchParams();
  queryParams.append('organizationId', organizationId);
  if (agencyId) queryParams.append('agencyId', agencyId);
  if (productId) queryParams.append('productId', productId);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/inventory/movements?${queryParams.toString()}`,
    fetcher
  );

  const movements: StockMovement[] = data?.success && Array.isArray(data.data) ? data.data : [];

  return {
    movements,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}

export function useStockBalance(productId: string, agencyId?: string, organizationId = 'o1') {
  const queryParams = new URLSearchParams();
  queryParams.append('organizationId', organizationId);
  if (agencyId) queryParams.append('agencyId', agencyId);
  queryParams.append('productId', productId);

  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/inventory/movements/balance?${queryParams.toString()}` : null,
    fetcher
  );

  const balance = data?.success ? data.data?.onHandQuantity || 0 : 0;

  return {
    balance,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}

export function useTransfers(organizationId = 'o1') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/inventory/transfers?organizationId=${organizationId}`,
    fetcher
  );

  const transfers: WarehouseTransfer[] = data?.success && Array.isArray(data.data) ? data.data : [];

  return {
    transfers,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}

export function useTransformations(organizationId = 'o1') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/inventory/transformations?organizationId=${organizationId}`,
    fetcher
  );

  const transformations: ProductTransformation[] = data?.success && Array.isArray(data.data) ? data.data : [];

  return {
    transformations,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}

export function useInventorySessions(organizationId = 'o1') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/inventory/sessions?organizationId=${organizationId}`,
    fetcher
  );

  const sessions: InventorySession[] = data?.success && Array.isArray(data.data) ? data.data : [];

  return {
    sessions,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}
