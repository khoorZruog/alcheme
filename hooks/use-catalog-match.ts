"use client";

import useSWR from "swr";
import type { CatalogEntry } from "@/types/catalog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Auto-match a product against the global catalog.
 * Returns the best match when brand + product_name are provided.
 */
export function useCatalogMatch(
  brand?: string,
  productName?: string,
  _colorCode?: string,
) {
  // Build a combined query for catalog search
  const query = [brand, productName].filter(Boolean).join(" ").trim().toLowerCase();
  const shouldFetch = query.length >= 2;

  const { data, isLoading } = useSWR(
    shouldFetch ? `/api/catalog/search?q=${encodeURIComponent(query)}&limit=5` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3000 },
  );

  // Find best match from results
  const results = (data?.results ?? []) as CatalogEntry[];
  const match = results.find((r) => {
    const brandMatch = brand && r.brand?.toLowerCase() === brand.toLowerCase();
    const nameMatch = productName && r.product_name?.toLowerCase() === productName.toLowerCase();
    return brandMatch && nameMatch;
  }) ?? results[0] ?? null;

  return {
    match,
    alternatives: results.filter((r) => r !== match),
    isChecking: shouldFetch && isLoading,
  };
}
