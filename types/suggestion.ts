// alche:me — Suggested Items Type Definitions

import type { CosmeCategory } from "./inventory";

/** 推薦履歴エントリ */
export interface SuggestionHistory {
  recipe_id?: string;
  recipe_name?: string;
  suggested_at: string;
  context: string;
}

/** 買い足し候補アイテム */
export interface SuggestedItem {
  id: string;
  brand: string;
  product_name: string;
  color_code?: string;
  color_name?: string;
  category?: CosmeCategory;
  item_type?: string;
  price_range?: string;
  product_url?: string;
  image_url?: string;
  reason: string;
  recommendation_count: number;
  history: SuggestionHistory[];
  status: "候補" | "購入済み" | "見送り";
  source?: "manual" | "ai";
  created_at: string;
  updated_at: string;
}
