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

/** 商品マスタ — Firestore: users/{userId}/products/{productId} */
export interface Product {
  id: string;
  brand: string;
  product_name: string;
  category: CosmeCategory;
  item_type: string;
  color_code?: string;
  color_name?: string;
  color_description?: string;
  texture: CosmeTexture;
  stats?: CosmeStats;
  rarity?: Rarity;
  pao_months?: number;
  price?: number;
  product_url?: string;
  image_url?: string;
  rakuten_image_url?: string;
  source: string;
  confidence: Confidence;
  created_at: string;
  updated_at: string;
}

/** 在庫個体 — Firestore: users/{userId}/inventory/{itemId} */
export interface InventoryInstance {
  id: string;
  product_id: string;
  purchase_date?: string;
  open_date?: string;
  estimated_remaining: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

/** UI用結合型 — API が返すフラット形式（従来の InventoryItem と互換） */
export interface InventoryItem {
  id: string;
  product_id?: string;
  category: CosmeCategory;
  item_type: string;
  brand: string;
  product_name: string;
  color_code?: string;
  color_name?: string;
  color_description: string;
  texture: CosmeTexture;
  stats?: CosmeStats;
  rarity?: Rarity;
  estimated_remaining: string;
  pao_months?: number;
  purchase_date?: string;
  open_date?: string;
  memo?: string;
  image_url?: string;
  images?: string[];
  price?: number;
  product_url?: string;
  rakuten_image_url?: string;
  candidates?: RakutenCandidate[];
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

/** 型番グルーピング — brand + product_name で在庫アイテムをまとめる */
export interface ProductGroup {
  /** グループキー: `${brand}::${product_name}` */
  groupKey: string;
  brand: string;
  productName: string;
  category: CosmeCategory;
  itemType: string;
  /** 色バリアント (newest first) */
  variants: InventoryItem[];
  variantCount: number;
  /** 代表アイテム (最新) — 画像・価格表示用 */
  representative: InventoryItem;
  /** 全バリアント中の最低残量% */
  minRemaining: number;
  /** 最新 created_at (ソート用) */
  newestDate: string;
}

/** グリッドセルの判別共用体 — 単品 or グループ */
export type GridEntry =
  | { type: "single"; item: InventoryItem }
  | { type: "group"; group: ProductGroup };
