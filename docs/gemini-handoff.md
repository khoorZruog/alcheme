# alche:me — Gemini UI モック作成用 引き継ぎ資料

> **目的:** 現在の alche:me のバックエンド構造・ページ構成・デザインシステムを Gemini に引き継ぎ、UI モックを作成してもらう。

---

## 1. アプリ概要

**alche:me（アルケミー）** — 手持ちコスメで、まだ見ぬ私に出会う

手持ちのコスメ在庫を AI エージェントが鑑定し、最適なメイクレシピを提案するモバイルファースト PWA。

| 項目 | 値 |
|------|-----|
| フレームワーク | Next.js 16 (App Router) + React 19 + TypeScript |
| スタイリング | Tailwind CSS + shadcn/ui |
| 認証 | Firebase Auth (Google ログイン) |
| DB | Cloud Firestore |
| AI | Google ADK + Gemini 2.5 Flash (Python FastAPI マイクロサービス) |
| ターゲット | 20代〜30代女性、コスメ好き |
| ビューポート | モバイルファースト（375×812 = iPhone 14 基準）、PC 対応も必要 |

---

## 2. デザインシステム

### カラーパレット

| トークン名 | Hex | 用途 |
|-----------|-----|------|
| `alcheme-gold` | `#C9A96E` | プライマリアクセント、CTA ボタン |
| `alcheme-rose` | `#D4778C` | セカンダリアクセント、ユーザーメッセージ背景 |
| `alcheme-blush` | `#F2D5D9` | 淡いピンク背景、タグ |
| `alcheme-cream` | `#FFF8F3` | メイン背景色（オフホワイト） |
| `alcheme-sand` | `#F5EDE4` | 区切り線、無効状態、カード背景 |
| `alcheme-charcoal` | `#2D2A26` | 本文テキスト |
| `alcheme-muted` | `#8C8279` | サブテキスト、プレースホルダー |
| `alcheme-success` | `#7EB8A0` | 成功 |
| `alcheme-warning` | `#E8B85E` | 警告 |
| `alcheme-danger` | `#D97070` | エラー、削除 |

#### レアリティカラー（ソーシャルゲーム風）

| レアリティ | Hex | 星数 | 演出 |
|-----------|-----|------|------|
| SSR | `#FFD700` (ゴールド) | ★★★★★ | `shadow-glow` (金色グロー) |
| SR | `#C084FC` (パープル) | ★★★★ | なし |
| R | `#60A5FA` (ブルー) | ★★★ | なし |
| N | `#9CA3AF` (グレー) | ★★ | なし |

### フォント

| 用途 | フォント | ウェイト |
|------|---------|---------|
| 本文 (`font-sans`) | Noto Sans JP | 400, 500, 600, 700 |
| 見出し (`font-display`) | Zen Maru Gothic（丸ゴシック） | 400, 500, 700 |

### 角丸・シャドウ

| トークン | 値 | 用途 |
|---------|-----|------|
| `rounded-card` | 16px | カード、モーダル |
| `rounded-button` | 12px | ボタン |
| `rounded-badge` | 9999px | バッジ、ピル |
| `rounded-input` | 10px | フォーム入力 |
| `shadow-card` | `0 2px 12px rgba(45,42,38,0.06)` | カード |
| `shadow-card-hover` | `0 4px 20px rgba(45,42,38,0.10)` | ホバー時 |
| `shadow-glow` | `0 0 20px rgba(201,169,110,0.25)` | SSR グロー |

---

## 3. 画面構成とルーティング

### 全体レイアウト

```
┌──────────────────────────────┐
│  body (bg-alcheme-cream)     │
│  ┌──────────────────────────┐│
│  │  <AuthProvider>          ││
│  │  ┌────────────────────┐  ││
│  │  │  各ページコンテンツ │  ││
│  │  │                    │  ││
│  │  │                    │  ││
│  │  │                    │  ││
│  │  └────────────────────┘  ││
│  │  ┌────────────────────┐  ││
│  │  │  BottomNav (固定)  │  ││
│  │  │ Chat|Scan|コスメ|設定│  ││
│  │  └────────────────────┘  ││
│  └──────────────────────────┘│
│  <Toaster> (トースト通知)     │
└──────────────────────────────┘
```

### BottomNav（固定タブバー）

4 タブ。アクティブタブは `alcheme-rose` でハイライト。

| タブ | アイコン | パス | ラベル |
|------|---------|------|--------|
| チャット | MessageSquare | `/chat` | チャット |
| スキャン | Camera | `/scan` | スキャン |
| コスメ | Diamond | `/inventory` | コスメ |
| マイページ | Settings | `/settings` | マイページ |

**非表示条件:** `/scan/confirm` と `/inventory/[itemId]` では BottomNav を隠す。

---

## 4. 各画面の詳細

### 4.1 ログイン画面 (`/login`)

- アプリロゴ「alche:me」
- タグライン「手持ちコスメで、まだ見ぬ私に出会う」
- Google ログインボタン（プライマリ）
- メールアドレスログインフォーム
- 新規登録リンク

---

### 4.2 オンボーディング (`/onboarding`)

3 ステップのウィザード形式。プログレスバー表示。

| ステップ | 内容 |
|---------|------|
| 1 | ニックネーム入力 |
| 2 | 肌タイプ / 肌トーン / パーソナルカラー選択 |
| 3 | 「最初のコスメをスキャンしよう！」導線 |

---

### 4.3 チャット画面 (`/chat`) — メインの対話画面

```
┌──────────────────────────────┐
│ チャット                      │
│ AIメイクアドバイザー           │
├──────────────────────────────┤
│                              │
│ ┌──────────────────┐         │
│ │ おはようございます！✨     │  ← AI メッセージ（左寄せ、白背景、shadow-card）
│ │ 今日はどんなメイクに...    │
│ └──────────────────┘         │
│                              │
│         ┌────────────────┐   │
│         │ 時短5分メイク！ │   │  ← ユーザーメッセージ（右寄せ、rose/10 背景）
│         └────────────────┘   │
│                              │
│ ┌──────────────────┐         │
│ │ ● ● ●           │         │  ← ローディングドット（応答待ち時）
│ └──────────────────┘         │
│                              │
│ ┌──────────────────┐         │
│ │ [レシピカード]    │         │  ← AI がレシピを提案した時にインライン表示
│ └──────────────────┘         │
│                              │
│ [韓国風] [時短5分] [デート用]│  ← クイックアクションチップス（初回のみ表示）
├──────────────────────────────┤
│ 📎 [メッセージを入力...]  ➤ │  ← 入力欄 + 画像添付 + 送信ボタン
└──────────────────────────────┘
```

**SSE ストリーミング:** AI の返信はリアルタイムで1文字ずつ表示。返信中はカーソルが点滅。

**レシピカード:** AI がレシピ JSON を返した時、チャット内にコンパクトなカードとして表示。タップで詳細へ遷移。

---

### 4.4 スキャン画面 (`/scan`)

```
┌──────────────────────────────┐
│ ← スキャン                    │
├──────────────────────────────┤
│                              │
│   ┌────────────────────┐     │
│   │                    │     │
│   │  カメラプレビュー /  │     │  ← aspect-4/3, max-w-md, max-h-60vh
│   │  画像ドロップ領域    │     │
│   │                    │     │
│   └────────────────────┘     │
│                              │
│   [📷 撮影]  [🖼 選択]      │  ← 撮影=rose背景, 選択=白背景+ボーダー
│                              │
│   💡 ポーチの中身を撮影する   │
│   と、まとめて鑑定できますよ  │
│                              │
│   ┌────────────────────┐     │
│   │ ✨ 鑑定スタート      │     │  ← gold 背景、太字、shadow-card
│   └────────────────────┘     │
│                              │
└──────────────────────────────┘
```

**処理フロー:**
1. 画像選択/撮影 → プレビュー表示
2. 「鑑定スタート」タップ → `POST /api/inventory/scan`
3. 「解析中...」ローディング
4. 成功 → `/scan/confirm` へ遷移

---

### 4.5 鑑定結果確認画面 (`/scan/confirm`)

BottomNav 非表示。

```
┌──────────────────────────────┐
│ ← 鑑定結果                    │
├──────────────────────────────┤
│                              │
│ ┌──────────────────────────┐ │
│ │ [✓] KATE リップモンスター│ │  ← AppraisalCard（チェックボックス付き）
│ │     Lip | matte | 80%    │ │     高 confidence は自動チェック
│ │     SR ★★★★            │ │     レアリティバッジ表示
│ │     [編集]               │ │     編集ボタン → ItemEditSheet
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ [✓] EXCEL シャドウ       │ │
│ │     Eye | shimmer | 60%  │ │
│ │     R ★★★              │ │
│ └──────────────────────────┘ │
│                              │
│ ┌────────────────────────┐   │
│ │ 全て確認して登録 (2/2)  │   │  ← 確認数表示、gold 背景
│ └────────────────────────┘   │
└──────────────────────────────┘
```

**初回表示時:** 鑑定演出アニメーション（AppraisalEffect）→ タップで閉じる

---

### 4.6 在庫一覧 (`/inventory`)

```
┌──────────────────────────────┐
│ コスメ (12)        🔍  ＋   │  ← アイテム数、検索、追加ボタン
├──────────────────────────────┤
│ [すべて] Lip Eye Cheek Base │  ← CategoryFilter（横スクロール）
├──────────────────────────────┤
│ ┌──────┐ ┌──────┐           │
│ │ 画像 │ │ 画像 │           │  ← CosmeCard 2カラムグリッド
│ │ SR★ │ │ N★  │           │     画像 + レアリティバッジ
│ │ KATE │ │ EXCEL│           │     ブランド名
│ │ リップ│ │ シャドウ│        │     商品名
│ │ 80%  │ │ 60%  │           │     残量バー
│ └──────┘ └──────┘           │
│ ┌──────┐ ┌──────┐           │
│ │ ...  │ │ ...  │           │
│ └──────┘ └──────┘           │
└──────────────────────────────┘
```

**空の場合:** 📦 アイコン + 「コスメが登録されていません」 + スキャンへの導線

**検索ダイアログ:** ブランド名・商品名・色で絞り込み

---

### 4.7 アイテム詳細 (`/inventory/[itemId]`)

BottomNav 非表示。

```
┌──────────────────────────────┐
│ ← アイテム詳細        ⋮     │  ← 三点メニュー（編集/削除）
├──────────────────────────────┤
│ ┌────────────────────────┐   │
│ │     商品画像           │   │  ← ヒーロー画像（aspect-square）
│ │     SR ★★★★ (左上)  │   │     レアリティバッジオーバーレイ
│ └────────────────────────┘   │
│                              │
│ KATE                         │  ← ブランド（uppercase、muted）
│ リップモンスター              │  ← 商品名（太字、大きめ）
│ 赤みブラウン                  │  ← 色の説明
│                              │
│ ■■■■□ 発色力 4/5          │  ← StatBar 4項目
│ ■■■□□ 持続力 3/5          │
│ ■■■■■ 製品寿命 5/5        │
│ ■■□□□ ナチュラル 2/5      │
│                              │
│ ┌──────────┬──────────┐     │
│ │ 質感      │ 残量      │     │  ← 詳細グリッド
│ │ matte    │ 80%       │     │
│ ├──────────┼──────────┤     │
│ │ 登録日    │ 信頼度    │     │
│ │ 2025/1/1 │ high     │     │
│ └──────────┴──────────┘     │
└──────────────────────────────┘
```

---

### 4.8 レシピ一覧 (`/recipes`)

```
┌──────────────────────────────┐
│ レシピ (5)                    │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 📖 韓国風・純欲メイク     │ │  ← RecipeSummaryCard
│ │ 「韓国っぽいメイク教えて」│ │     ユーザーリクエスト
│ │ 再現度 85% | 4ステップ    │ │     マッチスコア + ステップ数
│ │ ♥ 2025/01/15             │ │     お気に入り + 日付
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 📖 時短オフィスメイク     │ │
│ │ ...                      │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**空の場合:** 📖 アイコン + 「レシピがありません」 + チャットへの導線

---

### 4.9 レシピ詳細 (`/recipes/[recipeId]`)

```
┌──────────────────────────────┐
│ ← レシピ詳細                  │
├──────────────────────────────┤
│ 韓国風・純欲メイク            │  ← レシピ名
│ 再現度 85% | 4ステップ        │
│ [オフィス] [冬]              │  ← コンテキストタグ
│                              │
│ 🧠 AIの思考プロセス (展開可) │  ← 折りたたみ可能
│   ・在庫を確認しました       │
│   ・色合わせを検討しました   │
│                              │
│ ─── ステップ ───             │
│ ┌──────────────────────────┐ │
│ │ Step 1: Base              │ │  ← RecipeStepCard
│ │ PAUL & JOE プライマー     │ │     使用アイテム名
│ │ 下地を顔全体に薄く伸ばす  │ │     手順
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Step 2: Eye               │ │
│ │ EXCEL スキニーリッチシャドウ│ │
│ │ ①ベージュをアイホール全体に│ │
│ └──────────────────────────┘ │
│ ...                          │
│                              │
│ 💡 プロのコツ (展開可)       │
│   ・ファンデは薄く塗ると...  │
│                              │
│ ─── フィードバック ───       │
│ [❤️ 良い] [😐 微妙] [😟 合わない] │
└──────────────────────────────┘
```

---

### 4.10 設定画面 (`/settings`)

```
┌──────────────────────────────┐
│ マイページ                    │
├──────────────────────────────┤
│ ■ 基本情報                   │
│   ニックネーム: [________]   │
│                              │
│ ■ ビューティプロフィール      │
│   肌タイプ: [乾燥肌    ▼]   │
│   肌トーン: [色白      ▼]   │
│   パーソナルカラー: [イエベ春 ▼] │
│                              │
│ ■ エージェントテーマ          │
│   ┌─────┐ ┌─────┐ ┌─────┐  │
│   │親友  │ │K-POP│ │メイド│  │  ← 3つのカード型ラジオ
│   │🌸   │ │✨   │ │🎀   │  │
│   └─────┘ └─────┘ └─────┘  │
│                              │
│ ■ SNSリンク                  │
│   Instagram: [________]     │
│   TikTok:    [________]     │
│   X:         [________]     │
│                              │
│ ■ データ                     │
│   ┌────────┐ ┌────────┐    │
│   │ コスメ  │ │ レシピ  │    │
│   │  12個   │ │  5件   │    │
│   └────────┘ └────────┘    │
│                              │
│ [保存する]                   │  ← gold 背景
│ [ログアウト]                 │  ← danger 赤テキスト
└──────────────────────────────┘
```

---

## 5. API エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| `POST` | `/api/auth/session` | セッション Cookie 作成 | 不要（ID トークンで認証） |
| `DELETE` | `/api/auth/session` | ログアウト | 不要 |
| `POST` | `/api/chat` | チャット SSE ストリーミング | 必要 |
| `GET` | `/api/inventory` | 在庫一覧取得 | 必要 |
| `POST` | `/api/inventory` | アイテム追加 | 必要 |
| `GET` | `/api/inventory/[id]` | アイテム詳細 | 必要 |
| `PUT` | `/api/inventory/[id]` | アイテム更新 | 必要 |
| `DELETE` | `/api/inventory/[id]` | アイテム削除 | 必要 |
| `POST` | `/api/inventory/scan` | 画像スキャン | 必要 |
| `POST` | `/api/inventory/confirm` | スキャン結果確認・登録 | 必要 |
| `GET` | `/api/recipes` | レシピ一覧 | 必要 |
| `GET` | `/api/recipes/[id]` | レシピ詳細 | 必要 |
| `POST` | `/api/recipes/[id]/feedback` | フィードバック送信 | 必要 |
| `GET` | `/api/users/me` | プロフィール取得 | 必要 |
| `PATCH` | `/api/users/me` | プロフィール更新 | 必要 |

---

## 6. 主要 TypeScript 型定義

### InventoryItem

```typescript
interface InventoryItem {
  id: string;
  category: "Lip" | "Cheek" | "Eye" | "Base" | "Other";
  brand: string;
  product_name: string;
  color_code?: string;
  color_name?: string;
  color_description: string;
  texture: "matte" | "glossy" | "shimmer" | "cream" | "powder" | "liquid";
  stats?: {
    pigment: number;        // 発色力 1-5
    longevity: number;      // 持続力 1-5
    shelf_life: number;     // 製品寿命 1-5
    natural_finish: number; // ナチュラルさ 1-5
  };
  rarity?: "SSR" | "SR" | "R" | "N";
  estimated_remaining: string;  // "50%", "75%"
  confidence: "high" | "medium" | "low";
  source: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}
```

### Recipe

```typescript
interface Recipe {
  id: string;
  recipe_name: string;
  user_request: string;
  match_score?: number;           // 0-100
  thinking_process: string[];
  steps: {
    step: number;
    area: string;
    item_id: string;
    item_name: string;
    instruction: string;
    substitution_note?: string;
  }[];
  context?: { weather?: string; occasion?: string; note?: string };
  pro_tips: string[];
  is_favorite: boolean;
  feedback?: { user_rating: "liked" | "neutral" | "disliked"; created_at: string };
  created_at: string;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: ScanResult | RecipeResult;
  image_url?: string;
  is_streaming?: boolean;
  created_at: string;
}
```

### UserProfile

```typescript
interface UserProfile {
  displayName: string | null;
  personalColor: string | null;   // "イエベ春" | "イエベ秋" | "ブルベ夏" | "ブルベ冬"
  skinType: string | null;        // "乾燥肌" | "脂性肌" | "混合肌" | "普通肌" | "敏感肌"
  skinTone: string | null;        // "色白" | "標準" | "やや暗め" | "暗め"
  agentTheme: "bestfriend" | "kpop" | "maid";
  socialLinks?: { instagram?: string; tiktok?: string; x?: string };
  onboardingCompleted: boolean;
}
```

---

## 7. SSE ストリーミング仕様

チャット API (`POST /api/chat`) は Server-Sent Events 形式でレスポンスを返す。

```
data: {"type":"text_delta","data":"こんにちは"}

data: {"type":"text_delta","data":"！今日は"}

data: {"type":"recipe_card","data":"{\"recipe\":{...}}"}

data: {"type":"done","data":""}
```

| イベント | 説明 |
|---------|------|
| `text_delta` | テキストの差分。前回のテキストに追記する |
| `recipe_card` | レシピ JSON。チャット内にカードとして表示 |
| `done` | ストリーム終了 |
| `error` | エラーメッセージ |

---

## 8. 現在の UI の問題点

Gemini にモック作成を依頼する際に伝えたい課題：

1. **スキャン画面（PC）:** 画像プレビュー領域が大きすぎる。ボタンのテキストが背景に同化して読めない
2. **チャット画面:** テキストの余白が少なくダサい。ローディング中の表示が分かりにくい。全体的にデザインが洗練されていない
3. **全体:** モバイルファーストだが PC でも見栄えの良いレスポンシブデザインが必要。コスメアプリらしい華やかさ・高級感が不足
4. **世界観:** 「コスメ × ソーシャルゲーム」をテーマに、レアリティ演出やカード収集の楽しさを前面に出したい

---

## 9. Agent サーバー構成（参考）

```
agent/
├── server.py               # FastAPI サーバー (POST /scan, POST /chat, GET /health)
├── Dockerfile              # python:3.12-slim, uvicorn
├── alcheme/
│   ├── agent.py            # root_agent エクスポート
│   ├── agents/             # LlmAgent 定義
│   │   ├── concierge.py    # ルートエージェント（意図判定 + ルーティング）
│   │   ├── inventory.py    # 在庫管理エージェント
│   │   ├── alchemist.py    # レシピ生成エージェント
│   │   └── product_search.py # 楽天 API 商品検索エージェント
│   ├── tools/              # エージェントが使うツール関数
│   │   ├── inventory_tools.py  # Firestore CRUD
│   │   ├── recipe_tools.py     # レシピ保存/取得
│   │   └── rakuten_api.py      # 楽天商品検索
│   ├── schemas/            # Pydantic スキーマ
│   │   ├── inventory.py    # InventoryItem, ScanOutput
│   │   └── recipe.py       # Recipe, RecipeOutput
│   └── prompts/            # システムプロンプト
└── .env                    # GOOGLE_GENAI_USE_VERTEXAI, RAKUTEN_APP_ID
```

BFF (Next.js API Routes) → Agent Server (FastAPI :8080) → ADK Runner → Gemini 2.5 Flash

---

## 10. ファイル構成（フロントエンド）

```
app/
├── layout.tsx              # ルートレイアウト（フォント、AuthProvider、Toaster）
├── page.tsx                # ランディング/ログイン
├── globals.css             # HSL 変数、グローバルスタイル
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── onboarding/page.tsx
├── (main)/
│   ├── layout.tsx          # 認証チェック、BottomNav、pb-20
│   ├── chat/page.tsx
│   ├── scan/page.tsx
│   ├── scan/confirm/page.tsx
│   ├── inventory/page.tsx
│   ├── inventory/[itemId]/page.tsx
│   ├── recipes/page.tsx
│   ├── recipes/[recipeId]/page.tsx
│   └── settings/page.tsx
└── api/                    # BFF API Routes（上記 §5 参照）

components/
├── ui/                     # shadcn/ui ベースコンポーネント（43ファイル）
├── auth/                   # 認証コンポーネント
├── bottom-nav.tsx
├── page-header.tsx
├── scan-camera.tsx
├── appraisal-card.tsx
├── appraisal-effect.tsx
├── cosme-card.tsx
├── cosme-card-mini.tsx
├── item-edit-sheet.tsx
├── category-filter.tsx
├── chat-message.tsx
├── chat-input.tsx
├── quick-action-chips.tsx
├── recipe-card-inline.tsx
├── recipe-step-card.tsx
├── recipe-feedback.tsx
├── rarity-badge.tsx
├── stat-bar.tsx
├── remaining-bar.tsx
├── empty-state.tsx
└── loading-skeleton.tsx

hooks/
├── use-chat.ts             # SSE ストリーミング + メッセージ管理
├── use-inventory.ts        # 在庫取得 + フィルタリング
├── use-recipe.ts           # 単一レシピ + フィードバック
└── use-recipes.ts          # レシピ一覧

types/
├── chat.ts                 # ChatMessage, SSEEvent
├── inventory.ts            # InventoryItem, ScanResult, Rarity
├── recipe.ts               # Recipe, RecipeStep, RecipeResult
└── user.ts                 # UserProfile
```
