import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeCardStack } from "@/components/theme-card-stack";
import type { ThemeSuggestion } from "@/types/theme";

function makeTheme(overrides: Partial<ThemeSuggestion> & { id: string }): ThemeSuggestion {
  return {
    title: "テスト テーマ",
    description: "テスト用の説明文です",
    style_keywords: ["ナチュラル", "透明感"],
    character_theme: "cute",
    status: "active",
    created_at: "2026-02-22T00:00:00Z",
    updated_at: "2026-02-22T00:00:00Z",
    ...overrides,
  };
}

const themes: ThemeSuggestion[] = [
  makeTheme({ id: "t1", title: "透明感メイク", character_theme: "cute" }),
  makeTheme({ id: "t2", title: "クールビューティー", character_theme: "cool" }),
  makeTheme({ id: "t3", title: "エレガントメイク", character_theme: "elegant" }),
];

describe("ThemeCardStack", () => {
  it("renders the first theme card", () => {
    render(
      <ThemeCardStack
        themes={themes}
        loadingImages={new Set()}
        onLike={() => {}}
        onSkip={() => {}}
        onComplete={() => {}}
      />
    );
    expect(screen.getByText("透明感メイク")).toBeTruthy();
  });

  it("shows loading spinner for image-loading themes", () => {
    render(
      <ThemeCardStack
        themes={themes}
        loadingImages={new Set(["t1"])}
        onLike={() => {}}
        onSkip={() => {}}
        onComplete={() => {}}
      />
    );
    expect(screen.getByText("イメージ生成中...")).toBeTruthy();
  });

  it("calls onLike when Like button is clicked", () => {
    const onLike = vi.fn();
    render(
      <ThemeCardStack
        themes={themes}
        loadingImages={new Set()}
        onLike={onLike}
        onSkip={() => {}}
        onComplete={() => {}}
      />
    );
    fireEvent.click(screen.getByLabelText("このテーマを選ぶ"));
    expect(onLike).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" })
    );
  });

  it("calls onSkip when Skip button is clicked", () => {
    const onSkip = vi.fn();
    render(
      <ThemeCardStack
        themes={themes}
        loadingImages={new Set()}
        onLike={() => {}}
        onSkip={onSkip}
        onComplete={() => {}}
      />
    );
    fireEvent.click(screen.getByLabelText("スキップ"));
    expect(onSkip).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" })
    );
  });

  it("renders progress dots for each theme", () => {
    const { container } = render(
      <ThemeCardStack
        themes={themes}
        loadingImages={new Set()}
        onLike={() => {}}
        onSkip={() => {}}
        onComplete={() => {}}
      />
    );
    // 3 progress dots
    const dots = container.querySelectorAll(".rounded-full.w-2");
    expect(dots.length).toBe(3);
  });

  it("shows style keywords", () => {
    render(
      <ThemeCardStack
        themes={themes}
        loadingImages={new Set()}
        onLike={() => {}}
        onSkip={() => {}}
        onComplete={() => {}}
      />
    );
    // Multiple cards stacked may show the same keywords
    expect(screen.getAllByText("ナチュラル").length).toBeGreaterThan(0);
    expect(screen.getAllByText("透明感").length).toBeGreaterThan(0);
  });
});
