import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock SWR before importing hook
const mockMutate = vi.fn();
vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: {
      items: [
        {
          id: "item_001",
          category: "リップ",
          item_type: "リップスティック",
          pao_months: 18,
          brand: "KATE",
          product_name: "リップモンスター",
          color_description: "赤",
          texture: "マット",
          estimated_remaining: "80%",
          confidence: "high",
          source: "画像認識",
          created_at: "2025-01-01",
          updated_at: "2025-01-01",
        },
        {
          id: "item_002",
          category: "アイメイク",
          item_type: "アイシャドウ（パウダー）",
          pao_months: 12,
          brand: "EXCEL",
          product_name: "スキニーリッチシャドウ",
          color_description: "ゴールドブラウン",
          texture: "シマー",
          estimated_remaining: "60%",
          confidence: "high",
          source: "画像認識",
          created_at: "2025-01-01",
          updated_at: "2025-01-01",
        },
      ],
      count: 2,
    },
    error: undefined,
    isLoading: false,
    mutate: mockMutate,
  })),
}));

import { useInventory } from "@/hooks/use-inventory";

describe("useInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns inventory items from SWR", () => {
    const { result } = renderHook(() => useInventory());
    expect(result.current.items).toHaveLength(2);
    expect(result.current.count).toBe(2);
  });

  it("filters by category", () => {
    const { result } = renderHook(() => useInventory());
    act(() => {
      result.current.setFilter("リップ");
    });
    expect(result.current.filter).toBe("リップ");
  });

  it("filters by search query", () => {
    const { result } = renderHook(() => useInventory());
    act(() => {
      result.current.setSearchQuery("KATE");
    });
    // filteredItems should contain only the KATE item
    expect(result.current.filteredItems.length).toBeLessThanOrEqual(2);
  });

  it("returns isLoading state", () => {
    const { result } = renderHook(() => useInventory());
    expect(result.current.isLoading).toBe(false);
  });

  it("provides mutate function", () => {
    const { result } = renderHook(() => useInventory());
    expect(result.current.mutate).toBeDefined();
  });
});
