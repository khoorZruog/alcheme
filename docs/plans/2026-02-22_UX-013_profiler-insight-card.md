# Plan: UX-013 プロファイラー結果のインタラクティブカードUI

## Context

「眠ってるコスメ活用」チップでプロファイラーを呼び出すと、結果が長文テキストとして返される。色の傾向、テクスチャ、眠っているコスメなどすべてプレーンテキスト。ユーザーはこれをインタラクティブなカードUIにしたいと要望。

既存のカードパターン（`recipe_card`, `product_card`, `technique_card`）と同じ SSE → ChatMessage → Component アーキテクチャに乗せる。

---

## Batch 1: Backend — profiler_tools.py 拡張

### `agent/alcheme/tools/profiler_tools.py`

`underused_items` を `list[str]` から `list[dict]` に拡張（item ID を含める）:

```python
# 現在: underused_items.append(f"{brand} {name}".strip())
# 変更後:
underused_items.append({
    "id": item_id,
    "brand": brand,
    "product_name": name,
    "category": item.get("category", ""),
    "item_type": item.get("item_type", ""),
})
```

戻り値の `underused_items` キーの型が `list[dict]` に変わる（8件まで）。

---

## Batch 2: Backend — server.py に profiler_card SSE 追加

### `agent/server.py`

**a) `_CARD_TOOLS` に追加:**
```python
_CARD_TOOLS: dict[str, str] = {
    "analyze_product_compatibility": "product_card",
    "compare_products_against_inventory": "product_card",
    "get_substitution_technique": "technique_card",
    "analyze_preference_history": "profiler_card",  # ← 追加
}
```

**b) `_extract_card_events_from_event()` に profiler_card ブランチ追加:**
```python
elif card_type == "profiler_card":
    results.append({
        "type": "profiler_card",
        "data": {
            "color_preferences": data_dict.get("color_preferences", {}),
            "texture_preferences": data_dict.get("texture_preferences", {}),
            "area_frequency": data_dict.get("area_frequency", {}),
            "average_satisfaction": data_dict.get("average_satisfaction"),
            "monotony_alert": data_dict.get("monotony_alert"),
            "underused_items": data_dict.get("underused_items", []),
        },
    })
```

---

## Batch 3: Backend — profiler プロンプト短縮

### `agent/alcheme/prompts/profiler.py`

出力フォーマットを短縮。カードが詳細を表示するため、テキストは1-2行の要約のみにする:

```
## 出力フォーマット

分析カードが自動生成されるので、テキストは**簡潔な要約（2-3文）**にとどめてください。
カードが表示する内容（色傾向・テクスチャ・眠っているコスメ等）は繰り返さないこと。

例:
「最近はピンク系のメイクを楽しまれていますね！眠っているコスメも見つかったので、活用アイデアをカードにまとめました✨」
```

---

## Batch 4: Frontend — 型定義 + SSE ハンドリング

### `types/chat.ts`

```typescript
/** プロファイラー分析カード — 眠っているコスメ詳細 */
export interface DormantItemData {
  id: string;
  brand: string;
  product_name: string;
  category: string;
  item_type: string;
}

/** プロファイラーカードデータ */
export interface ProfilerCardData {
  color_preferences: Record<string, number>;
  texture_preferences: Record<string, number>;
  area_frequency: Record<string, number>;
  average_satisfaction: number | null;
  monotony_alert: {
    dominant: string;
    ratio: number;
    message: string;
  } | null;
  underused_items: DormantItemData[];
}

// ChatMessage に追加:
export interface ChatMessage {
  // ... 既存フィールド
  profiler_card?: ProfilerCardData;  // ← 追加
}

// SSEEventType に追加:
export type SSEEventType =
  | // ... 既存
  | "profiler_card";  // ← 追加
```

### `hooks/use-chat.ts`

technique_card と同じパターンで `profiler_card` ハンドラ追加:

```typescript
// 変数宣言追加
let finalProfilerCard: ChatMessage["profiler_card"] | undefined;

// processLine 内
} else if (event.type === "profiler_card") {
  const cardData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  finalProfilerCard = cardData;
  setMessages((prev) =>
    prev.map((m) => m.id === assistantId ? { ...m, profiler_card: cardData } : m)
  );
}

// メッセージ保存時に追加
profiler_card: finalProfilerCard,
```

---

## Batch 5: Frontend — ProfilerInsightCard コンポーネント

### `components/profiler-insight-card.tsx` (新規)

カードレイアウト:

```
┌─────────────────────────────────────┐
│ ✨ ビューティープロフィール           │
├─────────────────────────────────────┤
│ 💄 色の傾向                          │
│ [ピンク系 ■■■■■] [ブラウン系 ■■■]   │
│ (プログレスバー or カラーバッジ)       │
│                                     │
│ 🌟 テクスチャ                        │
│ [マット] [ツヤ] [ラメ] (チップ形式)   │
│                                     │
│ ⚠️ マンネリ注意 (条件付き表示)      │
│ 「ピンク系が70%超。他の色も試して」   │
├─────────────────────────────────────┤
│ 🎁 眠っているコスメ (N個)            │
│ ┌──────────────────────────────────┐│
│ │ IPSA ザ・タイムR アクア           ││
│ │ スキンケア                        ││
│ │        [このコスメでレシピ →]     ││
│ └──────────────────────────────────┘│
│ ┌──────────────────────────────────┐│
│ │ LANCOME ジェニフィック...         ││
│ │ スキンケア                        ││
│ │        [このコスメでレシピ →]     ││
│ └──────────────────────────────────┘│
└─────────────────────────────────────┘
```

Props:
```typescript
interface ProfilerInsightCardProps {
  data: ProfilerCardData;
  onSelectItemForRecipe: (itemId: string, itemName: string) => void;
}
```

**色の傾向**: `color_preferences` の各エントリをプログレスバー（max 値に対する比率）で表示。カテゴリごとの色を使用:
- ピンク系 → pink-400
- ブラウン系 → amber-700
- オレンジ系 → orange-400
- レッド系 → red-500
- パープル系 → purple-500
- ヌード系 → stone-400

**テクスチャ**: チップ/バッジ形式。数値が多い順にソート。

**マンネリ注意**: `monotony_alert` が null でない場合のみ表示。amber 背景の注意カード。

**眠っているコスメ**: 各アイテムをカード形式で。「このコスメでレシピを作る」ボタン付き。

---

## Batch 6: Frontend — chat-message.tsx 統合 + アクション

### `components/chat-message.tsx`

technique_card の直後に profiler_card レンダリング追加:

```tsx
{message.profiler_card && (
  <div className="mt-4">
    <ProfilerInsightCard
      data={message.profiler_card}
      onSelectItemForRecipe={(itemId, itemName) =>
        onSendMessage?.(`このコスメを使ったメイクを提案して`, /* pass item */)
      }
    />
  </div>
)}
```

### `app/(main)/chat/page.tsx`

`onSelectItemForRecipe` ハンドラ: アイテムを `selectedItems` に追加してメッセージを送信:

```typescript
const handleSelectItemForRecipe = useCallback(
  (itemId: string, itemName: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (item) {
      addSelectedItems([item]);
      sendMessage(`「${itemName}」を使ったメイクを提案して`);
    }
  },
  [inventoryItems, addSelectedItems, sendMessage]
);
```

ChatMessage に `onSelectItemForRecipe` props を渡す。

---

## 変更ファイル一覧

| Batch | ファイル | 変更 |
|-------|---------|------|
| 1 | `agent/alcheme/tools/profiler_tools.py` | `underused_items` を dict 形式に拡張 |
| 2 | `agent/server.py` | `_CARD_TOOLS` + `_extract_card_events_from_event` に profiler_card 追加 |
| 3 | `agent/alcheme/prompts/profiler.py` | テキスト出力を簡潔な要約に短縮 |
| 4 | `types/chat.ts` | `ProfilerCardData`, `DormantItemData` 型追加, ChatMessage 拡張 |
| 4 | `hooks/use-chat.ts` | `profiler_card` SSE ハンドリング |
| 5 | `components/profiler-insight-card.tsx` | 新規カードコンポーネント |
| 6 | `components/chat-message.tsx` | profiler_card レンダリング追加 |
| 6 | `app/(main)/chat/page.tsx` | `handleSelectItemForRecipe` + ChatMessage props |

---

## 検証

```bash
npx tsc --noEmit           # 型チェック
npx vitest run             # フロントエンドテスト
cd agent && python -m pytest tests/ -v  # Agent テスト
```

### 手動検証
- 「眠ってるコスメ活用」→ プロファイラーカードが表示される（テキストは簡潔な要約のみ）
- カード内の色傾向がプログレスバーで可視化
- テクスチャがチップ形式で表示
- マンネリアラートが条件付きで表示
- 眠っているコスメがカード形式で表示
- 「このコスメでレシピを作る」→ アイテムが選択状態になりレシピ生成が開始
