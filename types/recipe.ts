// alche:me — Recipe Type Definitions

/** レシピステップ */
export interface RecipeStep {
  step: number;
  area: string;
  item_id: string;
  item_name: string;
  instruction: string;
  substitution_note?: string;
}

/** レシピ — Firestore: users/{userId}/recipes/{recipeId} */
export interface Recipe {
  id: string;
  recipe_name: string;
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
