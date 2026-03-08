# FEAT-005: 色で探す（Color Search）

## Context

競合「LipMatch」がリップの色マッチング機能でバイラルした。alche:me では**全カテゴリ対応**の色検索を実装し差別化する。

## 実装内容

### 1. データ層 — hex_color フィールド追加
- `types/catalog.ts`, `types/inventory.ts`: `hex_color?: string` 追加
- `agent/alcheme/schemas/inventory.py`: Pydantic モデルに追加
- `lib/api/catalog-upsert.ts`, `agent/alcheme/tools/catalog_tools.py`: CATALOG_FIELDS に追加
- `app/api/inventory/confirm/route.ts`: PRODUCT_FIELDS に追加
- `app/api/catalog/browse/route.ts`: レスポンスマッピングに追加

### 2. エージェント — hex 推定ルール
- `agent/alcheme/prompts/inventory.py`: スキャン時に商品の代表色HEXを推定する指示追加

### 3. 色マッチングコア
- `lib/color-match.ts` (新規): CIELAB ΔE76 色距離計算
  - `hexToRgb()`, `rgbToLab()`, `deltaE76()`, `matchPercent()`, `rankByColorMatch()`
- `app/api/catalog/color-search/route.ts` (新規): hex_color を持つカタログエントリを返すAPI
- `hooks/use-color-search.ts` (新規): SWR フック + クライアント側マッチソート

### 4. UI コンポーネント
- `components/color-picker.tsx` (新規): HSLカラーピッカー + コスメ用プリセットスウォッチ（7カラーファミリー）
- `components/color-match-card.tsx` (新規): マッチ%バッジ + カラースウォッチ付き結果カード
- `app/(main)/add/community/page.tsx`: 🎨 トグルボタンで色検索モード切替

### 5. ショッピングリンク
- `components/catalog-detail-sheet.tsx`: 楽天 + Amazon + Qoo10 検索リンク
- `app/(main)/inventory/[itemId]/page.tsx`: 同上

## 検証

- 383テスト全パス (59ファイル)
- tsc --noEmit パス (既存テストファイルエラーのみ)
- 19件の color-match ユニットテスト追加
