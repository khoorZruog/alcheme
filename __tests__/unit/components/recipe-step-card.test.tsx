import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { RecipeStepCard } from "@/components/recipe-step-card";
import type { RecipeStep } from "@/types/recipe";

const baseStep: RecipeStep = {
  step: 1,
  area: "ベース",
  item_name: "テストファンデ",
  item_id: "item-1",
  instruction: "薄く塗ります",
};

describe("RecipeStepCard", () => {
  it("renders step number and item name", () => {
    render(<RecipeStepCard step={baseStep} stepNumber={1} />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("テストファンデ")).toBeDefined();
  });

  it("shows 手持ち badge when item_id present and no substitution", () => {
    render(<RecipeStepCard step={baseStep} stepNumber={1} />);
    expect(screen.getByText("手持ち")).toBeDefined();
  });

  it("shows 代用テク badge when substitution_note present", () => {
    const subStep: RecipeStep = {
      ...baseStep,
      substitution_note: "他のもので代用できます",
    };
    render(<RecipeStepCard step={subStep} stepNumber={2} />);
    expect(screen.getByText("代用テク")).toBeDefined();
    // Should NOT show 手持ち
    expect(screen.queryByText("手持ち")).toBeNull();
  });

  it("shows neither badge when no item_id", () => {
    const noIdStep: RecipeStep = {
      ...baseStep,
      item_id: "",
    };
    render(<RecipeStepCard step={noIdStep} stepNumber={3} />);
    expect(screen.queryByText("手持ち")).toBeNull();
    expect(screen.queryByText("代用テク")).toBeNull();
  });

  it("renders substitution note box", () => {
    const subStep: RecipeStep = {
      ...baseStep,
      substitution_note: "ブラシで代用可能",
    };
    render(<RecipeStepCard step={subStep} stepNumber={1} />);
    expect(screen.getByText("ブラシで代用可能")).toBeDefined();
  });

  it("renders instruction text", () => {
    render(<RecipeStepCard step={baseStep} stepNumber={1} />);
    expect(screen.getByText("薄く塗ります")).toBeDefined();
  });

  it("renders product image when image_url is present", () => {
    const stepWithImage: RecipeStep = {
      ...baseStep,
      image_url: "https://example.com/cosme.jpg",
    };
    render(<RecipeStepCard step={stepWithImage} stepNumber={1} />);
    const img = screen.getByAltText("テストファンデ");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/cosme.jpg");
  });

  it("does not render image when image_url is absent", () => {
    render(<RecipeStepCard step={baseStep} stepNumber={1} />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders structured substitution card when substitution is present", () => {
    const subStep: RecipeStep = {
      ...baseStep,
      substitution_note: "チークを転用",
      substitution: {
        original_name: "EXCEL リアルクローズシャドウ CS10",
        original_brand: "EXCEL",
        reason: "コーラルピンクの色味が近い",
        tips: ["少量を指に取る", "1回塗りで十分"],
        search_url: "https://search.rakuten.co.jp/search/mall/EXCEL+%E3%83%AA%E3%82%A2%E3%83%AB%E3%82%AF%E3%83%AD%E3%83%BC%E3%82%BA%E3%82%B7%E3%83%A3%E3%83%89%E3%82%A6+CS10/",
      },
    };
    render(<RecipeStepCard step={subStep} stepNumber={3} />);
    // Structured card should show ideal product name
    expect(screen.getByText(/EXCEL リアルクローズシャドウ CS10/)).toBeDefined();
    // Should show reason
    expect(screen.getByText("コーラルピンクの色味が近い")).toBeDefined();
    // Should show tips
    expect(screen.getByText("少量を指に取る")).toBeDefined();
    expect(screen.getByText("1回塗りで十分")).toBeDefined();
    // Should show Rakuten link
    expect(screen.getByText("楽天で探す")).toBeDefined();
  });

  it("falls back to plain substitution_note when substitution object is absent", () => {
    const subStep: RecipeStep = {
      ...baseStep,
      substitution_note: "ブラシで代用可能",
    };
    render(<RecipeStepCard step={subStep} stepNumber={1} />);
    expect(screen.getByText("ブラシで代用可能")).toBeDefined();
    // Should NOT show structured card elements
    expect(screen.queryByText("楽天で探す")).toBeNull();
  });
});
