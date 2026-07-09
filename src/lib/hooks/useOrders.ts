import useSWR from 'swr';
import { Order } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useOrders(organizationId = 'o1') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/orders?organizationId=${organizationId}`,
    fetcher
  );

  const orders: Order[] = data?.success && Array.isArray(data.data) ? data.data : [];

  return {
    orders,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}

export function useOrderDetails(orderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? `/api/orders/${orderId}` : null,
    fetcher
  );

  const order: Order | null = data?.success ? data.data : null;

  return {
    order,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}
