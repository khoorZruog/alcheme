import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DuplicateWarning } from "@/components/duplicate-warning";
import type { InventoryItem } from "@/types/inventory";

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem =>
  ({
    id: "item-1",
    brand: "KATE",
    product_name: "リップモンスター",
    color_code: "03",
    color_name: "陽炎",
    color_description: "コーラルレッド",
    category: "リップ",
    item_type: "口紅",
    texture: "マット",
    estimated_remaining: "80%",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  }) as InventoryItem;

describe("DuplicateWarning", () => {
  it("shows nothing when no duplicate found", () => {
    const { container } = render(
      <DuplicateWarning
        brand="Dior"
        productName="リップグロウ"
        colorCode="001"
        items={[makeItem()]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows exact duplicate warning", () => {
    render(
      <DuplicateWarning
        brand="KATE"
        productName="リップモンスター"
        colorCode="03"
        items={[makeItem()]}
      />,
    );
    expect(screen.getByText("このコスメはすでにMy Cosmeに登録されています")).toBeDefined();
  });

  it("shows color variant message when brand+product match but color differs", () => {
    render(
      <DuplicateWarning
        brand="KATE"
        productName="リップモンスター"
        colorCode="05"
        items={[makeItem()]}
      />,
    );
    expect(
      screen.getByText("同じ商品の別カラーがMy Cosmeにあります（登録可能）"),
    ).toBeDefined();
  });

  it("is case-insensitive", () => {
    render(
      <DuplicateWarning
        brand="kate"
        productName="リップモンスター"
        colorCode="03"
        items={[makeItem()]}
      />,
    );
    expect(screen.getByText("このコスメはすでにMy Cosmeに登録されています")).toBeDefined();
  });

  it("excludes editing item from check", () => {
    const { container } = render(
      <DuplicateWarning
        brand="KATE"
        productName="リップモンスター"
        colorCode="03"
        items={[makeItem()]}
        editingId="item-1"
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("treats missing color_code as exact duplicate, not color variant", () => {
    render(
      <DuplicateWarning
        brand="KATE"
        productName="リップモンスター"
        items={[makeItem()]}
      />,
    );
    expect(screen.getByText("このコスメはすでにMy Cosmeに登録されています")).toBeDefined();
  });

  it("treats existing item with no color as exact duplicate", () => {
    render(
      <DuplicateWarning
        brand="KATE"
        productName="リップモンスター"
        colorCode="03"
        items={[makeItem({ color_code: "" })]}
      />,
    );
    expect(screen.getByText("このコスメはすでにMy Cosmeに登録されています")).toBeDefined();
  });

  it("shows nothing when brand or productName is empty", () => {
    const { container } = render(
      <DuplicateWarning
        brand=""
        productName="リップモンスター"
        colorCode="03"
        items={[makeItem()]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });
});
