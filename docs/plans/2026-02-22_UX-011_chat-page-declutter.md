# チャットページ整理 — コンテンツ再配置 & フォーカスUI

## Context

`/chat` ページが初回表示（`messages.length <= 1`）時に以下4つのカード＋グリーティング＋クイックアクションを一度に表示しており、情報過多で「何をすればよいか分からない」状態になっている。

**現状の表示順:**
1. BeautyTodayCard（天気・ストリーク・レシピ推薦・美容Tips）
2. BeautyStoriesTray（7日間の日記サークル）
3. CosmeInsightsCard（眠りコスメ等の提案チップ）
4. ChatGreeting（時間帯挨拶＋季節Tips）
5. QuickActionChips（6つのアクションボタン、fixed bottom-44で一部画面外）

**目標:** 全機能を保持しつつ、各コンテンツを最も自然なページに再配置し、チャットページは「AI美容部員と話す」体験にフォーカスさせる。

---

## 再配置先

| コンポーネント | 移動先 | 理由 |
|---|---|---|
| BeautyTodayCard | Beauty Log ページ（カレンダービュー上部） | 天気・ストリーク・レシピ推薦は日記コンテキスト。既存の WeeklyBeautyReport の上に自然に配置 |
| BeautyStoriesTray | Beauty Log ページ（BeautyTodayCard の下） | 7日間サークルは日記エントリへの導線。Beauty Log ページで「今週の振り返り」→「週次レポート」→「カレンダー」の流れに |
| CosmeInsightsCard | Inventory ページ（have ビューのフィルタ上部） | 「使ってみませんか？」は在庫管理の文脈。タップ時は `/chat?suggest_item={id}` でチャットへ遷移 |
| ChatGreeting | チャットページに残す（季節Tipは削除、コンテキストストリップが代替） | |
| QuickActionChips | チャットページに残す（fixed → インライン、1行スクロール → 2行ラップ） | |

---

## 新規コンポーネント: ChatContextStrip

チャットページに残す軽量な1行コンテキスト。天気バッジ＋ストリークバッジ＋7日ドットで、タップすると `/beauty-log` へ遷移。

```
[ ☀️ 12°C 湿度45% ] [ 🔥 3日連続 ] [ ●●○●●●○ ]
```

天気データは `useWeather()` 新規共有フックで取得（BeautyTodayCard からロジック抽出）。

---

## 実装ステップ

### Step 1: 共有フック抽出
- **新規** `hooks/use-weather.ts` — geolocation + `/api/weather` フェッチ（`beauty-today-card.tsx` L85-120 のロジック抽出）
- **修正** `components/beauty-today-card.tsx` — 内部の天気 state/useEffect を `useWeather()` に置換。CTA の「メイク日記を見る →」リンクは削除（Beauty Log ページ内に配置されるため不要に）

### Step 2: ChatContextStrip 作成
- **新規** `components/chat-context-strip.tsx` — 天気バッジ + ストリークバッジ + 7日ドット（各ピルは `/beauty-log` へのリンク）
- **新規** `__tests__/unit/components/chat-context-strip.test.tsx`

### Step 3: Beauty Log ページにカード移設
- **修正** `app/(main)/beauty-log/page.tsx`
  - カレンダービュー（L251）: `<WeeklyBeautyReport />` の前に `<BeautyTodayCard />` + `<BeautyStoriesTray />` を挿入
  - タイムラインビュー（L289）: `<BeautyStoriesTray />` をタイムラインリスト上部に挿入

### Step 4: Inventory ページにインサイト移設
- **修正** `app/(main)/inventory/_components/inventory-have-view.tsx`
  - `useCosmeInsights` フックを追加
  - フィルタモード切替の上（L139の前）に `<CosmeInsightsCard>` を挿入
  - `onTap` は `router.push(\`/chat?suggest_item=${insight.item.id}\`)` でチャットページへ遷移

### Step 5: チャットページ再構築
- **修正** `app/(main)/chat/page.tsx`
  - 削除: `BeautyTodayCard`, `BeautyStoriesTray`, `CosmeInsightsCard`, `useCosmeInsights` の import と使用箇所
  - 追加: `ChatContextStrip` の import
  - 追加: `useSearchParams` + `useEffect` で `?suggest_item=` パラメータを処理（インベントリからの遷移をハンドル）
  - `messages.length <= 1` ブロックを以下に変更:
    ```tsx
    {messages.length <= 1 && (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-200px)]">
        <ChatContextStrip />
        <ChatGreeting />
        <div className="mt-6 w-full">
          <QuickActionChips visible={showChips} onSelect={handleChipSelect} />
        </div>
      </div>
    )}
    ```
  - QuickActionChips の固定位置表示（L191-195）を削除（インラインに移動済み）

### Step 6: QuickActionChips レイアウト改善
- **修正** `components/quick-action-chips.tsx`
  - `flex gap-2 overflow-x-auto` → `flex flex-wrap gap-2 justify-center`
  - 各チップの横幅を `basis-[calc(33.333%-8px)]` で 3列グリッド化
  - パディングを `px-4 py-3` に拡大（タップターゲット拡大）

### Step 7: ChatGreeting 簡素化
- **修正** `components/chat-greeting.tsx`
  - 季節Tips の `<p>` 要素（L50）を削除（コンテキストストリップが代替）

---

## 修正ファイル一覧

| ファイル | 操作 |
|---|---|
| `hooks/use-weather.ts` | **新規** |
| `components/chat-context-strip.tsx` | **新規** |
| `__tests__/unit/components/chat-context-strip.test.tsx` | **新規** |
| `app/(main)/chat/page.tsx` | 修正（カード削除、ストリップ追加、チップ位置変更、ディープリンク対応） |
| `app/(main)/beauty-log/page.tsx` | 修正（BeautyTodayCard + StoriesTray 追加） |
| `app/(main)/inventory/_components/inventory-have-view.tsx` | 修正（CosmeInsightsCard + 遷移ハンドラ追加） |
| `components/beauty-today-card.tsx` | 修正（useWeather フック使用 + CTA リンク削除） |
| `components/chat-greeting.tsx` | 修正（季節Tips 削除） |
| `components/quick-action-chips.tsx` | 修正（2行ラップレイアウト） |

---

## Verification

1. `npx tsc --noEmit` — 型エラーなし
2. `npx vitest run` — 全テストパス
3. 手動確認:
   - `/chat` — コンテキストストリップ + グリーティング + 6チップが中央に表示。天気バッジタップで `/beauty-log` 遷移
   - `/beauty-log` — 上部に BeautyTodayCard + StoriesTray が表示（カレンダー/タイムライン両ビュー）
   - `/inventory` — have ビュー上部にインサイトチップ表示。タップで `/chat?suggest_item=xxx` に遷移し、自動でコスメ選択＋メッセージプリフィル
   - 既存のチャット会話（`messages.length > 1`）— 変更なし
