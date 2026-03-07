// alche:me — Chat Type Definitions

import type { ScanResult } from './inventory';
import type { RecipeResult } from './recipe';

/** レシピ生成モード */
export type MatchMode = "owned_only" | "prefer_owned" | "free";

/** Agent Engine へのチャットリクエスト */
export interface ChatRequest {
  message: string;
  image_base64?: string;
  image_mime_type?: string;
  user_id: string;
  selected_item_ids?: string[];
  match_mode?: MatchMode;
}

/** Agent Engine からのチャットレスポンス */
export interface ChatResponse {
  success: boolean;
  message: string;
  agent_used: string;
  data?: ScanResult | RecipeResult;
  error?: string;
}

/** 商品カードデータ（ショッピング分析結果） */
export interface ProductCardData {
  brand: string;
  product_name: string;
  category: string;
  price?: number;
  image_url?: string;
  product_url?: string;
  duplicate_risk: "none" | "low" | "medium" | "high";
  gap_analysis: "fills_gap" | "adds_variety" | "near_duplicate";
  similar_items_count: number;
  compatibility_summary: string;
}

/** テクニックカードデータ（代用テクニック） */
export interface TechniqueCardData {
  title: string;
  original_item: string;
  substitute_item: string;
  techniques: string[];
  reasons: string[];
  general_tips: string[];
}

/** プロファイラー分析カード — 眠っているコスメ詳細 */
export interface DormantItemData {
  id: string;
  brand: string;
  product_name: string;
  category: string;
  item_type: string;
}

/** プロファイラーカードデータ */
export interface ProfilerCardData {
  color_preferences: Record<string, number>;
  texture_preferences: Record<string, number>;
  area_frequency: Record<string, number>;
  average_satisfaction: number | null;
  monotony_alert: {
    dominant: string;
    ratio: number;
    message: string;
  } | null;
  underused_items: DormantItemData[];
}

/** チャットメッセージ（UI 表示用） */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent_used?: string;
  data?: ScanResult | RecipeResult;
  product_cards?: ProductCardData[];
  technique_card?: TechniqueCardData;
  profiler_card?: ProfilerCardData;
  image_url?: string;
  preview_image_url?: string;
  is_streaming?: boolean;
  created_at: string;
}

/** 会話（チャット履歴） */
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

/** SSE イベント型 */
export type SSEEventType =
  | "text_delta"
  | "recipe_card"
  | "preview_image"
  | "product_card"
  | "technique_card"
  | "profiler_card"
  | "progress"
  | "content_done"
  | "done"
  | "error"
  | "agent_used";

export interface SSEEvent {
  type: SSEEventType;
  data: string;
}
