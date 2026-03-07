import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCardInline } from "@/components/product-card-inline";
import type { ProductCardData } from "@/types/chat";

const baseData: ProductCardData = {
  brand: "CANMAKE",
  product_name: "パーフェクトスタイリストアイズ",
  category: "アイメイク",
  price: 858,
  image_url: undefined,
  product_url: undefined,
  duplicate_risk: "none",
  gap_analysis: "fills_gap",
  similar_items_count: 0,
  compatibility_summary: "新しいカテゴリのアイテムです",
};

describe("ProductCardInline", () => {
  it("renders brand and product name", () => {
    render(<ProductCardInline data={baseData} />);
    expect(screen.getByText("CANMAKE")).toBeDefined();
    expect(screen.getByText("パーフェクトスタイリストアイズ")).toBeDefined();
  });

  it("renders price when provided", () => {
    render(<ProductCardInline data={baseData} />);
    expect(screen.getByText("¥858")).toBeDefined();
  });

  it("shows green badge for none/low risk", () => {
    render(<ProductCardInline data={baseData} />);
    expect(screen.getByText("相性◎")).toBeDefined();
  });

  it("shows amber badge for medium risk", () => {
    render(<ProductCardInline data={{ ...baseData, duplicate_risk: "medium" }} />);
    expect(screen.getByText("類似あり")).toBeDefined();
  });

  it("shows red badge for high risk", () => {
    render(<ProductCardInline data={{ ...baseData, duplicate_risk: "high" }} />);
    expect(screen.getByText("重複リスク")).toBeDefined();
  });

  it("shows gap analysis text", () => {
    render(<ProductCardInline data={baseData} />);
    expect(screen.getByText("新カテゴリ!")).toBeDefined();
  });

  it("renders external link when product_url provided", () => {
    render(<ProductCardInline data={{ ...baseData, product_url: "https://example.com" }} />);
    expect(screen.getByText("楽天で見る")).toBeDefined();
  });

  it("hides external link when no product_url", () => {
    render(<ProductCardInline data={baseData} />);
    expect(screen.queryByText("楽天で見る")).toBeNull();
  });
});
