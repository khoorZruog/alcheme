// alche:me — Catalog Type Definitions
// グローバル共有商品カタログの型定義

import type { CosmeCategory, CosmeTexture } from './inventory';

/** カタログエントリ — Firestore: catalog/{catalogId} */
export interface CatalogEntry {
  id: string;
  brand: string;
  brand_normalized: string;
  product_name: string;
  product_name_normalized: string;
  category?: CosmeCategory;
  item_type?: string;
  color_code?: string;
  color_name?: string;
  color_description?: string;
  texture?: CosmeTexture;
  pao_months?: number;
  image_url?: string;
  rakuten_image_url?: string;
  price?: number;
  product_url?: string;
  /** この商品を登録したユーザー数（後方互換: have + want） */
  contributor_count: number;
  /** 在庫登録ユーザー数 */
  have_count: number;
  /** 欲しいリスト登録ユーザー数 */
  want_count: number;
  /** Beauty Log での使用回数（全ユーザー合計） */
  use_count: number;
  /** 使用時の自己評価合計（avg_rating = total_rating / rating_count） */
  total_rating: number;
  /** 評価件数 */
  rating_count: number;
  created_at: string;
  updated_at: string;
}
