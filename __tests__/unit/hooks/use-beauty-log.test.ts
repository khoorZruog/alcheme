import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBeautyLogs, useBeautyLogEntry } from "@/hooks/use-beauty-log";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Override global SWR mock
vi.mock("swr", () => ({
  default: vi.fn((key: string | null) => {
    if (key && key.includes("/api/beauty-log?month=")) {
      return {
        data: { logs: [], count: 0 },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
      };
    }
    if (key && key.includes("/api/beauty-log/")) {
      return {
        data: { log: { id: "2026-02-15", date: "2026-02-15", self_rating: 4 } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
      };
    }
    return {
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    };
  }),
}));

describe("useBeautyLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty logs array initially", () => {
    const { result } = renderHook(() => useBeautyLogs());
    expect(result.current.logs).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks selectedMonth state", () => {
    const { result } = renderHook(() => useBeautyLogs("2026-01"));
    expect(result.current.selectedMonth).toBe("2026-01");

    act(() => {
      result.current.setSelectedMonth("2026-03");
    });
    expect(result.current.selectedMonth).toBe("2026-03");
  });
});

describe("useBeautyLogEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns log data for valid logId", () => {
    const { result } = renderHook(() => useBeautyLogEntry("2026-02-15"));
    expect(result.current.log).toEqual({
      id: "2026-02-15",
      date: "2026-02-15",
      self_rating: 4,
    });
  });

  it("shows success toast on updateLog", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useBeautyLogEntry("2026-02-15"));
    await act(() => result.current.updateLog({ self_rating: 5 }));

    expect(toast.success).toHaveBeenCalledWith("ログを更新しました");
  });

  it("shows error toast on failed updateLog", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useBeautyLogEntry("2026-02-15"));
    await act(() => result.current.updateLog({ self_rating: 5 }));

    expect(toast.error).toHaveBeenCalledWith("ログの更新に失敗しました");
  });

  it("shows success toast on deleteLog", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useBeautyLogEntry("2026-02-15"));
    await act(() => result.current.deleteLog());

    expect(toast.success).toHaveBeenCalledWith("ログを削除しました");
  });
});
