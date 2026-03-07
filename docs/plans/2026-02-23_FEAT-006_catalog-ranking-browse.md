# Plan: FEAT-006 リアルランキング付きカタログブラウズ

## Context

**アプリコンセプト**: "手持ちコスメで、まだ見ぬ私に出会う" — 新しく買うことよりも、
今持っているコスメの可能性を最大限に引き出す「錬金術」がテーマ。

**課題**: 現在の `/add/community` はテキスト検索のみで、事前に商品名を知っている必要がある。
LIPS/@cosme のようなビジュアルブラウズに加え、**クチコミではなく実データに基づく本物のランキング**を実現する。

**alche:me ランキングの独自性**:
- LIPS/@cosme = クチコミ数・評価ベース（主観的）
- alche:me = **所有 × 活用 × 満足度**の実データベース（客観的）

**コスメ・パラドックス**: 多くのコスメを持っているのに一部しか使わない現象。
活用率（use_count / have_count = 平均活用回数/人）を可視化することで、
「本当に使われている名品」と「棚の奥で眠っている商品」が見えてくる。

---

## Batch 1: カタログ ランキングフィールド追加

### 1-1. `types/catalog.ts` (修正)

```typescript
export interface CatalogEntry {
  // ... existing fields ...
  contributor_count: number;  // 後方互換 (= have + want)
  have_count: number;         // 在庫登録ユーザー数
  want_count: number;         // 欲しいリスト登録ユーザー数
  use_count: number;          // Beauty Log での使用回数（全ユーザー合計）
  total_rating: number;       // 使用時の自己評価合計（avg算出用）
  rating_count: number;       // 評価件数
  // ...
}
```

### 1-2. `lib/api/catalog-upsert.ts` (修正)

`upsertCatalogEntry` に `countType` パラメータ追加:

```typescript
export async function upsertCatalogEntry(
  productFields: Record<string, unknown>,
  countType: 'have' | 'want' = 'have',
): Promise<string>
```

**新規作成時**:
```typescript
{ have_count: countType === 'have' ? 1 : 0,
  want_count: countType === 'want' ? 1 : 0,
  use_count: 0, total_rating: 0, rating_count: 0,
  contributor_count: 1 }
```

**既存更新時**: `FieldValue.increment(1)` を `have_count` or `want_count` に + `contributor_count` もインクリメント。

### 1-3. `agent/alcheme/tools/catalog_tools.py` (修正)

```python
def upsert_catalog(product_fields: dict, count_type: str = "have") -> str:
```
同一のセマンティクス（Python 版）。

### 1-4. 呼び出し元の更新

| ファイル | 変更 |
|---------|------|
| `app/api/inventory/route.ts` L181 | デフォルト `'have'` で変更不要 |
| `app/api/inventory/confirm/route.ts` L100 | 同上 |
| `app/api/products/route.ts` L80 | 同上 |
| `agent/alcheme/tools/inventory_tools.py` L223-224 | デフォルト `"have"` で変更不要 |
| `agent/alcheme/tools/suggestion_tools.py` L94-95 | `upsert_catalog(data, "want")` ← **変更** |

### 1-5. `app/api/catalog/search/route.ts` (修正)

レスポンスに `have_count`, `want_count`, `use_count`, `total_rating`, `rating_count` を追加。

---

## Batch 2: Beauty Log → カタログ活用トラッキング

### `app/api/beauty-log/route.ts` POST (修正)

Beauty Log 保存時に、使用された商品のカタログエントリを更新:

```
POST /api/beauty-log 保存完了後（非ブロック）:
  1. used_items[] から inventory/{itemId} → product_id を解決
  2. products/{productId} → catalog_id を解決
  3. 各 catalog_id に対して:
     - use_count を +1 (FieldValue.increment)
  4. self_rating が指定されている場合:
     - total_rating を +rating (FieldValue.increment)
     - rating_count を +1 (FieldValue.increment)
```

**実装**: `updateCatalogUsageStats()` ヘルパーを `lib/api/catalog-upsert.ts` に追加。
Beauty Log POST の最後に fire-and-forget で呼び出す（ログ保存自体をブロックしない）。

```typescript
// lib/api/catalog-upsert.ts に追加
export async function updateCatalogUsageStats(
  userId: string,
  usedItemIds: string[],
  selfRating?: number,
): Promise<void>
```

解決チェーン: `inventory/{itemId}.product_id → products/{productId}.catalog_id → catalog/{catalogId}`

---

## Batch 3: カタログブラウズ API

### `app/api/catalog/browse/route.ts` (新規)

```
GET /api/catalog/browse?category={CosmeCategory}&brand={brand}&sort={sortKey}&limit=20&cursor={value:id}
```

- `category` 必須
- `brand` 任意 — `brand_normalized` で絞り込み
- `sort` 任意 — `have_count`(デフォルト) | `use_count` | `want_count`
- カーソルページネーション: `{sortValue}:{docId}`
- **初回のみ** `top_brands` を返す（最大15ブランド）

レスポンス:
```json
{
  "results": [CatalogEntry],
  "top_brands": ["KATE", "CANMAKE", ...],
  "next_cursor": "3:abc123def",
  "count": 20
}
```

**Firestore コンポジットインデックス（要作成）:**
1. `catalog` → `category ASC, have_count DESC`
2. `catalog` → `category ASC, brand_normalized ASC, have_count DESC`
3. `catalog` → `category ASC, use_count DESC`

---

## Batch 4: Frontend Hook

### `hooks/use-catalog-browse.ts` (新規)

`useSWRInfinite` で無限スクロール（`hooks/use-feed.ts` パターン踏襲）。

```typescript
useCatalogBrowse(category: CosmeCategory | null, brand: string | null, sort: SortKey)
```

- `results: CatalogEntry[]`
- `topBrands: string[]`
- `isLoading`, `isLoadingMore`, `hasMore`, `isEmpty`
- `loadMore()`

---

## Batch 5: ランキングカード

### `components/catalog-ranking-card.tsx` (新規)

`CosmeCard` (`components/cosme-card.tsx`) のスタイルを踏襲したランキング専用カード。

```
┌─────────────────────┐
│ 🥇1                  │  ← ランキングバッジ (1:gold, 2:silver, 3:bronze, 4+:gray)
│    [商品画像]         │  ← aspect-square, next/image, fallback: Package icon
│                      │     gloss overlay (CosmeCard と同様)
├──────────────────────┤
│ KATE                 │  ← brand (10px, muted, uppercase)
│ リップモンスター      │  ← product_name (sm, bold, line-clamp-2)
│ #03 陽炎             │  ← color_code + color_name
│                      │
│ ★ 4.2                │  ← avg_rating (total_rating/rating_count), gold stars
│ ┌────┬────┬────┐     │
│ │💄 5 │🛒 3│📝 8│     │  ← have / want / use ミニバッジ row
│ │持ってる│欲しい│活用 │     │
│ └────┴────┴────┘     │
└──────────────────────┘
```

Props: `{ entry: CatalogEntry; rank: number; onSelect: (entry) => void }`
- `<button>`, `glass-card bg-white rounded-card p-3 btn-squishy`
- avg_rating = `entry.rating_count > 0 ? (entry.total_rating / entry.rating_count).toFixed(1) : null`
- ランキング 1-3: gold(`#FFD700`) / silver(`#C0C0C0`) / bronze(`#CD7F32`) バッジ背景
- ランキング 4+: `text-text-muted` 番号のみ

---

## Batch 6: ページ拡張

### `app/(main)/add/community/page.tsx` (修正)

**A) ブラウズモード（検索クエリ空）— デフォルト**
```
[PageHeader: みんなのコスメから追加]
[🔍 検索バー                     ]
[ベースメイク][アイメイク][リップ][スキンケア][その他]  ← CategoryFilter
[所有者数順 ▼][活用回数順][欲しい順]                ← ソートタブ
[全て][KATE][CANMAKE][ETUDE]...               ← ブランドピル（top_brands）
リップ ランキング — 12件
┌──────┐ ┌──────┐
│🥇1    │ │🥈2    │  ← 2列グリッド (CatalogRankingCard)
│ 画像  │ │ 画像  │
│ KATE  │ │ ETUDE │
│★4.2   │ │★3.8   │
│💄5🛒3📝8│ │💄4🛒2📝6│
└──────┘ └──────┘
     [もっと見る]
```

**B) 検索モード（クエリ 2文字以上）** — 既存の検索UIをそのまま維持

**C) 空状態** — InventoryGridSkeleton + EmptyState

**State 管理:**
- `category: CosmeCategory` — 初期値 `"リップ"`
- `brand: string | null` — 初期値 `null`
- `sort: 'have_count' | 'use_count' | 'want_count'` — 初期値 `'have_count'`
- `isSearching` = `query.trim().length >= 2`

**ソートタブ**: 3つのテキストボタン（選択中: `text-text-ink font-bold border-b-2 border-neon-accent`）
- 「所有者数順」 → `sort=have_count`
- 「活用回数順」 → `sort=use_count`（alche:me の独自性！）
- 「欲しい順」 → `sort=want_count`

**既存コンポーネント再利用:**
- `CategoryFilter` (`components/category-filter.tsx`) — 「全て」を除外するため、`categories` prop でカスタムリスト渡し or カタログ用定数で直接レンダリング
- `InventoryGridSkeleton` (`components/loading-skeleton.tsx`)
- `ItemEditSheet` — タップ→編集→保存フロー維持

---

## 変更ファイル一覧

| Batch | ファイル | 変更 |
|-------|---------|------|
| 1 | `types/catalog.ts` | 修正 — `have_count`, `want_count`, `use_count`, `total_rating`, `rating_count` |
| 1 | `lib/api/catalog-upsert.ts` | 修正 — `countType` パラメータ追加 |
| 1 | `agent/alcheme/tools/catalog_tools.py` | 修正 — `count_type` パラメータ追加 |
| 1 | `agent/alcheme/tools/suggestion_tools.py` | 修正 — `"want"` 指定 |
| 1 | `app/api/catalog/search/route.ts` | 修正 — レスポンスに新フィールド追加 |
| 2 | `lib/api/catalog-upsert.ts` | 追加 — `updateCatalogUsageStats()` ヘルパー |
| 2 | `app/api/beauty-log/route.ts` | 修正 — POST 後に `updateCatalogUsageStats()` |
| 3 | `app/api/catalog/browse/route.ts` | 新規 — ブラウズ API |
| 4 | `hooks/use-catalog-browse.ts` | 新規 — SWR Infinite hook |
| 5 | `components/catalog-ranking-card.tsx` | 新規 — ランキングカード |
| 6 | `app/(main)/add/community/page.tsx` | 修正 — カテゴリ + ソート + ランキンググリッド |

---

## 検証

```bash
npx tsc --noEmit
npx vitest run
cd agent && python -m pytest tests/ -v
```

### 手動検証
1. `/add/community` → カテゴリタブ＋ランキンググリッド表示
2. カテゴリタップ → ランキングが切り替わる
3. ソートタブ切替 → 所有者数/活用回数/欲しい の順で並び替え
4. ブランドピル → 絞り込み
5. カードに ★評価 + 💄持ってる / 🛒欲しい / 📝活用 の3指標が表示される
6. 1-3位にゴールド/シルバー/ブロンズバッジ
7. タップ → ItemEditSheet → 保存 → `/inventory` にリダイレクト
8. 検索バーに入力 → 検索モードに切り替わり
9. 検索クリア → ブラウズモードに戻る
10. 「もっと見る」→ 追加読み込み（ランキング番号連続）
11. Beauty Log 保存後 → カタログの use_count / total_rating が更新される
