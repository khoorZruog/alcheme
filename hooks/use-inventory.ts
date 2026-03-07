"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";
import { fetcher } from "@/lib/api/fetcher";
import type {
  InventoryItem,
  CosmeCategory,
  CosmeTexture,
  ProductGroup,
  GridEntry,
} from "@/types/inventory";

export type FilterMode = "category" | "brand";

export type SortOption =
  | "newest"
  | "oldest"
  | "brand"
  | "product_name"
  | "remaining_asc"
  | "remaining_desc"
  | "color_count";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "brand", label: "ブランド名" },
  { value: "product_name", label: "商品名" },
  { value: "remaining_asc", label: "残量 少ない順" },
  { value: "remaining_desc", label: "残量 多い順" },
  { value: "color_count", label: "色数 多い順" },
];

export type GroupMode = "grouped" | "expanded";

interface UseInventoryReturn {
  items: InventoryItem[];
  isLoading: boolean;
  error: any;
  mutate: () => void;
  filterMode: FilterMode;
  setFilterMode: (m: FilterMode) => void;
  filter: CosmeCategory | "全て";
  setFilter: (f: CosmeCategory | "全て") => void;
  itemTypeFilter: string | "全て";
  setItemTypeFilter: (t: string | "全て") => void;
  itemTypes: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  textureFilter: CosmeTexture | "全て";
  setTextureFilter: (t: CosmeTexture | "全て") => void;
  brandFilter: string | "全て";
  setBrandFilter: (b: string | "全て") => void;
  filteredItems: InventoryItem[];
  gridEntries: GridEntry[];
  brands: string[];
  count: number;
  activeFilterCount: number;
  groupMode: GroupMode;
  setGroupMode: React.Dispatch<React.SetStateAction<GroupMode>>;
}

function parseRemaining(item: InventoryItem): number {
  if (!item.estimated_remaining) return 50;
  const num = parseInt(item.estimated_remaining.replace("%", ""), 10);
  return isNaN(num) ? 50 : num;
}

export function useInventory(): UseInventoryReturn {
  const [filterMode, setFilterModeRaw] = useState<FilterMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("inventory-filter-mode") as FilterMode) || "category";
    }
    return "category";
  });
  const [filter, setFilter] = useState<CosmeCategory | "全て">("全て");
  const [itemTypeFilter, setItemTypeFilter] = useState<string | "全て">("全て");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [textureFilter, setTextureFilter] = useState<CosmeTexture | "全て">("全て");
  const [brandFilter, setBrandFilter] = useState<string | "全て">("全て");
  const [groupMode, setGroupMode] = useState<GroupMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("inventory-group-mode") as GroupMode) || "grouped";
    }
    return "grouped";
  });

  const setFilterMode = (m: FilterMode) => {
    setFilterModeRaw(m);
    if (typeof window !== "undefined") localStorage.setItem("inventory-filter-mode", m);
    if (m === "brand") {
      setFilter("全て");
      setItemTypeFilter("全て");
    } else {
      setBrandFilter("全て");
    }
  };

  const params = filter !== "全て" ? `?category=${filter}` : "";
  const { data, error, isLoading, mutate } = useSWR<{ items: InventoryItem[]; count: number }>(
    `/api/inventory${params}`,
    fetcher
  );

  const items = data?.items ?? [];

  // Dynamic brand list for filter chips
  const brands = useMemo(() => {
    const set = new Set(items.map((i) => i.brand));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
  }, [items]);

  // Dynamic item_type list for Level 2 chips (within selected category)
  const itemTypes = useMemo(() => {
    if (filterMode !== "category" || filter === "全て") return [];
    const categoryItems = items.filter((i) => i.category === filter);
    const set = new Set(categoryItems.map((i) => i.item_type).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
  }, [items, filter, filterMode]);

  const filteredItems = useMemo(() => {
    let result = items;

    // Search filter (expanded: color_code, color_name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.brand.toLowerCase().includes(q) ||
          item.product_name.toLowerCase().includes(q) ||
          item.color_description.toLowerCase().includes(q) ||
          (item.color_code ?? "").toLowerCase().includes(q) ||
          (item.color_name ?? "").toLowerCase().includes(q)
      );
    }

    // Texture filter
    if (textureFilter !== "全て") {
      result = result.filter((item) => item.texture === textureFilter);
    }

    // Brand filter
    if (brandFilter !== "全て") {
      result = result.filter((item) => item.brand === brandFilter);
    }

    // Item type filter (Level 2, category mode only)
    if (filterMode === "category" && itemTypeFilter !== "全て") {
      result = result.filter((item) => item.item_type === itemTypeFilter);
    }

    // Sort
    if (sortBy !== "newest") {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "brand":
            return a.brand.localeCompare(b.brand, "ja");
          case "product_name":
            return a.product_name.localeCompare(b.product_name, "ja");
          case "remaining_asc":
            return parseRemaining(a) - parseRemaining(b);
          case "remaining_desc":
            return parseRemaining(b) - parseRemaining(a);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [items, searchQuery, textureFilter, brandFilter, itemTypeFilter, filterMode, sortBy]);

  // Build grid entries with grouping (or flat in expanded mode)
  const gridEntries = useMemo(() => {
    // Expanded mode: no grouping, all items as individual cards
    if (groupMode === "expanded") {
      const sorted = [...filteredItems];
      sorted.sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "brand":
            return a.brand.localeCompare(b.brand, "ja");
          case "product_name":
            return a.product_name.localeCompare(b.product_name, "ja");
          case "remaining_asc":
            return parseRemaining(a) - parseRemaining(b);
          case "remaining_desc":
            return parseRemaining(b) - parseRemaining(a);
          case "color_count":
            return 0; // Not meaningful for individual items
          default: // newest
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
      return sorted.map((item): GridEntry => ({ type: "single", item }));
    }

    // Grouped mode: group by brand::product_name
    const groupMap = new Map<string, InventoryItem[]>();
    for (const item of filteredItems) {
      const key = `${item.brand}::${item.product_name}`;
      const arr = groupMap.get(key) ?? [];
      arr.push(item);
      groupMap.set(key, arr);
    }

    const entries: GridEntry[] = [];
    for (const [groupKey, variants] of groupMap) {
      // Sort variants within group newest first
      variants.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (variants.length === 1) {
        entries.push({ type: "single", item: variants[0] });
      } else {
        const representative = variants[0];
        const remainings = variants.map((v) => parseRemaining(v));
        entries.push({
          type: "group",
          group: {
            groupKey,
            brand: representative.brand,
            productName: representative.product_name,
            category: representative.category,
            itemType: representative.item_type,
            variants,
            variantCount: variants.length,
            representative,
            minRemaining: Math.min(...remainings),
            newestDate: representative.created_at,
          },
        });
      }
    }

    // Sort entries at group level
    entries.sort((a, b) => {
      const aDate = a.type === "single" ? a.item.created_at : a.group.newestDate;
      const bDate = b.type === "single" ? b.item.created_at : b.group.newestDate;
      const aBrand = a.type === "single" ? a.item.brand : a.group.brand;
      const bBrand = b.type === "single" ? b.item.brand : b.group.brand;
      const aName = a.type === "single" ? a.item.product_name : a.group.productName;
      const bName = b.type === "single" ? b.item.product_name : b.group.productName;
      const aRemaining = a.type === "single" ? parseRemaining(a.item) : a.group.minRemaining;
      const bRemaining = b.type === "single" ? parseRemaining(b.item) : b.group.minRemaining;
      const aCount = a.type === "group" ? a.group.variantCount : 1;
      const bCount = b.type === "group" ? b.group.variantCount : 1;

      switch (sortBy) {
        case "oldest":
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        case "brand":
          return aBrand.localeCompare(bBrand, "ja");
        case "product_name":
          return aName.localeCompare(bName, "ja");
        case "remaining_asc":
          return aRemaining - bRemaining;
        case "remaining_desc":
          return bRemaining - aRemaining;
        case "color_count":
          return bCount - aCount;
        default: // newest
          return new Date(bDate).getTime() - new Date(aDate).getTime();
      }
    });

    return entries;
  }, [filteredItems, sortBy, groupMode]);

  // Count active filters (excluding defaults)
  const activeFilterCount =
    (textureFilter !== "全て" ? 1 : 0) +
    (filterMode === "category" && brandFilter !== "全て" ? 1 : 0) +
    (filterMode === "category" && itemTypeFilter !== "全て" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  return {
    items,
    isLoading,
    error,
    mutate: () => mutate(),
    filterMode,
    setFilterMode,
    filter,
    setFilter,
    itemTypeFilter,
    setItemTypeFilter,
    itemTypes,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    textureFilter,
    setTextureFilter,
    brandFilter,
    setBrandFilter,
    filteredItems,
    gridEntries,
    brands,
    count: data?.count ?? 0,
    activeFilterCount,
    groupMode,
    setGroupMode,
  };
}
