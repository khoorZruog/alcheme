"use client";

import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/api/fetcher";
import type { CatalogEntry } from "@/types/catalog";
import type { CosmeCategory } from "@/types/inventory";

export type CatalogSortKey = "have_count" | "use_count" | "want_count";

interface BrowsePage {
  results: CatalogEntry[];
  top_brands?: string[];
  next_cursor: string | null;
  count: number;
}

export function useCatalogBrowse(
  category: CosmeCategory | null,
  brand: string | null,
  sort: CatalogSortKey = "have_count",
) {
  const getKey = (pageIndex: number, previousPageData: BrowsePage | null) => {
    if (!category) return null;
    if (pageIndex > 0 && !previousPageData?.next_cursor) return null;

    const params = new URLSearchParams({
      category,
      sort,
      limit: "20",
    });
    if (brand) params.set("brand", brand);
    if (pageIndex > 0 && previousPageData?.next_cursor) {
      params.set("cursor", previousPageData.next_cursor);
    }
    return `/api/catalog/browse?${params.toString()}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<BrowsePage>(getKey, fetcher, {
      revalidateFirstPage: false,
    });

  const results = data ? data.flatMap((page) => page.results) : [];
  const topBrands = data?.[0]?.top_brands ?? [];
  const hasMore = data ? data[data.length - 1]?.next_cursor !== null : false;
  const isEmpty = data?.[0]?.results.length === 0;

  return {
    results,
    topBrands,
    isLoading,
    isLoadingMore: isValidating && size > 1,
    error,
    hasMore,
    isEmpty,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}
