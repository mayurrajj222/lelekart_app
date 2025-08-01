import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Product } from "@shared/schema";

interface ProductData {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

interface UseInfiniteProductsOptions {
  category?: string;
  search?: string;
  sellerId?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useInfiniteProducts({
  category,
  search,
  sellerId,
  pageSize = 24,
  enabled = true,
}: UseInfiniteProductsOptions = {}) {
  const queryClient = useQueryClient();

  // Fetch products with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["infinite-products", { category, search, sellerId, pageSize }],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: pageSize.toString(),
        approved: "true",
        status: "approved",
        homepage: "true",
      });

      if (category) params.append("category", category);
      if (search) params.append("search", search);
      if (sellerId) params.append("sellerId", sellerId.toString());

      // Add interleaved param for homepage infinite scroll (no filters)
      if (!category && !search && !sellerId) {
        params.append("interleaved", "true");
      }

      // Add cache buster for better caching
      const cacheBuster = Math.floor(Date.now() / (5 * 60 * 1000)); // 5 minute cache
      params.append("_cb", cacheBuster.toString());

      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: {
          "Cache-Control": "max-age=300", // 5 minutes cache
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = (await response.json()) as ProductData;

      // Prefetch next page if available
      if (data.pagination.currentPage < data.pagination.totalPages) {
        const nextPage = data.pagination.currentPage + 1;
        const nextParams = new URLSearchParams(params);
        nextParams.set("page", nextPage.toString());

        // Prefetch next page in background
        queryClient.prefetchInfiniteQuery({
          queryKey: [
            "infinite-products",
            { category, search, sellerId, pageSize },
          ],
          queryFn: async () => {
            const nextResponse = await fetch(
              `/api/products?${nextParams.toString()}`,
              {
                headers: {
                  "Cache-Control": "max-age=300",
                },
              }
            );
            if (!nextResponse.ok) throw new Error("Failed to prefetch");
            return nextResponse.json();
          },
          getNextPageParam: (lastPage: ProductData) => {
            const { currentPage, totalPages } = lastPage.pagination;
            return currentPage < totalPages ? currentPage + 1 : undefined;
          },
          initialPageParam: 1,
        });
      }

      return data;
    },
    getNextPageParam: (lastPage: ProductData) => {
      const { currentPage, totalPages } = lastPage.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: 10 * 60 * 1000, // Increased from 5 to 10 minutes
    gcTime: 30 * 60 * 1000, // Increased cache time to 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 2, // Reduce retries for faster failure
    retryDelay: 1000, // Faster retry delay
  });

  // Combine all pages into a single products array
  const products = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.products);
  }, [data?.pages]);

  // Load more products with optimized logic
  const loadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, isFetchingNextPage, hasNextPage]);

  // Get pagination info
  const pagination = useMemo(() => {
    if (!data?.pages?.length) {
      return { currentPage: 1, totalPages: 1, total: 0 };
    }

    const lastPage = data.pages[data.pages.length - 1];
    return lastPage.pagination;
  }, [data?.pages]);

  return {
    products,
    pagination,
    hasMore: hasNextPage ?? false,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    loadMore,
    refetch,
  };
}

// Hook for category-specific product loading with optimizations
export function useCategoryProducts(category: string, limit: number = 12) {
  return useQuery({
    queryKey: ["category-products", category, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        category,
        page: "1",
        limit: limit.toString(),
        approved: "true",
        status: "approved",
      });

      // Add cache buster
      const cacheBuster = Math.floor(Date.now() / (10 * 60 * 1000)); // 10 minute cache
      params.append("_cb", cacheBuster.toString());

      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: {
          "Cache-Control": "max-age=600", // 10 minutes cache
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} products`);
      }

      return response.json() as Promise<ProductData>;
    },
    enabled: !!category,
    staleTime: 15 * 60 * 1000, // Increased to 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: 1000,
  });
}
