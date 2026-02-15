"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { Recipe } from "@/types/recipe";

export type RecipeSortOption = "newest" | "oldest" | "match_score" | "name" | "steps";

export const RECIPE_SORT_OPTIONS: { value: RecipeSortOption; label: string }[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "match_score", label: "再現度 高い順" },
  { value: "name", label: "レシピ名" },
  { value: "steps", label: "ステップ数" },
];

export function useRecipes() {
  const { data, error, isLoading, mutate } = useSWR<{ recipes: Recipe[]; count: number }>(
    "/api/recipes",
    fetcher
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<RecipeSortOption>("newest");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [occasionFilter, setOccasionFilter] = useState<string>("全て");
  const [itemFilter, setItemFilter] = useState<string>("全て");

  const allRecipes = data?.recipes ?? [];

  // Extract unique occasions
  const occasions = useMemo(() => {
    const set = new Set<string>();
    allRecipes.forEach((r) => {
      if (r.context?.occasion) set.add(r.context.occasion);
    });
    return Array.from(set).sort();
  }, [allRecipes]);

  // Extract unique item names used in recipes
  const usedItems = useMemo(() => {
    const map = new Map<string, string>(); // item_id → item_name
    allRecipes.forEach((r) => {
      r.steps?.forEach((s) => {
        if (s.item_id && s.item_name) {
          map.set(s.item_id, s.item_name);
        }
      });
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [allRecipes]);

  // Filter
  const filtered = useMemo(() => {
    let result = allRecipes;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const nameMatch = r.recipe_name.toLowerCase().includes(q);
        const requestMatch = r.user_request?.toLowerCase().includes(q);
        const stepMatch = r.steps?.some(
          (s) => s.item_name?.toLowerCase().includes(q) || s.area?.toLowerCase().includes(q)
        );
        return nameMatch || requestMatch || stepMatch;
      });
    }

    if (favoriteOnly) {
      result = result.filter((r) => r.is_favorite);
    }

    if (occasionFilter !== "全て") {
      result = result.filter((r) => r.context?.occasion === occasionFilter);
    }

    if (itemFilter !== "全て") {
      result = result.filter((r) =>
        r.steps?.some((s) => s.item_id === itemFilter)
      );
    }

    return result;
  }, [allRecipes, searchQuery, favoriteOnly, occasionFilter, itemFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "newest":
        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "match_score":
        arr.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
        break;
      case "name":
        arr.sort((a, b) => a.recipe_name.localeCompare(b.recipe_name, "ja"));
        break;
      case "steps":
        arr.sort((a, b) => (b.steps?.length ?? 0) - (a.steps?.length ?? 0));
        break;
    }
    return arr;
  }, [filtered, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== "newest") count++;
    if (favoriteOnly) count++;
    if (occasionFilter !== "全て") count++;
    if (itemFilter !== "全て") count++;
    return count;
  }, [sortBy, favoriteOnly, occasionFilter, itemFilter]);

  return {
    recipes: sorted,
    count: allRecipes.length,
    filteredCount: sorted.length,
    isLoading,
    error,
    mutate: () => mutate(),
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    favoriteOnly, setFavoriteOnly,
    occasionFilter, setOccasionFilter,
    occasions,
    itemFilter, setItemFilter,
    usedItems,
    activeFilterCount,
  };
}
