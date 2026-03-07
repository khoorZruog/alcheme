# コスメ指定レシピ提案 + AI プロアクティブ提案

## Context

現在のチャットフローでは、レシピ生成時にユーザーが「使いたいコスメ」を指定する手段がない。Alchemist は在庫全体から自動選定するのみ。

**ユーザーのニーズ:**
- 新しく買ったコスメを使いたい
- もうすぐなくなるコスメを使い切りたい
- ダブったコスメを消費したい

**AI プロアクティブ提案:**
- 最近入手したが未使用のコスメ
- 長期間使われていないコスメ（眠りコスメ）
- 使用期限が迫っているコスメ（PAO ベース）
- 重複しているコスメ
- 残量が少ないが頻繁に使うコスメ

**前提**: 販売を見据えた本番品質。トランジェントな仮実装は避ける。

---

## Batch 1: データ分析レイヤー

### `lib/cosme-usage-insights.ts`（新規）

在庫 + ビューティログからインサイトを算出する純粋関数群。

```typescript
import type { InventoryItem } from "@/types/inventory";
import type { BeautyLogEntry } from "@/types/beauty-log";
import { ITEM_TYPE_PAO, getPaoMonths } from "@/lib/cosme-constants";

export type InsightType = "new_unused" | "dormant" | "expiring" | "duplicate" | "low_remaining";

export interface CosmeInsight {
  type: InsightType;
  item: InventoryItem;
  label: string;        // "最近入手・未使用" etc.
  description: string;  // "2日前に登録、まだ使っていません"
  priority: number;     // 1(高) - 5(低)
}
```

**分析ロジック:**

| InsightType | 条件 | priority |
|---|---|---|
| `new_unused` | `created_at` が14日以内 & ビューティログの `used_items` に一度も登場しない | 1 |
| `expiring` | `open_date` + PAO 月数 が30日以内に到来 | 1 |
| `low_remaining` | `estimated_remaining` が "20%" 以下 & 過去14日間に3回以上使用 | 2 |
| `dormant` | 最終使用日が30日以上前（ログから逆算） | 3 |
| `duplicate` | 同じ `product_id`（or brand+product_name）を2つ以上所持 | 4 |

**関数:**
- `computeCosmeInsights(items: InventoryItem[], logs: BeautyLogEntry[]): CosmeInsight[]`
  - 全アイテムに5種のチェックを適用、priority 昇順でソート、最大10件を返す
- `getLastUsedDate(itemId: string, logs: BeautyLogEntry[]): string | null`
  - ビューティログの `used_items` 配列からアイテムの最終使用日を逆引き
- `isExpiringSoon(item: InventoryItem, thresholdDays?: number): boolean`
  - `open_date` + PAO → 期限チェック（`ITEM_TYPE_PAO` 活用）

**再利用する既存コード:**
- [cosme-constants.ts](lib/cosme-constants.ts) — `ITEM_TYPE_PAO`, `getPaoMonths()`
- [beauty-log-analytics.ts](lib/beauty-log-analytics.ts) — 既存の週次分析パターンを参考にする

### `hooks/use-cosme-insights.ts`（新規）

```typescript
export function useCosmeInsights(): {
  insights: CosmeInsight[];
  isLoading: boolean;
}
```

- SWR で `/api/inventory` + `/api/beauty-log` をフェッチ（既存エンドポイント）
- `computeCosmeInsights()` を `useMemo` で算出
- ビューティログは直近90日分のみ（パフォーマンス）

---

## Batch 2: コスメピッカー UI

### `components/cosme-picker-sheet.tsx`（新規）

ボトムシートで在庫アイテムをマルチ選択するコンポーネント。

- **UI**: Sheet（`@/components/ui/sheet`）→ カテゴリタブ → アイテムリスト → チェックマーク選択
- カテゴリタブ: `CATEGORY_GROUPS` から動的生成（ベースメイク / アイメイク / リップ / スキンケア / その他）
- 各アイテム行: `[画像] [ブランド + 商品名 + 色] [✓]`
- 選択制限: 最大5アイテム
- 確定ボタン → `onConfirm(selectedItems: InventoryItem[])` コールバック

```typescript
interface CosmePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (items: InventoryItem[]) => void;
  maxSelection?: number; // default: 5
}
```

**再利用:** `useInventory` フック（既存）の `items` を活用。

### `components/cosme-picker-chip.tsx`（新規）

選択済みアイテムをチャット入力の上にチップ表示するコンポーネント。

```typescript
interface CosmePickerChipProps {
  items: InventoryItem[];
  onRemove: (itemId: string) => void;
  onAdd: () => void; // ピッカーシートを開く
}
```

- 横スクロール可能なチップ列
- 各チップ: `[ブランド名 / 商品名] ×`（削除ボタン付き）
- 末尾に `+` ボタン（追加選択用）
- 0件の場合は非表示

### `components/chat-input.tsx`（修正）

- Props 追加: `selectedItems?: InventoryItem[]`, `onOpenPicker?: () => void`, `onRemoveItem?: (id: string) => void`
- チップ表示エリアを入力欄の上部に配置
- 画像添付ボタンの隣に「コスメ選択」ボタン追加（Package アイコン）
- `onSend` signature 拡張: `onSend(text, imageBase64?, imageMimeType?, selectedItemIds?: string[])`

### `hooks/use-chat.ts`（修正）

- `selectedItems` state 追加（`useState<InventoryItem[]>([])`）
- `sendMessage` を拡張: `selected_item_ids` を POST body に含める
- 送信後 `setSelectedItems([])` でクリア
- 戻り値に `selectedItems`, `setSelectedItems`, `addSelectedItems`, `removeSelectedItem` を追加

### `app/(main)/chat/page.tsx`（修正）

- `cosmePickerOpen` state 追加
- `<CosmePickerSheet>` レンダリング
- `ChatInput` に `selectedItems`, `onOpenPicker`, `onRemoveItem` を接続

---

## Batch 3: API + Agent 連携

### `types/chat.ts`（修正）

```typescript
export interface ChatRequest {
  message: string;
  image_base64?: string;
  image_mime_type?: string;
  user_id: string;
  selected_item_ids?: string[];  // ← 追加
}
```

### `app/api/chat/route.ts`（修正）

- `body` から `selected_item_ids` を抽出
- `callAgentStream('/chat', { ..., selected_item_ids })` に転送

### `agent/server.py`（修正）

**ChatRequest モデル拡張:**
```python
class ChatRequest(BaseModel):
    message: str
    user_id: str
    session_id: str | None = None
    image_base64: str | None = None
    image_mime_type: str | None = None
    selected_item_ids: list[str] | None = None  # ← 追加
```

**chat エンドポイント修正:**
- `selected_item_ids` が存在する場合:
  1. Firestore から該当アイテムの詳細情報を取得（`users/{userId}/inventory/{itemId}` + `users/{userId}/products/{productId}`）
  2. セッション state に `app:selected_items` として保存
  3. ユーザーメッセージのテキストの先頭にシステム指示を追加:
     ```
     [SYSTEM: ユーザーが以下のコスメを指定しました。レシピに必ず含めてください。]
     - {brand} {product_name} ({color_name}, {item_type})
     - ...
     [/SYSTEM]
     {元のメッセージ}
     ```

### `agent/alcheme/prompts/alchemist.py`（修正）

Alchemist システムプロンプトに以下を追加:

```
## コスメ指定リクエスト

ユーザーが特定のコスメを指定した場合（メッセージに [SYSTEM: ユーザーが以下のコスメを指定しました] がある場合）:
1. 指定されたコスメを**必ず**レシピに含めること
2. 指定コスメを中心に、在庫の他のアイテムで組み合わせを構成
3. 指定コスメの色味・テクスチャと相性の良いアイテムを優先
4. match_score は指定コスメの活用度を重視して算出
```

### `agent/alcheme/prompts/concierge.py`（修正）

ルーティングルールに追加:
```
### → alchemist_agent に委譲（コスメ指定あり）
- メッセージに [SYSTEM: ユーザーが以下のコスメを指定しました] が含まれる場合
- おまかせテーマ提案は**スキップ**し、直接 alchemist_agent に委譲
```

---

## Batch 4: プロアクティブ提案 UI

### `components/cosme-insights-card.tsx`（新規）

チャットグリーティングエリアに表示するインサイトカード。

- 横スクロール可能なミニカード列（`BeautyStoriesTray` と同じパターン）
- 各カード: `[アイコン] [ラベル] [ブランド+商品名]`
- タップ → そのコスメを `selectedItems` に追加 + 「このコスメを使ったメイクを提案して」をチャット入力にプリセット
- InsightType 別アイコン/カラー:
  | type | アイコン | 色 | ラベル |
  |---|---|---|---|
  | `new_unused` | Sparkles | blue | 新しく入手 |
  | `dormant` | Moon | purple | しばらく未使用 |
  | `expiring` | Clock | orange | 期限まもなく |
  | `duplicate` | Copy | pink | ダブり |
  | `low_remaining` | Battery | red | 残りわずか |

### `app/(main)/chat/page.tsx`（修正）

- `useCosmeInsights()` フック接続
- `<CosmeInsightsCard>` を `<BeautyStoriesTray>` の下に配置
- `onInsightTap` ハンドラ: コスメ選択 + 入力テキストプリセット

---

## Batch 5: テスト + ドキュメント

### テスト
- `__tests__/unit/lib/cosme-usage-insights.test.ts` — 5種のインサイト算出ロジック
- `__tests__/unit/hooks/use-cosme-insights.test.ts` — SWR + useMemo 統合
- `__tests__/unit/components/cosme-picker-sheet.test.tsx` — 選択 / 制限 / 確定
- `__tests__/unit/components/cosme-insights-card.test.tsx` — レンダリング + タップ

### ドキュメント
- `docs/plans/2026-02-22_FEAT-cosme-specification.md` — 本計画書
- `docs/plans/backlog_and_remaining_tasks.md` — ステータス更新

---

## 変更ファイル一覧

### 新規 (8)
| ファイル | 説明 |
|---------|------|
| `lib/cosme-usage-insights.ts` | インサイト算出ロジック（純粋関数） |
| `hooks/use-cosme-insights.ts` | インサイトフック（SWR + useMemo） |
| `components/cosme-picker-sheet.tsx` | マルチ選択ボトムシート |
| `components/cosme-picker-chip.tsx` | 選択済みチップ表示 |
| `components/cosme-insights-card.tsx` | プロアクティブ提案カード |
| テスト 4 ファイル | 上記参照 |

### 既存修正 (7)
| ファイル | 変更内容 |
|---------|---------|
| `types/chat.ts` | `ChatRequest` に `selected_item_ids` 追加 |
| `components/chat-input.tsx` | コスメ選択ボタン + チップ表示エリア |
| `hooks/use-chat.ts` | `selectedItems` state + 送信時転送 |
| `app/(main)/chat/page.tsx` | ピッカー + インサイトカード統合 |
| `app/api/chat/route.ts` | `selected_item_ids` 転送 |
| `agent/server.py` | `ChatRequest` 拡張 + Firestore 取得 + システム指示注入 |
| `agent/alcheme/prompts/alchemist.py` | コスメ指定ルール追加 |
| `agent/alcheme/prompts/concierge.py` | コスメ指定時ルーティングルール追加 |

---

## 検証手順

1. `npx tsc --noEmit` — 型エラーなし
2. `npx vitest run` — 全テストパス
3. `cd agent && python -m pytest tests/ -v` — Python テストパス
4. 手動検証:
   - ChatInput のコスメ選択ボタンタップ → ピッカーシート開く
   - カテゴリタブ切替 → アイテム表示
   - アイテム選択（最大5件制限動作） → 確定
   - チャット入力上にチップ表示 → × で個別削除 → + で追加
   - メッセージ送信 → Alchemist が指定コスメを必ず含んだレシピ生成
   - グリーティングエリアにインサイトカード表示
   - インサイトカードタップ → コスメ選択 + テキストプリセット
