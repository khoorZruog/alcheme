import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductSuggestions } from "@/hooks/use-product-suggestions";

// Mock useInventory
vi.mock("@/hooks/use-inventory", () => ({
  useInventory: () => ({
    brands: ["KATE", "Dior"],
    items: [
      { brand: "KATE", product_name: "リップモンスター", color_code: "03" },
      { brand: "KATE", product_name: "アイシャドウマニア", color_code: "01" },
      { brand: "Dior", product_name: "リップグロウ", color_code: "001" },
    ],
  }),
}));

// Mock useCatalogSearch
vi.mock("@/hooks/use-catalog-search", () => ({
  useCatalogSearch: (query: string) => {
    if (!query || query.length < 2)
      return { results: [], isLoading: false, error: undefined };
    if (query.includes("リップ")) {
      return {
        results: [
          { brand: "KATE", brand_normalized: "kate", product_name: "リップモンスター", product_name_normalized: "リップモンスター" },
          { brand: "CHANEL", brand_normalized: "chanel", product_name: "リップカラー", product_name_normalized: "リップカラー" },
        ],
        isLoading: false,
        error: undefined,
      };
    }
    return { results: [], isLoading: false, error: undefined };
  },
}));

describe("useProductSuggestions", () => {
  it("returns empty when query is empty", () => {
    const { result } = renderHook(() => useProductSuggestions(""));
    expect(result.current.suggestions).toHaveLength(0);
  });

  it("filters products by brand when specified", () => {
    const { result } = renderHook(() => useProductSuggestions("リップ", "KATE"));
    const brands = result.current.suggestions.map((s) => s.brand);
    // All inventory results should be KATE, catalog CHANEL should be excluded
    const inventorySuggestions = result.current.suggestions.filter(
      (s) => s.source === "inventory",
    );
    inventorySuggestions.forEach((s) => expect(s.brand).toBe("KATE"));
  });

  it("returns products from both inventory and catalog", () => {
    const { result } = renderHook(() => useProductSuggestions("リップ"));
    const sources = new Set(result.current.suggestions.map((s) => s.source));
    expect(sources.has("inventory")).toBe(true);
    expect(sources.has("catalog")).toBe(true);
  });

  it("deduplicates same brand+product from inventory and catalog", () => {
    const { result } = renderHook(() => useProductSuggestions("リップ"));
    // KATE リップモンスター exists in both — should appear once
    const lipMonster = result.current.suggestions.filter(
      (s) => s.label === "リップモンスター" && s.brand === "KATE",
    );
    expect(lipMonster).toHaveLength(1);
  });

  it("caps suggestions at 8", () => {
    const { result } = renderHook(() => useProductSuggestions("リップ"));
    expect(result.current.suggestions.length).toBeLessThanOrEqual(8);
  });
});
