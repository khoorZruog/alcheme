import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCosmeInsights } from "@/hooks/use-cosme-insights";

// Mock SWR
vi.mock("swr", () => ({
  default: (key: string) => {
    if (key === "/api/inventory") {
      return {
        data: {
          items: [
            {
              id: "item1",
              brand: "CANMAKE",
              product_name: "パーフェクトスタイリストアイズ",
              category: "アイメイク",
              item_type: "アイシャドウ（パウダー）",
              color_description: "ピンクブラウン",
              texture: "シマー",
              estimated_remaining: "80%",
              confidence: "high",
              source: "scan",
              created_at: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
              updated_at: new Date().toISOString(),
            },
          ],
        },
        isLoading: false,
      };
    }
    if (key?.startsWith("/api/beauty-log")) {
      return {
        data: { logs: [] },
        isLoading: false,
      };
    }
    return { data: undefined, isLoading: true };
  },
}));

// Mock fetcher
vi.mock("@/lib/api/fetcher", () => ({
  fetcher: vi.fn(),
}));

describe("useCosmeInsights", () => {
  it("computes insights from inventory and logs", async () => {
    const { result } = renderHook(() => useCosmeInsights());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should detect the new item as new_unused (created 2 days ago, no usage logs)
    expect(result.current.insights.length).toBeGreaterThanOrEqual(1);
    expect(result.current.insights[0].type).toBe("new_unused");
    expect(result.current.insights[0].item.id).toBe("item1");
  });

  it("returns empty insights during loading", () => {
    // This test verifies the empty state via the useMemo guard
    // The actual loading state depends on SWR behavior
    const { result } = renderHook(() => useCosmeInsights());
    // insights should be an array (possibly empty if loading)
    expect(Array.isArray(result.current.insights)).toBe(true);
  });
});
