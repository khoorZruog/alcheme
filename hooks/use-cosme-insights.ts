"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import { computeCosmeInsights, type CosmeInsight } from "@/lib/cosme-usage-insights";
import type { InventoryItem } from "@/types/inventory";
import type { BeautyLogEntry } from "@/types/beauty-log";

export function useCosmeInsights(): {
  insights: CosmeInsight[];
  isLoading: boolean;
} {
  const { data: invData, isLoading: invLoading } = useSWR<{ items: InventoryItem[] }>(
    "/api/inventory",
    fetcher
  );

  // Fetch last 90 days of beauty logs
  const { data: logData, isLoading: logLoading } = useSWR<{ logs: BeautyLogEntry[] }>(
    "/api/beauty-log?mode=timeline&limit=90",
    fetcher
  );

  const insights = useMemo(() => {
    if (!invData?.items) return [];
    return computeCosmeInsights(invData.items, logData?.logs ?? []);
  }, [invData, logData]);

  return {
    insights,
    isLoading: invLoading || logLoading,
  };
}
