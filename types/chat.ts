// alche:me — Chat Type Definitions

import type { ScanResult } from './inventory';
import type { RecipeResult } from './recipe';

/** Agent Engine へのチャットリクエスト */
export interface ChatRequest {
  message: string;
  image_base64?: string;
  image_mime_type?: string;
  user_id: string;
}

/** Agent Engine からのチャットレスポンス */
export interface ChatResponse {
  success: boolean;
  message: string;
  agent_used: string;
  data?: ScanResult | RecipeResult;
  error?: string;
}

/** チャットメッセージ（UI 表示用） */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent_used?: string;
  data?: ScanResult | RecipeResult;
  image_url?: string;
  preview_image_url?: string;
  is_streaming?: boolean;
  created_at: string;
}

/** SSE イベント型 */
export type SSEEventType = "text_delta" | "recipe_card" | "preview_image" | "progress" | "done" | "error";

export interface SSEEvent {
  type: SSEEventType;
  data: string;
}
