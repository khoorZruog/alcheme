# Image Processing Pipeline & Rakuten Link Compliance

| | |
|---|---|
| **Date** | 2026-03-07 |
| **Status** | Implemented |

## Summary

3つの課題を解決:
1. スキャン鑑定時に画像が加工されない → confirm API に自動加工トリガーを追加
2. 既存登録済みコスメの画像が未加工 → バッチ処理 API を新設
3. 楽天画像表示時に商品リンクが不足 → 5コンポーネントにリンクを追加

## Task A: スキャン登録時の自動画像加工

**変更**: `app/api/inventory/confirm/route.ts`

- `upsertCatalogEntry()` 成功後、item の `image_url` が data URL の場合に `triggerCatalogImageProcessing()` を fire-and-forget で呼び出す
- 既存関数 `triggerCatalogImageProcessing()` (lib/api/catalog-upsert.ts:157) を活用
- Agent の `/process-image` エンドポイントが背景除去 + 512x512正規化 + GCS アップロードを実行

## Task B: バッチ画像加工 API

**新規**: `app/api/catalog/process-images/route.ts`

- `POST /api/catalog/process-images { limit?: number }`
- `catalog` コレクションから `image_url` 未設定 + `rakuten_image_url` あり のエントリを取得
- 楽天画像を fetch → base64 変換 → Agent `/process-image` に送信
- max 20件/リクエスト、認証必須

## Task C: 楽天画像表示時の商品リンク併記

| コンポーネント | 変更内容 |
|---------------|---------|
| `catalog-detail-sheet.tsx` | 画像下に「楽天で見る」リンク + 「楽天で探す」検索リンク |
| `cosme-card.tsx` | 画像右下に半透明 Rakuten バッジ（クリックで楽天検索） |
| `catalog-ranking-card.tsx` | 同上（product_url 優先） |
| `product-group-card.tsx` | 同上 |
| `appraisal-card.tsx` | サムネイル上の小さな ExternalLink アイコン |

楽天画像を表示中（`!image_url && rakuten_image_url`）の場合のみバッジを表示。

## 検証

- tsc: 型エラーなし（テストファイル以外）
- vitest: 55ファイル / 335テスト全パス
