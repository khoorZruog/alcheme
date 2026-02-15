"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/api/fetcher";
import { toast } from "sonner";
import type { BeautyLogEntry } from "@/types/beauty-log";

export type BeautyLogViewMode = "calendar" | "timeline";

export function useBeautyLogs(initialMonth?: string) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth ?? defaultMonth);
  const [viewMode, setViewMode] = useState<BeautyLogViewMode>("calendar");

  const { data, error, isLoading, mutate } = useSWR<{
    logs: BeautyLogEntry[];
    count: number;
  }>(`/api/beauty-log?month=${selectedMonth}`, fetcher);

  // Timeline mode: paginated infinite scroll
  const PAGE_SIZE = 20;
  const {
    data: timelinePages,
    error: timelineError,
    isLoading: timelineLoading,
    size: timelineSize,
    setSize: setTimelineSize,
    mutate: mutateTimeline,
  } = useSWRInfinite<{ logs: BeautyLogEntry[]; count: number }>(
    (pageIndex) =>
      viewMode === "timeline"
        ? `/api/beauty-log?mode=timeline&limit=${PAGE_SIZE}&offset=${pageIndex * PAGE_SIZE}`
        : null,
    fetcher
  );

  const timelineLogs = timelinePages?.flatMap((p) => p.logs) ?? [];
  const hasMore = timelinePages
    ? timelinePages[timelinePages.length - 1]?.logs.length === PAGE_SIZE
    : false;

  return {
    logs: data?.logs ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
    mutate: () => { mutate(); mutateTimeline(); },
    selectedMonth,
    setSelectedMonth,
    viewMode,
    setViewMode,
    // Timeline
    timelineLogs,
    timelineLoading,
    timelineError,
    hasMore,
    loadMore: () => setTimelineSize(timelineSize + 1),
  };
}

export function useBeautyLogEntry(logId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ log: BeautyLogEntry }>(
    logId ? `/api/beauty-log/${logId}` : null,
    fetcher
  );

  const updateLog = useCallback(
    async (updates: Partial<BeautyLogEntry>) => {
      try {
        const res = await fetch(`/api/beauty-log/${logId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("ログを更新しました");
        mutate();
      } catch {
        toast.error("ログの更新に失敗しました");
      }
    },
    [logId, mutate]
  );

  const deleteLog = useCallback(async () => {
    try {
      const res = await fetch(`/api/beauty-log/${logId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("ログを削除しました");
    } catch {
      toast.error("ログの削除に失敗しました");
    }
  }, [logId]);

  return {
    log: data?.log ?? null,
    isLoading,
    error,
    mutate: () => mutate(),
    updateLog,
    deleteLog,
  };
}
