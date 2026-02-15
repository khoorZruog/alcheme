"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { SuggestedItem } from "@/types/suggestion";

export type SuggestionSortOption = "recommendation" | "newest" | "brand" | "name";
export type SuggestionStatus = "全て" | "候補" | "購入済み" | "見送り";

export const SUGGESTION_SORT_OPTIONS: { value: SuggestionSortOption; label: string }[] = [
  { value: "recommendation", label: "おすすめ順" },
  { value: "newest", label: "新しい順" },
  { value: "brand", label: "ブランド名" },
  { value: "name", label: "商品名" },
];

export function useSuggestions() {
  const { data, error, isLoading, mutate } = useSWR<{ items: SuggestedItem[]; count: number }>(
    "/api/suggestions",
    fetcher
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SuggestionSortOption>("recommendation");
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus>("全て");
  const [brandFilter, setBrandFilter] = useState<string>("全て");

  const allItems = data?.items ?? [];

  // Extract unique brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((item) => {
      if (item.brand) set.add(item.brand);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
  }, [allItems]);

  // Filter
  const filtered = useMemo(() => {
    let result = allItems;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        return (
          item.brand?.toLowerCase().includes(q) ||
          item.product_name?.toLowerCase().includes(q) ||
          item.color_code?.toLowerCase().includes(q) ||
          item.color_name?.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== "全て") {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (brandFilter !== "全て") {
      result = result.filter((item) => item.brand === brandFilter);
    }

    return result;
  }, [allItems, searchQuery, statusFilter, brandFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "recommendation":
        arr.sort((a, b) => (b.recommendation_count ?? 0) - (a.recommendation_count ?? 0));
        break;
      case "newest":
        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "brand":
        arr.sort((a, b) => (a.brand || "").localeCompare(b.brand || "", "ja"));
        break;
      case "name":
        arr.sort((a, b) => (a.product_name || "").localeCompare(b.product_name || "", "ja"));
        break;
    }
    return arr;
  }, [filtered, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== "recommendation") count++;
    if (statusFilter !== "全て") count++;
    if (brandFilter !== "全て") count++;
    return count;
  }, [sortBy, statusFilter, brandFilter]);

  return {
    items: sorted,
    count: allItems.length,
    filteredCount: sorted.length,
    isLoading, error,
    mutate: () => mutate(),
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    statusFilter, setStatusFilter,
    brandFilter, setBrandFilter,
    brands,
    activeFilterCount,
  };
}
