import type { Recipe } from "@/types/recipe";

export interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  reasons: string[];
}

/**
 * Score a single recipe (0-100 scale).
 *
 * Scoring breakdown:
 * - Weather match:  +30  (recipe.context?.weather === currentWeather)
 * - Favorite:       +20  (recipe.is_favorite)
 * - Liked feedback: +20  (feedback?.user_rating === "liked")
 * - Recency:        +15 (7d) / +10 (30d) / +5 (older)
 * - Random jitter:  +0-15 (keeps it fun)
 */
export function scoreRecipe(
  recipe: Recipe,
  currentWeather: string | null,
): ScoredRecipe {
  let score = 0;
  const reasons: string[] = [];

  // Weather match
  if (currentWeather && recipe.context?.weather === currentWeather) {
    score += 30;
    reasons.push("天気にぴったり");
  }

  // Favorite
  if (recipe.is_favorite) {
    score += 20;
    reasons.push("お気に入り");
  }

  // Liked feedback
  if (recipe.feedback?.user_rating === "liked") {
    score += 20;
    reasons.push("高評価");
  }

  // Recency
  const daysSince = Math.floor(
    (Date.now() - new Date(recipe.created_at).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSince <= 7) {
    score += 15;
    reasons.push("最近のレシピ");
  } else if (daysSince <= 30) {
    score += 10;
  } else {
    score += 5;
  }

  // Random jitter (0–15)
  score += Math.floor(Math.random() * 16);

  return { recipe, score, reasons };
}

/**
 * Pick one recipe from the pool using weighted random selection
 * among the top candidates.
 *
 * @param excludeIds  IDs to skip (already shown / skipped)
 * @returns null when no eligible recipes remain
 */
export function recommendRecipe(
  recipes: Recipe[],
  currentWeather: string | null,
  excludeIds: string[] = [],
): ScoredRecipe | null {
  const excludeSet = new Set(excludeIds);
  const eligible = recipes.filter((r) => !excludeSet.has(r.id));
  if (eligible.length === 0) return null;

  const scored = eligible
    .map((r) => scoreRecipe(r, currentWeather))
    .sort((a, b) => b.score - a.score);

  // Weighted random among top-3 (or fewer)
  const pool = scored.slice(0, 3);
  const totalWeight = pool.reduce((s, r) => s + r.score, 0);
  if (totalWeight === 0) return pool[0];

  let rand = Math.random() * totalWeight;
  for (const sr of pool) {
    rand -= sr.score;
    if (rand <= 0) return sr;
  }

  return pool[0];
}
