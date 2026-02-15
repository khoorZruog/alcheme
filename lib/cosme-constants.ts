// alche:me — Shared cosme constants (categories, PAO, textures)
// Mirrors agent/alcheme/constants.py

export const CATEGORY_GROUPS = [
  "ベースメイク",
  "アイメイク",
  "リップ",
  "スキンケア",
  "その他",
] as const;

export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

/** item_type → { group, pao_months } */
export const ITEM_TYPE_PAO: Record<string, { group: CategoryGroup; pao_months: number }> = {
  // ベースメイク
  "化粧下地": { group: "ベースメイク", pao_months: 6 },
  "BB・CCクリーム": { group: "ベースメイク", pao_months: 6 },
  "リキッドファンデーション": { group: "ベースメイク", pao_months: 6 },
  "パウダーファンデーション": { group: "ベースメイク", pao_months: 12 },
  "クッションファンデーション": { group: "ベースメイク", pao_months: 6 },
  "コンシーラー": { group: "ベースメイク", pao_months: 6 },
  "フェイスパウダー": { group: "ベースメイク", pao_months: 24 },
  "パウダーチーク": { group: "ベースメイク", pao_months: 12 },
  "クリームチーク": { group: "ベースメイク", pao_months: 6 },
  "パウダーハイライト": { group: "ベースメイク", pao_months: 24 },
  "クリームハイライト": { group: "ベースメイク", pao_months: 6 },
  // アイメイク
  "アイシャドウ（パウダー）": { group: "アイメイク", pao_months: 12 },
  "アイシャドウ（リキッド）": { group: "アイメイク", pao_months: 6 },
  "マスカラ": { group: "アイメイク", pao_months: 3 },
  "リキッドアイライナー": { group: "アイメイク", pao_months: 3 },
  "ペンシルアイライナー": { group: "アイメイク", pao_months: 12 },
  "グリッターライナー": { group: "アイメイク", pao_months: 12 },
  "アイブロウペンシル": { group: "アイメイク", pao_months: 12 },
  "アイブロウパウダー": { group: "アイメイク", pao_months: 12 },
  "眉マスカラ": { group: "アイメイク", pao_months: 6 },
  "リキッドアイブロウ": { group: "アイメイク", pao_months: 6 },
  "ビューラーのゴム": { group: "アイメイク", pao_months: 2 },
  // リップ
  "リップグロス": { group: "リップ", pao_months: 12 },
  "リップスティック": { group: "リップ", pao_months: 18 },
  "リップティント": { group: "リップ", pao_months: 12 },
  // スキンケア
  "日焼け止め": { group: "スキンケア", pao_months: 12 },
  "化粧水": { group: "スキンケア", pao_months: 9 },
  "乳液・クリーム": { group: "スキンケア", pao_months: 9 },
  "美容液": { group: "スキンケア", pao_months: 7 },
  "クレンジング": { group: "スキンケア", pao_months: 9 },
  "洗顔フォーム": { group: "スキンケア", pao_months: 6 },
  "シートマスク": { group: "スキンケア", pao_months: 1 },
  // その他
  "パフ・スポンジ": { group: "その他", pao_months: 3 },
  "その他": { group: "その他", pao_months: 12 },
};

/** グループごとの item_type 一覧 */
export function getItemTypesForGroup(group: CategoryGroup): string[] {
  return Object.entries(ITEM_TYPE_PAO)
    .filter(([, v]) => v.group === group)
    .map(([k]) => k);
}

/** item_type から PAO 月数を取得 */
export function getPaoMonths(itemType: string): number | null {
  return ITEM_TYPE_PAO[itemType]?.pao_months ?? null;
}

/** item_type からカテゴリグループを取得 */
export function getCategoryGroup(itemType: string): CategoryGroup {
  return ITEM_TYPE_PAO[itemType]?.group ?? "その他";
}

export const TEXTURES = ["マット", "ツヤ", "サテン", "シマー", "クリーム", "パウダー", "リキッド"] as const;

/** 英語→日本語マイグレーション */
export const TEXTURE_EN_TO_JA: Record<string, string> = {
  matte: "マット", glossy: "ツヤ", satin: "サテン",
  shimmer: "シマー", cream: "クリーム", powder: "パウダー", liquid: "リキッド",
};

export const CATEGORY_EN_TO_JA: Record<string, CategoryGroup> = {
  Lip: "リップ", Eye: "アイメイク", Cheek: "ベースメイク",
  Base: "ベースメイク", Other: "その他",
};

/** カテゴリ→デフォルト item_type（旧データのフォールバック用） */
export const CATEGORY_DEFAULT_ITEM_TYPE: Record<string, string> = {
  "ベースメイク": "リキッドファンデーション",
  "アイメイク": "アイシャドウ（パウダー）",
  "リップ": "リップスティック",
  "スキンケア": "化粧水",
  "その他": "その他",
};
