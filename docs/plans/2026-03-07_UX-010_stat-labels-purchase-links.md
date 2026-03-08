# UX-010: カテゴリ別スペックラベル + 購入リンク統合

## Context

手動テストで発覚した2件:
1. **スペックラベル**: 「発色力」「ナチュラル」はメイク向きだが、スキンケアやその他カテゴリには不自然
2. **楽天ボタン**: 「楽天で見る」と「楽天で探す」の2ボタンが冗長。将来はAmazon・Qoo10等も想定

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `components/stat-bar.tsx` | カテゴリ別ラベル切替ロジック追加 (`getStatLabel`, `getStatLabels` エクスポート) |
| `components/item-edit-sheet.tsx` | `STAT_LABELS` 定数削除 → `getStatLabels(form.category)` に変更 |
| `app/(main)/add/manual/page.tsx` | 同上 |
| `components/appraisal-card.tsx` | `StatBarGroup` に `category` prop 追加 |
| `app/(main)/inventory/[itemId]/page.tsx` | `StatBarGroup` に `category` prop 追加 + 楽天2ボタン → 1ボタン統合 |
| `components/catalog-detail-sheet.tsx` | 楽天2ボタン → 1ボタン統合 |
| `__tests__/unit/components/stat-bar.test.tsx` | カテゴリ別テスト追加 (17テスト) |

## ラベルマッピング

| フィールド | メイク (ベースメイク/アイメイク/リップ) | スキンケア | その他 |
|-----------|--------------------------------------|-----------|--------|
| pigment | 発色力 | 保湿力 | 仕上がり |
| longevity | 持続力 | 持続力 | 持続力 |
| shelf_life | コスパ | コスパ | コスパ |
| natural_finish | ナチュラル | 使用感 | 使用感 |

## 購入リンク統合

- `product_url` あり → 「楽天で見る」(直リンク)
- `product_url` なし → 「楽天で探す」(検索リンク)
- 1ボタンのみ表示

## 検証

- 359テスト全パス
- tsc --noEmit パス (既存エラーのみ)
