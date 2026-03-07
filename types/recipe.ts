// alche:me — Recipe Type Definitions

/** 代用テク情報（構造化） */
export interface SubstitutionInfo {
  original_name: string;
  original_brand?: string;
  reason: string;
  tips: string[];
  search_url?: string;
}

/** レシピステップ */
export interface RecipeStep {
  step: number;
  area: string;
  item_id: string;
  item_name: string;
  instruction: string;
  substitution_note?: string;
  substitution?: SubstitutionInfo;
  color_code?: string;
  color_name?: string;
  brand?: string;
  image_url?: string;
}

/** レシピ — Firestore: users/{userId}/recipes/{recipeId}
 *  テーマのみエントリ (source: "theme") もこのコレクションに統合。
 */
export interface Recipe {
  id: string;
  recipe_name: string;

  // --- テーマフィールド ---
  theme_title?: string;
  theme_description?: string;
  style_keywords?: string[];
  theme_status?: "active" | "liked" | "skipped";
  theme_context?: {
    weather?: string;
    occasion?: string;
    season?: string;
  };

  // --- レシピフィールド ---
  user_request: string;
  match_score?: number;
  thinking_process: string[];
  steps: RecipeStep[];
  context?: {
    weather?: string;
    occasion?: string;
    note?: string;
  };
  pro_tips: string[];
  preview_image_url?: string;
  character_theme?: "cute" | "cool" | "elegant";
  is_favorite: boolean;
  source?: "manual" | "ai" | "theme";
  feedback?: {
    user_rating: "liked" | "neutral" | "disliked";
    created_at: string;
  };
  created_at: string;
}

/** レシピ生成結果（Alchemist Agent → Next.js API） */
export interface RecipeResult {
  success: boolean;
  recipe?: Recipe;
  thinking_process?: string[];
  error?: string;
}
