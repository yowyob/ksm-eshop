import useSWR from 'swr';
import { Product, Category } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProducts(organizationId = 'o1') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products?organizationId=${organizationId}`,
    fetcher
  );

  const products: Product[] = data?.success && Array.isArray(data.data) ? data.data : [];

  return {
    products,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/categories',
    fetcher
  );

  const categories: Category[] = data?.success && Array.isArray(data.data) ? data.data : [];

  return {
    categories,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}

export function useProductDetails(productId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/products/${productId}` : null,
    fetcher
  );

  const product: Product | null = data?.success ? data.data : null;

  return {
    product,
    isLoading,
    isError: error || (data && !data.success),
    errorMessage: data && !data.success ? data.message : undefined,
    mutate,
  };
}
