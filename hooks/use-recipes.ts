"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { Recipe } from "@/types/recipe";

export function useRecipes() {
  const { data, error, isLoading, mutate } = useSWR<{ recipes: Recipe[]; count: number }>(
    "/api/recipes",
    fetcher
  );

  return {
    recipes: data?.recipes ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
    mutate: () => mutate(),
  };
}
