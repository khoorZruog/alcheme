"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";
import { fetcher } from "@/lib/api/fetcher";
import type { InventoryItem, CosmeCategory } from "@/types/inventory";

interface UseInventoryReturn {
  items: InventoryItem[];
  isLoading: boolean;
  error: any;
  mutate: () => void;
  filter: CosmeCategory | "全て";
  setFilter: (f: CosmeCategory | "全て") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredItems: InventoryItem[];
  count: number;
}

export function useInventory(): UseInventoryReturn {
  const [filter, setFilter] = useState<CosmeCategory | "全て">("全て");
  const [searchQuery, setSearchQuery] = useState("");

  const params = filter !== "全て" ? `?category=${filter}` : "";
  const { data, error, isLoading, mutate } = useSWR<{ items: InventoryItem[]; count: number }>(
    `/api/inventory${params}`,
    fetcher
  );

  const items = data?.items ?? [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.brand.toLowerCase().includes(q) ||
        item.product_name.toLowerCase().includes(q) ||
        item.color_description.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return {
    items,
    isLoading,
    error,
    mutate: () => mutate(),
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    filteredItems,
    count: data?.count ?? 0,
  };
}
