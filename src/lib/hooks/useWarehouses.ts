import useSWR from 'swr';
import { Warehouse } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWarehouses() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/warehouses',
    fetcher
  );

  const warehouses: Warehouse[] = data?.success && Array.isArray(data.data) ? data.data : [];

  return {
    warehouses,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}
