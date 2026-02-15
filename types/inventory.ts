// alche:me — Inventory Type Definitions
// フィールド名は snake_case で統一（ADK/Firestore/sample_inventory.json と一致させる）

/** コスメカテゴリ（日本語グループ） */
export type CosmeCategory = "ベースメイク" | "アイメイク" | "リップ" | "スキンケア" | "その他";

/** 質感（日本語） */
export type CosmeTexture = "マット" | "ツヤ" | "サテン" | "シマー" | "クリーム" | "パウダー" | "リキッド";

/** 画像認識の信頼度 */
export type Confidence = "high" | "medium" | "low";

/** コスメスペック（内部値 1-5） */
export interface CosmeStats {
  pigment: number;        // 発色力
  longevity: number;      // 持続力
  shelf_life: number;     // 製品寿命
  natural_finish: number; // ナチュラルさ
}

/** レア度 */
export type Rarity = "SSR" | "SR" | "R" | "N";

/** 楽天商品候補 */
export interface RakutenCandidate {
  name: string;
  price: number;
  url: string;
  shop: string;
  image_url: string;
  color_code?: string;
  color_name?: string;
  review_count?: number;
  review_average?: number;
}

/** 在庫アイテム — Firestore: users/{userId}/inventory/{itemId} */
export interface InventoryItem {
  id: string;
  category: CosmeCategory;
  item_type: string;        // specific Appendix D type (e.g. "マスカラ")
  brand: string;
  product_name: string;
  color_code?: string;
  color_name?: string;
  color_description: string;
  texture: CosmeTexture;
  stats?: CosmeStats;
  rarity?: Rarity;
  estimated_remaining: string;
  pao_months?: number;      // auto-derived from item_type
  open_date?: string;
  image_url?: string;
  images?: string[];         // multiple image URLs
  price?: number;            // Rakuten reference price
  product_url?: string;      // Rakuten product URL
  rakuten_image_url?: string; // Rakuten official image
  candidates?: RakutenCandidate[]; // Pre-registration candidates
  confidence: Confidence;
  source: string;
  created_at: string;
  updated_at: string;
}

/** 画像スキャン結果（Inventory Agent → Next.js API） */
export interface ScanResult {
  success: boolean;
  items: InventoryItem[];
  raw_response?: string;
  error?: string;
}

/** Firestore 保存用（created_at/updated_at は serverTimestamp） */
export type InventoryItemCreate = Omit<InventoryItem, "id" | "created_at" | "updated_at">;
export type InventoryItemUpdate = Partial<Omit<InventoryItem, "id" | "created_at">>;

/** Firestore Timestamp ↔ ISO string 変換ヘルパー型 */
export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
}
