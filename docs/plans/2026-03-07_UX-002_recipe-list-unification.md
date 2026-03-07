# UX-002: レシピ一覧UIの在庫一覧UIとの統一

| | |
|---|---|
| **Date** | 2026-03-07 |
| **Status** | ✅ Complete |
| **Related** | backlog_and_remaining_tasks.md (UX-002) |

## Context

レシピ一覧 (`recipes/page.tsx`) と在庫一覧 (`inventory/`) で UI パターンが異なっていた。
在庫一覧を「正」として、レシピ一覧の見た目・操作感を揃える。
共通の `ListPageLayout` は過剰抽象化のため作成せず、**視覚的統一**に集中。

## 差異と対応

| 差異 | 在庫（正） | レシピ（旧） | 対応 |
|------|-----------|-------------|------|
| カード基盤 | `glass-card bg-white rounded-card p-3` | `Card` + `CardContent p-3` | glass-card パターンに統一 |
| チェックボックス位置 | 右上 (`top-3 right-3`) 丸型 | 左上 (`top-2 left-2`) 角型 | 右上丸型に統一 |
| チェックボックス形状 | `rounded-full` + `Check` | `rounded` + `CheckSquare` | rounded-full + Check に統一 |
| アスペクト比 | `aspect-square` | `aspect-[4/3]` | `aspect-square` に統一 |
| リスト項目 | `bg-white/60 divide-y` ラップ | `bg-white rounded-2xl border` 個別 | divide-y ラップに統一 |
| バルクバー | `BulkActionBar` コンポーネント | インライン 40行 | `BulkActionBar` を汎用化して共有 |

## 変更ファイル

### Batch 1: BulkActionBar 汎用化

- **`components/bulk-action-bar.tsx`** — Props に `children?: ReactNode` 追加。children 指定時はデフォルトの残量更新+削除の代わりに children を表示。`onDelete`/`onUpdateRemaining` にオプショナルチェイニング追加。

### Batch 2: レシピUI統一

- **`app/(main)/recipes/page.tsx`**
  - RecipeSummaryCard: `Card`/`CardContent` → glass-card div、チェックボックス右上丸型、ステータスバッジ左上、aspect-square
  - リスト表示: `space-y-2` → `divide-y divide-gray-100` ラップ
  - インラインバルクバー → `BulkActionBar` + children（お気に入り+削除ボタン）
- **`components/recipe-list-item.tsx`** — ラッパー: `bg-white/60 hover:bg-white/80`、チェックボックス: `rounded-full` + `Check`
- **`components/recipe-card-inline.tsx`** — `aspect-[4/3]` → `aspect-square`
- **`components/recipe-omikuji-overlay.tsx`** — `aspect-[4/3]` → `aspect-square`
- **`components/loading-skeleton.tsx`** — `DetailSkeleton` の `aspect-[4/3]` → `aspect-square`

## 変更しなかったもの

- **クイックフィルターチップ** — チップスタイリングは既に統一済み。フィルター種類はドメイン固有
- **ソートオプション** — ドメイン固有
- **ListPageLayout** — 過剰抽象化（3ページの構造が異なりすぎる）
- **FeedPostSkeleton** — フィード投稿は別コンテキスト

## 検証

- `npx tsc --noEmit` — 型チェック通過（pre-existing テスト型エラー3件のみ）
- `npx vitest run` — 全335テスト通過
