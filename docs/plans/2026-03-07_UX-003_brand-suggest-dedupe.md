# UX-003: ブランド名・商品名サジェスト + 重複検知 — 実装計画

## Context

手動登録時にブランド名・商品名が自由入力のため、表記ゆれ（"KATE" / "kate" / "ＫＡＴＥ"）が発生し
同一商品が重複登録されやすい。オートコンプリートで入力を統一し、重複を事前警告する。

## 方針

- **新パッケージ不要** — CosmePickerSheet の既存ドロップダウンパターンを踏襲
- **既存 hook を合成** — `useCatalogSearch` + `useInventory` を組み合わせる（API 追加なし）
- **3 画面に統一適用** — ItemEditSheet / Manual Add / Suggestions Add

---

## Batch 1: コア（5 new files）

### 1. `lib/normalize-brand.ts`
ブランド名正規化ユーティリティ:
- trim + 全角英数→半角 + lowercase
- 比較・マッチング用（表示は元の入力値を保持）

### 2. `hooks/use-brand-suggestions.ts`
```
useBrandSuggestions(query: string) → { suggestions: BrandSuggestion[], isLoading }
```
- ローカル: `useInventory().brands` を `normalizeBrand` で substring match（即時表示）
- カタログ: `useCatalogSearch(query)` から brand を抽出（300ms debounce）
- マージ: ローカル優先 → カタログ追加、重複排除、max 8件

### 3. `hooks/use-product-suggestions.ts`
```
useProductSuggestions(query: string, brand?: string) → { suggestions: ProductSuggestion[], isLoading }
```
- brand 指定時はフィルタリング
- ローカル inventory items + カタログ results を合成

### 4. `components/autocomplete-input.tsx`
再利用可能なオートコンプリート入力:
- Props: `value`, `onChange`, `suggestions[]`, `isLoading`, `className`, `showSource`
- CosmePickerSheet パターン: `absolute top-full mt-1 bg-white rounded-xl shadow-lg z-10`
- ソースバッジ: `手持ち`（amber）/ `みんなの登録`（neon）
- Enter で第1候補選択、Escape で閉じる、外クリックで閉じる

### 5. `components/duplicate-warning.tsx`
重複検知インライン警告:
- `brand + product_name + color_code` の完全一致 → "この商品はすでに登録されています"
- `brand + product_name` 一致 + `color_code` 不一致 → "同じ商品の別カラーとして登録されます"
- amber バナー（`AlertTriangle` icon）
- warning のみ — save はブロックしない

---

## Batch 2: 3画面へ統合（3 modified files）

### 1. `components/item-edit-sheet.tsx`（line 235-243）
- brand `<Input>` → `<AutocompleteInput>` + `useBrandSuggestions`
- product_name `<Input>` → `<AutocompleteInput>` + `useProductSuggestions`
- color grid の後に `<DuplicateWarning>` 追加

### 2. `app/(main)/add/manual/page.tsx`（line 234-258）
- 同上パターン

### 3. `app/(main)/suggestions/add/page.tsx`（line 64-90）
- brand/product_name の `<input>` → `<AutocompleteInput>`
- `className` で既存スタイル維持（`rounded-xl border-gray-200 bg-gray-50`）
- DuplicateWarning は不要（suggestions は別コレクション）

---

## Batch 3: テスト（5 new files）

| ファイル | 内容 |
|---------|------|
| `__tests__/unit/lib/normalize-brand.test.ts` | ASCII / 全角 / trim / カタカナ通過 |
| `__tests__/unit/hooks/use-brand-suggestions.test.ts` | ローカル優先 / カタログ合成 / 重複排除 |
| `__tests__/unit/hooks/use-product-suggestions.test.ts` | brand フィルタ / 合成 |
| `__tests__/unit/components/autocomplete-input.test.tsx` | 表示 / 選択 / キーボード |
| `__tests__/unit/components/duplicate-warning.test.tsx` | 完全一致 / 色違い / 非表示 |

---

## Batch 4: ドキュメント（2 modified, 1 new）

- `docs/plans/2026-03-07_UX-003_brand-suggest-dedupe.md` — この計画書
- `docs/plans/backlog_and_remaining_tasks.md` — UX-003 を ✅ RESOLVED に
- `docs/README.md` — plans テーブルに追加

---

## ファイル数サマリ

| Batch | New | Modified | Total |
|-------|-----|----------|-------|
| 1: コア | 5 | 0 | 5 |
| 2: 統合 | 0 | 3 | 3 |
| 3: テスト | 5 | 0 | 5 |
| 4: ドキュメント | 1 | 2 | 3 |
| **合計** | **11** | **5** | **16** |

---

## 既存コード再利用

| 再利用対象 | ファイル | 用途 |
|-----------|---------|------|
| `useCatalogSearch()` | `hooks/use-catalog-search.ts` | カタログ prefix search (debounced) |
| `useInventory().brands` | `hooks/use-inventory.ts:112-115` | ローカルブランド一覧 |
| `useInventory().items` | `hooks/use-inventory.ts` | 重複検知用アイテム一覧 |
| CosmePickerSheet dropdown | `components/cosme-picker-sheet.tsx:228-245` | UI パターン参考 |
| dedupeKey pattern | `app/api/inventory/route.ts:22-24` | 重複判定ロジック |

---

## 検証

1. `npx tsc --noEmit` — 型チェック通過
2. `npx vitest run` — 全テスト通過
3. 手動テスト:
   - brand に "KA" 入力 → "KATE" がサジェストされる
   - サジェスト選択 → brand フィールド更新
   - product_name 入力 → 選択 brand でフィルタされたサジェスト
   - 既存アイテムと同じ brand + product_name + color_code → 警告表示
   - 既存と brand + product_name 同じ + color_code 違い → 色違いメッセージ
