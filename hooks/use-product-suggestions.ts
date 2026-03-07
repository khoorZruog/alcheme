"use client";

import { useMemo } from "react";
import { useInventory } from "@/hooks/use-inventory";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { normalizeBrand } from "@/lib/normalize-brand";

export interface ProductSuggestion {
  label: string;
  brand?: string;
  source: "inventory" | "catalog";
}

/**
 * Merge local inventory product names + catalog product names.
 * Optionally filters by brand for more relevant results.
 */
export function useProductSuggestions(
  query: string,
  brand?: string,
): {
  suggestions: ProductSuggestion[];
  isLoading: boolean;
} {
  const { items } = useInventory();
  const { results: catalogResults, isLoading } = useCatalogSearch(query);

  const suggestions = useMemo(() => {
    const q = normalizeBrand(query);
    if (!q) return [];

    const normalizedBrand = brand ? normalizeBrand(brand) : "";
    const seen = new Set<string>();
    const out: ProductSuggestion[] = [];

    // 1. Local inventory product names
    for (const item of items) {
      if (normalizedBrand && normalizeBrand(item.brand) !== normalizedBrand) continue;
      if (!normalizeBrand(item.product_name).includes(q)) continue;

      const key = `${normalizeBrand(item.brand)}::${normalizeBrand(item.product_name)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ label: item.product_name, brand: item.brand, source: "inventory" });
      }
    }

    // 2. Catalog product names
    for (const entry of catalogResults) {
      if (normalizedBrand && normalizeBrand(entry.brand) !== normalizedBrand) continue;

      const key = `${normalizeBrand(entry.brand)}::${normalizeBrand(entry.product_name)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ label: entry.product_name, brand: entry.brand, source: "catalog" });
      }
    }

    return out.slice(0, 8);
  }, [query, brand, items, catalogResults]);

  return { suggestions, isLoading };
}
