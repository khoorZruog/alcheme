# FEAT-002: カテゴリ/ブランドビュー切替 — 実装計画

| | |
|---|---|
| **Date** | 2026-02-19 |
| **Status** | ✅ 完了 |
| **Related** | `docs/plans/backlog_and_remaining_tasks.md` FEAT-002, Phase 2.5A Batch 9 |

## Context

My Cosme（在庫一覧）の「持ってる」タブは現在フラットなグリッド/リスト表示で、カテゴリフィルタ（横スクロールpill）で絞り込む方式。LIPS アプリのランキング画面を参考に、**フィルタチップ強化型**でカテゴリ/ブランド切替を実装。

### LIPS パターンのポイント
- Level 1: カテゴリタブ（横スクロール）で大分類を選択
- Level 2: サブカテゴリチップ（アイコン付き横スクロール）で細分類
- フラットなカード表示を維持（アコーディオンは使わない）
- ユーザーの在庫規模（20-80アイテム）に対して軽量で見やすい

---

## UI設計

### 変更後の構造
```
[カテゴリ | ブランド]  ← 切替トグル（セグメントコントロール）

─── カテゴリモード選択時 ───
Level 1: [全て] [ベースメイク] [アイメイク] [リップ] [スキンケア] [その他]
Level 2: [アイシャドウ] [アイライナー] [マスカラ] [アイブロウ]  ← カテゴリ選択時のみ表示（item_type チップ）

─── ブランドモード選択時 ───
Level 1: [全て] [CANMAKE] [KATE] [Dior] [SUQQU] [MAC] ...
（Level 2 なし — ブランド選択でフラットに絞り込み）
```

### 切替トグル
- ツールバー左端に配置、Level 1 pills の上
- セグメントコントロール（pill shape）: `カテゴリ | ブランド`
- アクティブ側: `bg-text-ink text-white shadow-sm`、非アクティブ側: `text-text-muted`

### Level 2 サブカテゴリチップ
- `filterMode === "category" && filter !== "全て" && itemTypes.length > 1` の時のみ表示
- `item_type` フィールドから動的に生成
- 横スクロール、neon-accent カラーで区別

---

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `hooks/use-inventory.ts` | `FilterMode` type, `filterMode`/`setFilterMode`, `itemTypeFilter`/`setItemTypeFilter`, `itemTypes` 追加。フィルタロジック・activeFilterCount 拡張 |
| `app/(main)/inventory/_components/inventory-have-view.tsx` | 切替トグル UI + Level 1 条件分岐 + Level 2 チップ行 + フィルタシート調整 + active filter badges 拡張 |

新規ファイル: なし

---

## 状態遷移

### カテゴリモード → ブランドモード切替時
- `filter` (category) → "全て"
- `itemTypeFilter` → "全て"
- `brandFilter` は維持

### ブランドモード → カテゴリモード切替時
- `brandFilter` → "全て"
- `filter` (category) は維持

### localStorage 永続化
- `inventory-filter-mode`: `"category" | "brand"` — デフォルト `"category"`

---

## 検証結果

- `npx tsc --noEmit` — エラーなし
- `npx vitest run` — 127/127 テスト全パス
