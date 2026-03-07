# UX-004: みんなのコスメ — UX改善 + have_countバグ修正

**Date:** 2026-03-07
**Status:** Done

## Context

ユーザーからの6件のフィードバックに基づく「みんなのコスメ」ページの改善。

## 変更内容

### Batch 1: バグ修正 + デフォルトカテゴリ
- `app/api/inventory/confirm/route.ts` — `upsertCatalogEntry` のエラーログ追加（silent catch 修正）
- `app/(main)/add/community/page.tsx` — 保存後 `mutateBrowse()` で SWR キャッシュ invalidate
- `app/api/catalog/browse/route.ts` — `category` パラメータをオプション化（全カテゴリ対応）
- `hooks/use-catalog-browse.ts` — `null` = 全カテゴリ、`undefined` = フェッチしない
- デフォルトカテゴリ: 「リップ」→「全て」

### Batch 2: 詳細ビュー + ボタン改善 + 重複警告
- `components/catalog-detail-sheet.tsx` — **NEW** カタログ商品の詳細表示シート
  - カードクリック → 詳細（読み取り専用）→「My Cosmeに追加」→ 編集シートの 2 段階フロー
  - 所有済み商品: 「すでにMy Cosmeに登録済み ✓」表示、ボタン無効化
- `components/item-edit-sheet.tsx` —
  - SheetTitle: 「アイテムを修正」→ 新規「コスメを登録」/ 既存「コスメを編集」
  - ボタン: 「保存」→ 新規「My Cosmeに追加」/ 既存「変更を保存」
  - DuplicateWarning を色の説明↔質感 間からシート上部に移動
  - exact duplicate 時にボタン disabled
- `components/duplicate-warning.tsx` —
  - メッセージ改善: exact →「このコスメはすでにMy Cosmeに登録されています」（赤系）
  - color_variant →「同じ商品の別カラーがMy Cosmeにあります（登録可能）」（青系）
  - `useDuplicateCheck` hook を export（親コンポーネントから type 参照可能に）

### Batch 3: ブランドフィルタ改善
- ピルボタン → Select ドロップダウンに変更（スケーラビリティ対応）

## ファイル

| ファイル | 変更 |
|---------|------|
| `app/api/inventory/confirm/route.ts` | Modified |
| `app/api/catalog/browse/route.ts` | Modified |
| `hooks/use-catalog-browse.ts` | Modified |
| `app/(main)/add/community/page.tsx` | Modified |
| `components/catalog-detail-sheet.tsx` | **New** |
| `components/item-edit-sheet.tsx` | Modified |
| `components/duplicate-warning.tsx` | Modified |
| `__tests__/unit/components/duplicate-warning.test.tsx` | Modified |
