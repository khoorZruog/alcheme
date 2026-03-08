"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import { rankByColorMatch, type ColorMatchResult } from "@/lib/color-match";
import type { CatalogEntry } from "@/types/catalog";
import type { CosmeCategory } from "@/types/inventory";

interface ColorSearchResponse {
  results: CatalogEntry[];
  count: number;
}

export function useColorSearch(
  targetHex: string | null,
  category: CosmeCategory | null,
) {
  const params = new URLSearchParams({ limit: "200" });
  if (category) params.set("category", category);

  const { data, error, isLoading } = useSWR<ColorSearchResponse>(
    targetHex ? `/api/catalog/color-search?${params.toString()}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const ranked: ColorMatchResult[] =
    targetHex && data?.results
      ? rankByColorMatch(targetHex, data.results)
      : [];

  return {
    results: ranked,
    isLoading,
    error,
    isEmpty: !isLoading && ranked.length === 0,
    totalWithColor: data?.count ?? 0,
  };
}
