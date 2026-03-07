"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import type { CatalogEntry } from "@/types/catalog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Debounced catalog search hook.
 * Queries GET /api/catalog/search with a 300ms debounce.
 */
export function useCatalogSearch(query: string, debounceMs = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const trimmed = debouncedQuery.trim().toLowerCase();
  const shouldFetch = trimmed.length >= 2;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/catalog/search?q=${encodeURIComponent(trimmed)}&limit=10` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 },
  );

  return {
    results: (data?.results ?? []) as CatalogEntry[],
    isLoading: shouldFetch && isLoading,
    error,
  };
}
