# スキャン画像問題 + 鑑定保留中の在庫表示バグ修正

| | |
|---|---|
| **Date** | 2026-03-07 |
| **Status** | **✅ 完了** |

## Issue 1: 楽天画像がスキャン登録で使われる

### 根本原因

`app/(main)/scan/page.tsx` L74 のフォールバック順序:
```typescript
image_url: item.image_url || item.rakuten_image_url || scanImages[0]
```
`rakuten_image_url`（EC画像: 送料無料ロゴ付き）がユーザーのスキャン画像より優先されていた。結果:
- `confirm/route.ts` の `startsWith('data:')` チェックが通らず AI加工がスキップ
- 楽天画像がそのまま商品画像として保存

### 修正

フォールバック順序を変更: ユーザーのスキャン画像を最優先
```typescript
image_url: scanImages[0] || item.image_url || undefined,
```

---

## Issue 2: 鑑定保留中に重複警告が表示される

### 根本原因

`ItemEditSheet` が `useInventory()` で Firestore 全在庫を取得し、`useDuplicateCheck` で鑑定中アイテムと比較。鑑定保留中の文脈では不要な警告。

### 修正

`ItemEditSheet` に `skipDuplicateCheck?: boolean` prop を追加。鑑定確認画面では `skipDuplicateCheck` を有効にし、重複チェックに空配列を渡してスキップ。

---

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `app/(main)/scan/page.tsx` | L74: image_url フォールバック順序修正 |
| `components/item-edit-sheet.tsx` | `skipDuplicateCheck` prop 追加 |
| `app/(main)/scan/confirm/page.tsx` | `ItemEditSheet` に `skipDuplicateCheck` 追加 |

## 検証

- 335 テスト全パス
