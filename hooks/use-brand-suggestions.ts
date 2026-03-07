"use client";

import { useMemo } from "react";
import { useInventory } from "@/hooks/use-inventory";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { normalizeBrand } from "@/lib/normalize-brand";

export interface BrandSuggestion {
  label: string;
  source: "inventory" | "catalog";
}

/**
 * Merge local inventory brands + global catalog brands into autocomplete suggestions.
 * Local brands appear first (higher relevance), catalog brands follow.
 */
export function useBrandSuggestions(query: string): {
  suggestions: BrandSuggestion[];
  isLoading: boolean;
} {
  const { brands: localBrands } = useInventory();
  const { results: catalogResults, isLoading } = useCatalogSearch(query);

  const suggestions = useMemo(() => {
    const q = normalizeBrand(query);
    if (!q) return [];

    const seen = new Set<string>();
    const out: BrandSuggestion[] = [];

    // 1. Local inventory brands (instant, substring match)
    for (const brand of localBrands) {
      if (normalizeBrand(brand).includes(q)) {
        const key = normalizeBrand(brand);
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ label: brand, source: "inventory" });
        }
      }
    }

    // 2. Catalog brands (debounced, prefix match from API)
    for (const entry of catalogResults) {
      const key = normalizeBrand(entry.brand);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ label: entry.brand, source: "catalog" });
      }
    }

    return out.slice(0, 8);
  }, [query, localBrands, catalogResults]);

  return { suggestions, isLoading };
}
