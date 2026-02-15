"""Shared constants for cosme categories, PAO durations, and texture mappings."""

# カテゴリグループ (UI filter 用)
CATEGORY_GROUPS: list[str] = [
    "ベースメイク",
    "アイメイク",
    "リップ",
    "スキンケア",
    "その他",
]

# item_type → { group, pao_months }
# PRD Appendix D: コスメ使用期限一覧表 (PAO Reference)
ITEM_TYPE_PAO: dict[str, dict] = {
    # ベースメイク
    "化粧下地": {"group": "ベースメイク", "pao_months": 6},
    "BB・CCクリーム": {"group": "ベースメイク", "pao_months": 6},
    "リキッドファンデーション": {"group": "ベースメイク", "pao_months": 6},
    "パウダーファンデーション": {"group": "ベースメイク", "pao_months": 12},
    "クッションファンデーション": {"group": "ベースメイク", "pao_months": 6},
    "コンシーラー": {"group": "ベースメイク", "pao_months": 6},
    "フェイスパウダー": {"group": "ベースメイク", "pao_months": 24},
    "パウダーチーク": {"group": "ベースメイク", "pao_months": 12},
    "クリームチーク": {"group": "ベースメイク", "pao_months": 6},
    "パウダーハイライト": {"group": "ベースメイク", "pao_months": 24},
    "クリームハイライト": {"group": "ベースメイク", "pao_months": 6},
    # アイメイク
    "アイシャドウ（パウダー）": {"group": "アイメイク", "pao_months": 12},
    "アイシャドウ（リキッド）": {"group": "アイメイク", "pao_months": 6},
    "マスカラ": {"group": "アイメイク", "pao_months": 3},
    "リキッドアイライナー": {"group": "アイメイク", "pao_months": 3},
    "ペンシルアイライナー": {"group": "アイメイク", "pao_months": 12},
    "グリッターライナー": {"group": "アイメイク", "pao_months": 12},
    "アイブロウペンシル": {"group": "アイメイク", "pao_months": 12},
    "アイブロウパウダー": {"group": "アイメイク", "pao_months": 12},
    "眉マスカラ": {"group": "アイメイク", "pao_months": 6},
    "リキッドアイブロウ": {"group": "アイメイク", "pao_months": 6},
    "ビューラーのゴム": {"group": "アイメイク", "pao_months": 2},
    # リップ
    "リップグロス": {"group": "リップ", "pao_months": 12},
    "リップスティック": {"group": "リップ", "pao_months": 18},
    "リップティント": {"group": "リップ", "pao_months": 12},
    # スキンケア
    "日焼け止め": {"group": "スキンケア", "pao_months": 12},
    "化粧水": {"group": "スキンケア", "pao_months": 9},
    "乳液・クリーム": {"group": "スキンケア", "pao_months": 9},
    "美容液": {"group": "スキンケア", "pao_months": 7},
    "クレンジング": {"group": "スキンケア", "pao_months": 9},
    "洗顔フォーム": {"group": "スキンケア", "pao_months": 6},
    "シートマスク": {"group": "スキンケア", "pao_months": 1},
    # その他
    "パフ・スポンジ": {"group": "その他", "pao_months": 3},
    "その他": {"group": "その他", "pao_months": 12},
}

# テクスチャ一覧（日本語）
TEXTURES: list[str] = ["マット", "ツヤ", "サテン", "シマー", "クリーム", "パウダー", "リキッド"]

# 英語→日本語マイグレーション用
TEXTURE_EN_TO_JA: dict[str, str] = {
    "matte": "マット",
    "glossy": "ツヤ",
    "satin": "サテン",
    "shimmer": "シマー",
    "cream": "クリーム",
    "powder": "パウダー",
    "liquid": "リキッド",
}

CATEGORY_EN_TO_JA: dict[str, str] = {
    "Lip": "リップ",
    "Eye": "アイメイク",
    "Cheek": "ベースメイク",
    "Base": "ベースメイク",
    "Other": "その他",
}

# カテゴリ→デフォルト item_type（旧データのフォールバック用）
CATEGORY_DEFAULT_ITEM_TYPE: dict[str, str] = {
    "ベースメイク": "リキッドファンデーション",
    "アイメイク": "アイシャドウ（パウダー）",
    "リップ": "リップスティック",
    "スキンケア": "化粧水",
    "その他": "その他",
}


def get_pao_months(item_type: str) -> int | None:
    """Get PAO months for an item type."""
    entry = ITEM_TYPE_PAO.get(item_type)
    return entry["pao_months"] if entry else None


def get_category_group(item_type: str) -> str:
    """Get the broad category group for an item type."""
    entry = ITEM_TYPE_PAO.get(item_type)
    return entry["group"] if entry else "その他"
