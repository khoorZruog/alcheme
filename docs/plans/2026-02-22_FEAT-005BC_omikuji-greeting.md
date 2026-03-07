# FEAT-005B/C: メイクおみくじUI + チャット開始メッセージ改善

## Context

**課題**:
1. **レシピ活用が進んでいない**: ユーザーが過去に生成したレシピが蓄積されても、再利用のきっかけがない。「今日はどのレシピにしよう？」を楽しく解決したい。
2. **チャット画面の初期メッセージが静的**: 現在の `INITIAL_MESSAGE` は固定テキスト。時間帯に応じたパーソナライズがない。

**ゴール**:
- FEAT-005B: 保存済みレシピの中から天気・お気に入り・直近の評価をスコアリングし、おみくじ風演出で1つ提案する。全て使い切った場合は新規レシピ生成フローへ接続。
- FEAT-005C: `INITIAL_MESSAGE` を時間帯に応じて動的化 + QuickActionChips に「今日のメイクおみくじ」チップを追加

**制約**: おみくじのスコアリングは BFF のみで完結（agent server 不要）。Firestore の既存レシピデータを使う。

**設計判断**:
- ChatGreeting は現在のテキスト表示をそのまま維持（CTA カードは追加しない）。既にチャットホーム画面は BeautyTodayCard + StoriesTray + CosmeInsightsCard + ChatGreeting + QuickActionChips で情報量が多いため。
- QuickActionChips に「おまかせ提案」（AI新規生成）と「今日のメイクおみくじ」（既存レシピ再発見）の両方を残す（計6チップ）。目的が異なるため共存。
- おみくじ結果で「別のレシピを引く」で使い切った場合 → 「新しいレシピを作る」ボタン → チャットメッセージ送信でAI新規生成フローに接続。

---

## Batch 1: FEAT-005C — 動的 INITIAL_MESSAGE + おみくじチップ追加

### `hooks/use-chat.ts`（修正）

`INITIAL_MESSAGE` を時間帯に応じた動的メッセージに変更。

```typescript
function getInitialMessage(): ChatMessage {
  const hour = new Date().getHours();
  let content: string;
  if (hour < 11) {
    content = "おはようございます！✨ 今日はどんなメイクにしましょうか？";
  } else if (hour < 17) {
    content = "こんにちは！✨ メイクの相談、いつでもどうぞ！";
  } else {
    content = "こんばんは！✨ 明日のメイクを一緒に考えましょうか？";
  }
  return {
    id: "welcome",
    role: "assistant",
    content,
    created_at: new Date().toISOString(),
  };
}
```

- 定数 `INITIAL_MESSAGE` → 関数 `getInitialMessage()` に変更
- 使用箇所 (3箇所: `useState([INITIAL_MESSAGE])`, `loadConversation`, `startNewConversation`) を `getInitialMessage()` に更新

### `components/quick-action-chips.tsx`（修正）

「今日のメイクおみくじ」チップを追加（既存チップは全て維持、計6チップ）:

```typescript
const CHIPS: ChipDef[] = [
  { text: "メイクテーマ提案", emoji: "🎨", action: "theme" },
  { text: "今日のメイクおみくじ", emoji: "🎯", action: "omikuji" },  // NEW
  { text: "おまかせ提案", emoji: "✨" },
  { text: "手持ちコスメで新しい組み合わせ", emoji: "💄" },
  { text: "眠ってるコスメ活用", emoji: "🔍" },
  { text: "今日の天気に合うメイク", emoji: "🌤️" },
];
```

### `app/(main)/chat/page.tsx`（修正）

`handleChipSelect` に omikuji action を追加:

```typescript
const [omikujiOverlayOpen, setOmikujiOverlayOpen] = useState(false);

const handleChipSelect = (text: string, action?: string) => {
  if (action === "theme") {
    setThemeOverlayOpen(true);
  } else if (action === "omikuji") {
    setOmikujiOverlayOpen(true);
  } else {
    sendMessage(text);
  }
};
```

（注: RecipeOmikujiOverlay の JSX は Batch 3 で追加）

---

## Batch 2: FEAT-005B — レシピスコアリング + API

### `lib/recipe-recommendation.ts`（新規）

レシピの推薦スコアを計算する純粋関数群。

```typescript
import type { Recipe } from "@/types/recipe";

export interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  reasons: string[];  // ["天気にぴったり", "お気に入り", etc.]
}

/**
 * レシピをスコアリング（0-100点）
 * - 天気一致: +30点 (recipe.context?.weather === currentWeather)
 * - お気に入り: +20点 (recipe.is_favorite)
 * - 高評価: +20点 (feedback?.user_rating === "liked")
 * - 新しさ: +15点 (7日以内), +10点 (30日以内), +5点 (それ以外)
 * - ランダム: +0-15点 (毎回変わる楽しさ)
 */
export function scoreRecipe(
  recipe: Recipe,
  currentWeather: string | null,
): ScoredRecipe

/**
 * スコア上位からランダム重み付きで1つ選ぶ
 * - 上位3つの中からランダム選択（毎回同じにならない）
 * - excludeIds で除外可能（スキップしたレシピ）
 */
export function recommendRecipe(
  recipes: Recipe[],
  currentWeather: string | null,
  excludeIds?: string[],
): ScoredRecipe | null
```

**再利用:**
- [beauty-today-card.tsx](components/beauty-today-card.tsx) の `findRecommendedRecipe()` — 天気一致ロジックのパターン参考
- [types/recipe.ts](types/recipe.ts) — Recipe 型

### `app/api/recipes/recommend/route.ts`（新規）

```typescript
// GET /api/recipes/recommend?weather=晴れ&exclude=id1,id2
// → ユーザーの保存済みレシピを Firestore から取得
// → scoreRecipe でスコアリング → recommendRecipe で1つ選択
// → { recipe, score, reasons } を返す
// → レシピが0件 or 除外後0件の場合は { recipe: null } を返す
```

BFF のみで完結（agent server へのリクエスト不要）。
既存の [app/api/recipes/route.ts](app/api/recipes/route.ts) の Firestore クエリパターンを再利用。

---

## Batch 3: FEAT-005B — おみくじオーバーレイ UI

### `hooks/use-recipe-omikuji.ts`（新規）

```typescript
export function useRecipeOmikuji(): {
  result: ScoredRecipe | null;
  isDrawing: boolean;
  hasNoRecipes: boolean;
  allExhausted: boolean;  // 除外後にレシピがなくなった
  drawRecipe: () => Promise<void>;
  excludeAndRedraw: () => Promise<void>;
  reset: () => void;
}
```

- `drawRecipe()` → `GET /api/recipes/recommend?weather=...` → 結果を state に保存
- `excludeAndRedraw()` → 除外リストに現在の recipe.id を追加 → 再リクエスト
  - 結果が null の場合 → `allExhausted = true`
- 天気情報は navigator.geolocation → `/api/weather` → weather フィールドを取得

### `components/recipe-omikuji-overlay.tsx`（新規）

おみくじ風の全画面オーバーレイ。

```typescript
interface RecipeOmikujiOverlayProps {
  open: boolean;
  onClose: () => void;
  onRecipeSelected: (recipe: Recipe) => void;
  onRequestNewRecipe: () => void;  // 新規レシピ生成フローへ
}
```

**状態遷移:**
1. `drawing` — おみくじ演出中（2秒間）
   - 中央に大きなおみくじ棒アイコン
   - Framer Motion `animate` で回転 + scale パルスアニメーション
   - 背景はセミトランスルーセント overlay（theme-overlay と同様のパターン）
2. `reveal` — 結果表示
   - レシピ名、マッチスコア（badge）、推薦理由（reasons タグ表示）
   - プレビュー画像（あれば表示）
   - 「このレシピで始める」ボタン → `onRecipeSelected(recipe)`
   - 「別のレシピを引く 🔄」ボタン → `excludeAndRedraw()`
3. `exhausted` — 全レシピ使い切り（除外後0件）
   - 「保存済みレシピは全て試しました！」
   - **「新しいレシピを作る ✨」ボタン** → `onRequestNewRecipe()` → チャットにメッセージ送信 → AI新規生成
   - 「閉じる」ボタン
4. `empty` — 保存済みレシピが0件
   - 「まだレシピがありません」
   - **「新しいレシピを作る ✨」ボタン** → `onRequestNewRecipe()` → チャットにメッセージ送信
   - 「閉じる」ボタン

### `app/(main)/chat/page.tsx`（修正 — Batch 1 の続き）

おみくじオーバーレイを統合:

```typescript
const handleOmikujiSelected = useCallback((recipe: Recipe) => {
  setOmikujiOverlayOpen(false);
  sendMessage(`「${recipe.recipe_name}」のレシピを見せて`);
}, [sendMessage]);

const handleRequestNewRecipe = useCallback(() => {
  setOmikujiOverlayOpen(false);
  sendMessage("おまかせで新しいメイクレシピを提案して");
}, [sendMessage]);

// JSX に追加:
<RecipeOmikujiOverlay
  open={omikujiOverlayOpen}
  onClose={() => setOmikujiOverlayOpen(false)}
  onRecipeSelected={handleOmikujiSelected}
  onRequestNewRecipe={handleRequestNewRecipe}
/>
```

---

## Batch 4: テスト + ドキュメント

### `__tests__/unit/lib/recipe-recommendation.test.ts`（新規）

- 天気一致で +30 点
- お気に入りで +20 点
- 高評価で +20 点
- 新しいレシピが高スコア
- excludeIds で除外されること
- レシピ 0 件で null を返すこと
- 全除外後に null を返すこと

### `__tests__/unit/components/recipe-omikuji-overlay.test.tsx`（新規）

- drawing 状態のローディング表示
- 結果表示でレシピ名が表示されること
- 「別のレシピを引く」ボタンクリック
- レシピなし（empty）状態の表示
- 全使い切り（exhausted）状態で「新しいレシピを作る」ボタン表示

### `__tests__/unit/components/quick-action-chips.test.tsx`（修正）

- 6 チップの表示テスト（5→6に更新）
- 「今日のメイクおみくじ」チップの表示テスト追加
- action: "omikuji" の onSelect テスト追加

### ドキュメント更新

- `docs/plans/backlog_and_remaining_tasks.md` — FEAT-005B, FEAT-005C を ✅ RESOLVED に更新
- `docs/plans/2026-02-22_FEAT-005BC_omikuji-greeting.md` — 承認済みプラン保存
- `docs/README.md` — プランファイルリンク追加

---

## 変更ファイル一覧

### 新規 (5+2 tests)

| ファイル | 説明 |
|---------|------|
| `lib/recipe-recommendation.ts` | スコアリング純粋関数 (scoreRecipe, recommendRecipe) |
| `app/api/recipes/recommend/route.ts` | GET: レシピ推薦 (BFF only) |
| `hooks/use-recipe-omikuji.ts` | おみくじフック |
| `components/recipe-omikuji-overlay.tsx` | おみくじオーバーレイ UI |
| `__tests__/unit/lib/recipe-recommendation.test.ts` | スコアリングテスト |
| `__tests__/unit/components/recipe-omikuji-overlay.test.tsx` | オーバーレイテスト |

### 既存修正 (4)

| ファイル | 変更内容 |
|---------|---------|
| `hooks/use-chat.ts` | `INITIAL_MESSAGE` → `getInitialMessage()` 動的化 |
| `components/quick-action-chips.tsx` | 「今日のメイクおみくじ」チップ追加（計6チップ） |
| `app/(main)/chat/page.tsx` | おみくじオーバーレイ統合 + omikuji action ハンドリング |
| `__tests__/unit/components/quick-action-chips.test.tsx` | チップ追加に伴うテスト更新 |

---

## UX フロー

### おみくじフロー
```
ユーザー: 「今日のメイクおみくじ」チップ タップ
  ↓
RecipeOmikujiOverlay 表示（おみくじ演出 2秒）
  ↓
GET /api/recipes/recommend?weather=晴れ
  ↓ (BFF: Firestore query → score → recommend)
結果表示: レシピ名 + スコア + 理由タグ + プレビュー画像
  ↓
ユーザーの選択:
  A) 「このレシピで始める」→ チャットに「このレシピを見せて」送信 → 既存フロー
  B) 「別のレシピを引く」→ exclude に追加 → 再抽選
  C) 全レシピ使い切り → 「新しいレシピを作る」→ チャットに送信 → AI新規生成
```

---

## 検証手順

1. `npx tsc --noEmit` — 型エラーなし
2. `npx vitest run` — 全テストパス
3. 手動検証:
   - QuickActionChips に 6 チップが表示されること
   - 「今日のメイクおみくじ」タップ → おみくじ演出 → 結果表示
   - おみくじ結果の「このレシピで始める」→ チャットにメッセージ送信
   - 「別のレシピを引く」→ 異なるレシピが表示
   - 全レシピ使い切り → 「新しいレシピを作る」ボタン → AI 新規生成フローへ
   - レシピ 0 件時 → 空状態メッセージ + 新規作成ボタン
   - INITIAL_MESSAGE が時間帯で変わること（朝/昼/夜）
   - 「おまかせ提案」チップは従来通り動作すること
