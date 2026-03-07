import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CosmePickerSheet } from "@/components/cosme-picker-sheet";
import type { InventoryItem } from "@/types/inventory";

function makeItem(overrides: Partial<InventoryItem> & { id: string }): InventoryItem {
  return {
    category: "アイメイク",
    item_type: "アイシャドウ（パウダー）",
    brand: "TestBrand",
    product_name: "TestProduct",
    color_description: "",
    texture: "シマー",
    estimated_remaining: "80%",
    confidence: "high",
    source: "scan",
    created_at: "2026-02-10T00:00:00Z",
    updated_at: "2026-02-10T00:00:00Z",
    ...overrides,
  };
}

const items: InventoryItem[] = [
  makeItem({ id: "1", brand: "CANMAKE", product_name: "アイシャドウA", category: "アイメイク" }),
  makeItem({ id: "2", brand: "KATE", product_name: "アイシャドウB", category: "アイメイク" }),
  makeItem({ id: "3", brand: "MAC", product_name: "リップC", category: "リップ", item_type: "リップスティック" }),
];

describe("CosmePickerSheet", () => {
  it("renders sheet title when open", () => {
    render(
      <CosmePickerSheet
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        items={items}
      />
    );
    expect(screen.getByText("レシピカスタマイズ")).toBeTruthy();
  });

  it("shows category tabs with counts", () => {
    render(
      <CosmePickerSheet
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        items={items}
      />
    );
    // アイメイク tab should show count 2
    const eyeTab = screen.getByText((content, element) =>
      element?.textContent === "アイメイク2"
    );
    expect(eyeTab).toBeTruthy();
  });

  it("shows items in selected category", () => {
    render(
      <CosmePickerSheet
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        items={items}
      />
    );
    // Default tab is ベースメイク, but our items are in アイメイク
    // Click on アイメイク tab
    const eyeTab = screen.getByText((content, element) =>
      element?.textContent === "アイメイク2"
    );
    fireEvent.click(eyeTab);
    expect(screen.getByText("アイシャドウA")).toBeTruthy();
    expect(screen.getByText("アイシャドウB")).toBeTruthy();
  });

  it("calls onConfirm with selected items", () => {
    const onConfirm = vi.fn();
    render(
      <CosmePickerSheet
        open={true}
        onOpenChange={() => {}}
        onConfirm={onConfirm}
        items={items}
      />
    );
    // Switch to アイメイク
    const eyeTab = screen.getByText((content, element) =>
      element?.textContent === "アイメイク2"
    );
    fireEvent.click(eyeTab);

    // Select first item
    fireEvent.click(screen.getByText("アイシャドウA"));

    // Click confirm button
    fireEvent.click(screen.getByText("1個のコスメで決定"));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "1" })])
    );
  });

  it("enforces max selection limit", () => {
    render(
      <CosmePickerSheet
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        items={items}
        maxSelection={1}
      />
    );

    const eyeTab = screen.getByText((content, element) =>
      element?.textContent === "アイメイク2"
    );
    fireEvent.click(eyeTab);

    // Select first item
    fireEvent.click(screen.getByText("アイシャドウA"));
    // Header should show 1/1
    expect(screen.getByText(/1\/1/)).toBeTruthy();

    // Try to select second item — should be disabled
    const secondButton = screen.getByText("アイシャドウB").closest("button");
    expect(secondButton?.hasAttribute("disabled")).toBe(true);
  });

  it("shows empty message for category with no items", () => {
    render(
      <CosmePickerSheet
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        items={items}
      />
    );
    // Default tab is ベースメイク which has no items
    expect(screen.getByText("このカテゴリにアイテムがありません")).toBeTruthy();
  });
});
