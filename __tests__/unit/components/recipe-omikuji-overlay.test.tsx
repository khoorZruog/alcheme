import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { RecipeOmikujiOverlay } from "@/components/recipe-omikuji-overlay";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock useRecipeOmikuji
const mockDrawRecipe = vi.fn();
const mockExcludeAndRedraw = vi.fn();
const mockReset = vi.fn();

const defaultHookState = {
  result: null,
  isDrawing: false,
  hasNoRecipes: false,
  allExhausted: false,
  drawRecipe: mockDrawRecipe,
  excludeAndRedraw: mockExcludeAndRedraw,
  reset: mockReset,
};

let hookState = { ...defaultHookState };

vi.mock("@/hooks/use-recipe-omikuji", () => ({
  useRecipeOmikuji: () => hookState,
}));

const onClose = vi.fn();
const onRecipeSelected = vi.fn();
const onRequestNewRecipe = vi.fn();

describe("RecipeOmikujiOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState = { ...defaultHookState };
  });

  it("shows drawing state when isDrawing", () => {
    hookState = { ...defaultHookState, isDrawing: true };
    render(
      <RecipeOmikujiOverlay
        open={true}
        onClose={onClose}
        onRecipeSelected={onRecipeSelected}
        onRequestNewRecipe={onRequestNewRecipe}
      />,
    );
    expect(screen.getByText("おみくじを引いています...")).toBeTruthy();
  });

  it("shows recipe result in reveal state", () => {
    hookState = {
      ...defaultHookState,
      result: {
        recipe: {
          id: "r1",
          recipe_name: "ナチュラルメイク",
          user_request: "",
          steps: [
            {
              step: 1,
              area: "ベース",
              item_id: "i1",
              item_name: "下地",
              instruction: "塗る",
            },
          ],
          thinking_process: [],
          pro_tips: [],
          is_favorite: false,
          match_score: 85,
          created_at: new Date().toISOString(),
        },
        score: 75,
        reasons: ["天気にぴったり", "お気に入り"],
      },
    };
    render(
      <RecipeOmikujiOverlay
        open={true}
        onClose={onClose}
        onRecipeSelected={onRecipeSelected}
        onRequestNewRecipe={onRequestNewRecipe}
      />,
    );
    expect(screen.getByText("ナチュラルメイク")).toBeTruthy();
    expect(screen.getByText("天気にぴったり")).toBeTruthy();
    expect(screen.getByText("お気に入り")).toBeTruthy();
    expect(screen.getByText(/一致率 85%/)).toBeTruthy();
  });

  it("calls onRecipeSelected when 'このレシピで始める' is clicked", () => {
    const recipe = {
      id: "r1",
      recipe_name: "テスト",
      user_request: "",
      steps: [],
      thinking_process: [],
      pro_tips: [],
      is_favorite: false,
      created_at: new Date().toISOString(),
    };
    hookState = {
      ...defaultHookState,
      result: { recipe, score: 50, reasons: [] },
    };
    render(
      <RecipeOmikujiOverlay
        open={true}
        onClose={onClose}
        onRecipeSelected={onRecipeSelected}
        onRequestNewRecipe={onRequestNewRecipe}
      />,
    );
    fireEvent.click(screen.getByText("このレシピで始める"));
    expect(onRecipeSelected).toHaveBeenCalledWith(recipe);
  });

  it("shows empty state when no recipes exist", () => {
    hookState = { ...defaultHookState, hasNoRecipes: true };
    render(
      <RecipeOmikujiOverlay
        open={true}
        onClose={onClose}
        onRecipeSelected={onRecipeSelected}
        onRequestNewRecipe={onRequestNewRecipe}
      />,
    );
    expect(screen.getByText("まだレシピがありません")).toBeTruthy();
  });

  it("shows exhausted state with new recipe button", () => {
    hookState = { ...defaultHookState, allExhausted: true };
    render(
      <RecipeOmikujiOverlay
        open={true}
        onClose={onClose}
        onRecipeSelected={onRecipeSelected}
        onRequestNewRecipe={onRequestNewRecipe}
      />,
    );
    expect(
      screen.getByText("保存済みレシピは全て試しました！"),
    ).toBeTruthy();
    expect(screen.getByText("新しいレシピを作る")).toBeTruthy();
  });

  it("calls onRequestNewRecipe from exhausted state", () => {
    hookState = { ...defaultHookState, allExhausted: true };
    render(
      <RecipeOmikujiOverlay
        open={true}
        onClose={onClose}
        onRecipeSelected={onRecipeSelected}
        onRequestNewRecipe={onRequestNewRecipe}
      />,
    );
    fireEvent.click(screen.getByText("新しいレシピを作る"));
    expect(onRequestNewRecipe).toHaveBeenCalled();
  });

  it("does not render when not open", () => {
    render(
      <RecipeOmikujiOverlay
        open={false}
        onClose={onClose}
        onRecipeSelected={onRecipeSelected}
        onRequestNewRecipe={onRequestNewRecipe}
      />,
    );
    expect(screen.queryByText("おみくじを引いています...")).toBeNull();
  });
});
