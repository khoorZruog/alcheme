# Plan: UX-014 型番まとめ/展開ビュー切替

## Context

ZOZOTOWN のように、同じ型番（brand + product_name）の商品を「まとめて表示」と「展開して表示」を切り替えられるようにする。
現在は「まとめモード」のみ（`ProductGroupCard` で N色バッジ → タップで `VariantSheet`）。
展開モードを追加することで、色違い商品を個別に一覧でき、品番単位の一括操作もスムーズになる。

---

## Batch 1: Hook — `groupMode` 状態追加

### `hooks/use-inventory.ts` (修正)

**追加する state:**
```typescript
const [groupMode, setGroupMode] = useState<"grouped" | "expanded">(() => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("inventory-group-mode") as "grouped" | "expanded") || "grouped";
  }
  return "grouped";
});
```

**`gridEntries` の修正** (L170-242):

```typescript
const gridEntries = useMemo(() => {
  // 展開モード: グルーピングなし、全アイテムを "single" で返す
  if (groupMode === "expanded") {
    const entries: GridEntry[] = filteredItems.map((item) => ({
      type: "single" as const,
      item,
    }));
    // ソートロジック（既存の sortBy 対応）
    entries.sort(/* 既存のソートロジックを single 用に適用 */);
    return entries;
  }

  // まとめモード: 既存のグルーピングロジックそのまま
  // ... (現在のコードを維持)
}, [filteredItems, sortBy, groupMode]);
```

**返却値に追加:**
```typescript
return { ..., groupMode, setGroupMode };
```

---

## Batch 2: View — 切替トグル追加

### `app/(main)/inventory/_components/inventory-have-view.tsx` (修正)

**hook から `groupMode`, `setGroupMode` を取得:**
```typescript
const { ..., groupMode, setGroupMode } = useInventory();
```

**ツールバーに切替ボタン追加** (L163 付近、`viewMode` トグルの隣):

既存: `[Grid/List] [Select] [Filter] [Search] [Add]`
変更: `[まとめ/展開] [Grid/List] [Select] [Filter] [Search] [Add]`

```tsx
<button
  onClick={toggleGroupMode}
  className="... (既存のツールバーボタンスタイル)"
  aria-label={groupMode === "grouped" ? "展開表示" : "まとめ表示"}
>
  {groupMode === "grouped"
    ? <Layers className="h-3.5 w-3.5" />
    : <LayoutGrid className="h-3.5 w-3.5" />}
</button>
```

`toggleGroupMode` コールバック:
```typescript
const toggleGroupMode = useCallback(() => {
  setGroupMode((prev) => {
    const next = prev === "grouped" ? "expanded" : "grouped";
    localStorage.setItem("inventory-group-mode", next);
    return next;
  });
}, [setGroupMode]);
```

**import に `Layers` を追加** (lucide-react)

---

## 変更ファイル一覧

| Batch | ファイル | 変更 |
|-------|---------|------|
| 1 | `hooks/use-inventory.ts` | `groupMode` state + `gridEntries` の条件分岐 |
| 2 | `app/(main)/inventory/_components/inventory-have-view.tsx` | ツールバーに切替ボタン追加 |

---

## 検証

```bash
npx tsc --noEmit
npx vitest run
```

### 手動検証
1. My Cosme ページ → ツールバーに「まとめ/展開」切替ボタン表示
2. まとめモード（デフォルト）→ 同一型番が `ProductGroupCard` でまとまる（従来動作）
3. 展開ボタンタップ → 全商品が個別 `CosmeCard` / `CosmeListItem` で表示される
4. 色違い商品がそれぞれ別カードとして表示される
5. グリッド/リスト切替が両モードで動作
6. ソート・フィルターが両モードで正常動作
7. 展開モード + 選択モード → 個別アイテムを選択 → 一括削除/残量更新
8. まとめモード + 選択モード → グループ単位で選択（従来動作）
9. ブラウザリロード → 選択したモードが保持される（localStorage）
