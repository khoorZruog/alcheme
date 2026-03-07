// alche:me — Theme Suggestion Type Definitions
//
// テーマデータは recipes コレクションに統合されている (source: "theme")。
// この型はテーマスワイプ overlay 等、テーマ固有 UI で使う互換型。

/** テーマ提案 — Agent レスポンス互換型。
 *  Firestore 上は recipes コレクションに保存される。
 */
export interface ThemeSuggestion {
  id: string;
  title: string;           // = Recipe.theme_title
  description: string;     // = Recipe.theme_description
  style_keywords: string[];
  character_theme: "cute" | "cool" | "elegant";
  preview_image_url?: string;
  status: "active" | "liked" | "skipped";  // = Recipe.theme_status
  recipe_id?: string;
  context?: {
    weather?: string;
    occasion?: string;
    season?: string;
  };
  created_at: string;
  updated_at?: string;
}

/** Recipe doc からテーマ互換型に変換 */
export function recipeToTheme(recipe: {
  id: string;
  theme_title?: string;
  theme_description?: string;
  recipe_name?: string;
  user_request?: string;
  style_keywords?: string[];
  character_theme?: "cute" | "cool" | "elegant";
  preview_image_url?: string;
  theme_status?: "active" | "liked" | "skipped";
  theme_context?: { weather?: string; occasion?: string; season?: string };
  created_at: string;
}): ThemeSuggestion {
  return {
    id: recipe.id,
    title: recipe.theme_title ?? recipe.recipe_name ?? "",
    description: recipe.theme_description ?? recipe.user_request ?? "",
    style_keywords: recipe.style_keywords ?? [],
    character_theme: recipe.character_theme ?? "cute",
    preview_image_url: recipe.preview_image_url,
    status: recipe.theme_status ?? "active",
    context: recipe.theme_context,
    created_at: recipe.created_at,
  };
}
