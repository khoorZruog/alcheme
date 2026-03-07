import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBrandSuggestions } from "@/hooks/use-brand-suggestions";

// Mock useInventory
vi.mock("@/hooks/use-inventory", () => ({
  useInventory: () => ({
    brands: ["KATE", "Dior", "ケイト"],
    items: [],
  }),
}));

// Mock useCatalogSearch
vi.mock("@/hooks/use-catalog-search", () => ({
  useCatalogSearch: (query: string) => {
    if (!query || query.length < 2)
      return { results: [], isLoading: false, error: undefined };
    // Simulate catalog results
    if (query.toLowerCase().startsWith("ka")) {
      return {
        results: [
          { brand: "KATE", brand_normalized: "kate", product_name: "リップモンスター", product_name_normalized: "リップモンスター" },
          { brand: "KANEBO", brand_normalized: "kanebo", product_name: "ルージュスター", product_name_normalized: "ルージュスター" },
        ],
        isLoading: false,
        error: undefined,
      };
    }
    return { results: [], isLoading: false, error: undefined };
  },
}));

describe("useBrandSuggestions", () => {
  it("returns empty when query is empty", () => {
    const { result } = renderHook(() => useBrandSuggestions(""));
    expect(result.current.suggestions).toHaveLength(0);
  });

  it("returns local brands matching query", () => {
    const { result } = renderHook(() => useBrandSuggestions("ka"));
    const labels = result.current.suggestions.map((s) => s.label);
    expect(labels).toContain("KATE");
  });

  it("includes catalog brands not in local inventory", () => {
    const { result } = renderHook(() => useBrandSuggestions("ka"));
    const labels = result.current.suggestions.map((s) => s.label);
    expect(labels).toContain("KANEBO");
  });

  it("deduplicates brands from local and catalog", () => {
    const { result } = renderHook(() => useBrandSuggestions("ka"));
    // KATE exists in both local and catalog — should appear only once
    const kateEntries = result.current.suggestions.filter(
      (s) => s.label === "KATE",
    );
    expect(kateEntries).toHaveLength(1);
  });

  it("local brands appear before catalog brands", () => {
    const { result } = renderHook(() => useBrandSuggestions("ka"));
    const inventoryIdx = result.current.suggestions.findIndex(
      (s) => s.source === "inventory",
    );
    const catalogIdx = result.current.suggestions.findIndex(
      (s) => s.source === "catalog",
    );
    if (inventoryIdx >= 0 && catalogIdx >= 0) {
      expect(inventoryIdx).toBeLessThan(catalogIdx);
    }
  });

  it("caps suggestions at 8", () => {
    const { result } = renderHook(() => useBrandSuggestions("ka"));
    expect(result.current.suggestions.length).toBeLessThanOrEqual(8);
  });
});
