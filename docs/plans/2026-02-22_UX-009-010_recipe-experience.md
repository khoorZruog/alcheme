# UI改善: レシピカスタマイズをCosmePickerSheetに統合（スライダー + ブランド指定）

## Context

チャット入力欄の上にフローティング表示されている「手持ちだけ / 手持ち優先 / 自由にコーデ」のラベルが直感的でなく、UIの位置も邪魔。また、ブランド指定UIが存在しない。

**方針**:
1. CosmePickerSheet（📦アイコンで開くシート）に **レシピスタイルスライダー** と **ブランド指定** を統合
2. 3つの離散ボタンではなく、**スライダー** で「持ってるコスメ活用」⇔「新しい自分発見」を直感的に選ばせる
3. ChatInput のフローティングチップは削除

---

## 設計

### スライダーUI

```
持ってるコスメ活用 ──●──────────── 新しい自分発見
   いつものポーチで     もっと理想に    理想のルック
    サッとメイク        近づける        を追求
```

- 3段階スナップポイント（内部では owned_only / prefer_owned / free にマッピング）
- 現在位置に応じたサブテキスト表示:
  - 左: 「手持ちだけでサッとメイク」
  - 中: 「手持ち中心 + 買い足し提案つき」
  - 右: 「理想の仕上がりを設計。不足分は代用テク + 買い足し提案」

### CosmePickerSheet の拡張レイアウト

```
┌─── レシピカスタマイズ ──────────────────┐
│                                          │
│ 持ってるコスメ活用 ──●──── 新しい自分発見│
│   「手持ちだけでサッとメイク」            │
│                                          │
│ ブランド指定 (任意)                       │
│ [KATE] [CANMAKE] [EXCEL] [rom&nd] ...   │
│                                          │
│ ── 使いたいコスメ (最大5個) ──────────── │
│ [ベースメイク] [アイメイク] [リップ] ...  │
│ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │ item │ │ item │ │ item │              │
│ └──────┘ └──────┘ └──────┘              │
│                                          │
│         [ 決定 ]                         │
└──────────────────────────────────────────┘
```

### ChatInput 上のサマリーチップ

デフォルト以外の設定がある場合のみ表示:
```
[ 新しい自分発見 × ] [ KATE × ] [ CANMAKE クリームチーク × ] [ + ]
```

---

## 修正ファイル

| # | ファイル | 操作 |
|---|---------|------|
| 1 | `components/cosme-picker-sheet.tsx` | **拡張**: スライダー + ブランドチップ追加 |
| 2 | `components/chat-input.tsx` | **削除**: フローティングモードチップ削除 + ブランドサマリー追加 |
| 3 | `components/cosme-picker-chip.tsx` | **拡張**: モード・ブランドのサマリーチップ追加 |
| 4 | `hooks/use-chat.ts` | **追加**: `selectedBrands` state + sendMessage パラメータ |
| 5 | `app/(main)/chat/page.tsx` | **ワイヤリング** |
| 6 | `app/api/chat/route.ts` | **パススルー**: `selected_brands` |
| 7 | `agent/server.py` | **ディレクティブ**: `selected_brands` + `ChatRequest` field |

---

## 実装手順

### Step 1: `hooks/use-chat.ts` — selectedBrands state

- `selectedBrands: string[]` state 追加
- `sendMessage` に `brands?: string[]` パラメータ追加
- fetch body に `selected_brands` 追加
- 送信後リセット

### Step 2: `components/cosme-picker-sheet.tsx` — 統合シート

Props 拡張:
```typescript
matchMode?: MatchMode;
onMatchModeChange?: (mode: MatchMode) => void;
brands?: string[];
selectedBrands?: string[];
onBrandsChange?: (brands: string[]) => void;
```

レイアウト:
1. SheetTitle を「レシピカスタマイズ」に変更
2. **スライダー**: `<input type="range" min={0} max={2} step={1}>` をスタイリング。値 0/1/2 → `owned_only/prefer_owned/free`。スナップ動作。両端のラベル「持ってるコスメ活用」「新しい自分発見」。現在値に応じたサブテキスト
3. **ブランドチップ**: 在庫から `useMemo` で抽出。横スクロール。タップでトグル。複数選択可
4. ブランド選択時、アイテムリストをそのブランドで追加絞り込み
5. 確定ボタン: コスメ0個でもモードやブランドだけで決定可能に

### Step 3: `components/chat-input.tsx` — フローティングチップ削除

- `MATCH_MODE_OPTIONS` 定数とマッチモードセレクター `<div>` ブロック全体を削除
- `matchMode` / `onMatchModeChange` の props は残す（handleSend で使用）
- `selectedBrands` / `onRemoveBrand` / `onResetMode` props 追加 → CosmePickerChip に伝搬

### Step 4: `components/cosme-picker-chip.tsx` — サマリーチップ拡張

Props 追加:
```typescript
matchMode?: MatchMode;
selectedBrands?: string[];
onRemoveBrand?: (brand: string) => void;
onResetMode?: () => void;
```

表示順: モードチップ（非デフォルト時）→ ブランドチップ → コスメチップ → +ボタン

スライダー位置に対応するモードチップラベル:
- 中央: 「もっと理想に近づける」
- 右: 「新しい自分発見」

### Step 5: `app/(main)/chat/page.tsx` — ワイヤリング

- `useInventory` の `items` からブランドリストを `useMemo` で算出
- `useChat` から `selectedBrands, setSelectedBrands` を取得
- CosmePickerSheet に全 props を渡す
- ChatInput / CosmePickerChip にサマリー用 props を渡す

### Step 6: BFF + Agent — ブランド指定パススルー

`app/api/chat/route.ts`:
```typescript
const { ..., selected_brands } = body;
...(selected_brands?.length ? { selected_brands } : {}),
```

`agent/server.py`:
```python
selected_brands: list[str] | None = None
# ディレクティブ注入:
if req.selected_brands:
    brands_str = "、".join(req.selected_brands)
    brand_directive = f"[SYSTEM: ユーザーが以下のブランドを指定しました。可能な限りこれらのブランドのアイテムを使用してレシピを作成してください。]\n{brands_str}\n[/SYSTEM]\n"
    message_text = brand_directive + message_text
```

---

## Verification

1. `npx tsc --noEmit` — 型エラーなし
2. `npx vitest run` — 全テストパス
3. 手動確認:
   - ChatInput のフローティングモードチップが消えている
   - 📦アイコンタップ → 「レシピカスタマイズ」シートが開く
   - シート上部にスライダー（3段階スナップ）+ 位置に応じたサブテキスト
   - ブランドチップ一覧（在庫から抽出）が表示
   - ブランド選択 → アイテムリストがそのブランドで絞り込まれる
   - 決定後、ChatInput 上にモード・ブランド・コスメのサマリーチップが表示
   - 送信時、match_mode + selected_brands がエージェントに伝わる
