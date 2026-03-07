import { describe, it, expect, vi, beforeEach } from "vitest";
import { scoreRecipe, recommendRecipe } from "@/lib/recipe-recommendation";
import type { Recipe } from "@/types/recipe";

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "r1",
    recipe_name: "テストレシピ",
    user_request: "",
    steps: [],
    thinking_process: [],
    pro_tips: [],
    is_favorite: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("scoreRecipe", () => {
  beforeEach(() => {
    // Fix Math.random for deterministic tests
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  it("adds 30 points for weather match", () => {
    const recipe = makeRecipe({ context: { weather: "晴れ" } });
    const result = scoreRecipe(recipe, "晴れ");
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.reasons).toContain("天気にぴったり");
  });

  it("does not add weather points when weather differs", () => {
    const recipe = makeRecipe({ context: { weather: "曇り" } });
    const result = scoreRecipe(recipe, "晴れ");
    expect(result.reasons).not.toContain("天気にぴったり");
  });

  it("adds 20 points for favorites", () => {
    const recipe = makeRecipe({ is_favorite: true });
    const result = scoreRecipe(recipe, null);
    expect(result.reasons).toContain("お気に入り");
  });

  it("adds 20 points for liked feedback", () => {
    const recipe = makeRecipe({
      feedback: { user_rating: "liked", created_at: new Date().toISOString() },
    });
    const result = scoreRecipe(recipe, null);
    expect(result.reasons).toContain("高評価");
  });

  it("gives higher score to recent recipes", () => {
    const recent = makeRecipe({
      id: "recent",
      created_at: new Date().toISOString(),
    });
    const old = makeRecipe({
      id: "old",
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const recentScore = scoreRecipe(recent, null);
    const oldScore = scoreRecipe(old, null);
    expect(recentScore.score).toBeGreaterThan(oldScore.score);
    expect(recentScore.reasons).toContain("最近のレシピ");
  });
});

describe("recommendRecipe", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  it("returns null for empty recipe list", () => {
    expect(recommendRecipe([], null)).toBeNull();
  });

  it("returns a recipe from the pool", () => {
    const recipes = [makeRecipe({ id: "r1" }), makeRecipe({ id: "r2" })];
    const result = recommendRecipe(recipes, null);
    expect(result).not.toBeNull();
    expect(["r1", "r2"]).toContain(result!.recipe.id);
  });

  it("excludes recipes by ID", () => {
    const recipes = [makeRecipe({ id: "r1" }), makeRecipe({ id: "r2" })];
    const result = recommendRecipe(recipes, null, ["r1"]);
    expect(result).not.toBeNull();
    expect(result!.recipe.id).toBe("r2");
  });

  it("returns null when all recipes are excluded", () => {
    const recipes = [makeRecipe({ id: "r1" })];
    const result = recommendRecipe(recipes, null, ["r1"]);
    expect(result).toBeNull();
  });

  it("prefers higher-scored recipes", () => {
    const favorite = makeRecipe({ id: "fav", is_favorite: true });
    const normal = makeRecipe({ id: "normal" });
    // With random=0, the first (highest scored) should be selected
    const result = recommendRecipe([favorite, normal], null);
    expect(result!.recipe.id).toBe("fav");
  });
});
