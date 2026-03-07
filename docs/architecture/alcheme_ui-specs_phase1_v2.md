# alche:me — UI/UX Specification (Phase 1)

| | |
|---|---|
| **Version** | 2.4 |
| **Date** | 2026-02-15 |
| **Author** | Eri Kaneko (Product Owner) |
| **Status** | ✅ Phase 1 Implementation Complete |
| **Related** | CLAUDE_CODE_INSTRUCTIONS_v1_3.md, alcheme_design-doc_v1.md, alcheme_prompts-catalog_v3.md |

> 本ドキュメントは Phase 1 MVP の全画面仕様を定義する。Claude Code はフロントエンド実装時にこのファイルを正として参照すること。

### Changelog

| Version | Date | 変更内容 |
|---------|------|---------|
| 1.0 | 2026-02-13 | 初版作成（全16セクション + Appendix A/B） |
| 2.4 | 2026-02-15 | Phase 1完了: BottomNavに5番目のレシピタブ追加。リアルタイム進捗表示（thinking-indicator.tsx）。おまかせテーマ提案。レシピ保存フロー修正（フィールド名正規化 title→recipe_name, createdAt→created_at）。レシピ詳細ページのsteps安全対策。 |
| 2.3 | 2026-02-15 | Phase 5: スキャン機能強化。カテゴリ/テクスチャ日本語化（英語→日本語5グループ + Appendix D 31アイテム種別）。PAO自動紐づけ（item_type→使用期限月数）。エージェントプロンプト改善（画像分析優先順序、テキスト読取最優先、「不明」削減）。マルチ画像スキャン（最大4枚）。鑑定結果キャンセル/個別スキップ。編集シートにitem_type連動Select + PAO表示。後方互換ランタイム変換。 |
| 2.2 | 2026-02-15 | Phase 4: Tailwind v4 カラーシステム修正（@theme にカスタムカラー登録 — `bg-text-ink` 等が未生成だった根本原因を解消）。プライバシーセクション削除。LIPS風プロフィール完了度バッジ追加（`calcCompletionRate`）。プロフィール画像アップロード機能（`avatar-upload.tsx` + Firebase Storage）。公開プロフィールページをLIPS風行レイアウトに刷新。`photoURL` フィールド追加。 |
| 2.1 | 2026-02-14 | Week 3 フロントエンド画面実装完了。全画面（Landing, Onboarding, Inventory, Scan, Chat, Recipes, Settings）実装済み。BFF API Routes はモック接続（Week 4 で Agent Engine 実接続）。 |
| 2.0 | 2026-02-14 | PRD v4 アライメントレビュー反映: §1.5 アイコン表のRPG用語→コスメ用語(B-1)。§4.1 ログイン画面サブコピーを PRD v4 準拠に変更(B-3)。§5 オンボーディング Step 2 拡張（スキントーン追加・全項目スキップ可能化）(A-3)。§8.2/§10.1 ステータス表記をコスメスペック用語に統一(B-1)。§13 設定画面を LIPS 水準プロフィールに拡張(A-3) + エージェントテーマ切替追加(C-3)。§16 stat-bar.tsx コメント修正(B-2) + onboarding パスを(auth)配下に移動(C-4)。Appendix A manifest.json description 変更(B-4)。Related を v1.3/v3 に更新。 |

---

## Table of Contents

1. [デザインシステム](#1-デザインシステム)
2. [画面遷移フロー](#2-画面遷移フロー)
3. [共通レイアウト](#3-共通レイアウト)
4. [S01: ランディング / ログイン](#4-s01-ランディング--ログイン)
5. [S02: オンボーディング](#5-s02-オンボーディング)
6. [S03: ホーム（チャット）](#6-s03-ホームチャット)
7. [S04: コスメスキャン](#7-s04-コスメスキャン)
8. [S05: 鑑定演出 + 確認](#8-s05-鑑定演出--確認)
9. [S06: 在庫一覧](#9-s06-在庫一覧)
10. [S07: アイテム詳細](#10-s07-アイテム詳細)
11. [S08: レシピカード](#11-s08-レシピカード)
12. [S09: レシピ一覧](#12-s09-レシピ一覧)
13. [S10: 設定 / プロフィール](#13-s10-設定--プロフィール)
14. [アニメーション仕様](#14-アニメーション仕様)
15. [状態管理設計](#15-状態管理設計)
16. [コンポーネント→ファイル対応表](#16-コンポーネントファイル対応表)

---

## 1. デザインシステム

### 1.1 ブランドカラー

```
/* Tailwind v4: app/globals.css の @theme ブロックに --color-* で定義 */
/* (tailwind.config.js は CSS-first モードでは無視されるため @theme が正) */

alcheme: {
  /* プライマリ：錬金術のゴールド〜ローズ */
  gold:       '#C9A96E',   /* アクセント、CTA、レア度演出 */
  rose:       '#D4778C',   /* プライマリアクション、愛らしさ */
  blush:      '#F2D5D9',   /* カード背景、ソフトハイライト */

  /* ニュートラル */
  cream:      '#FFF8F3',   /* ページ背景（温かみのあるオフホワイト） */
  sand:       '#F5EDE4',   /* カード背景、セクション区切り */
  charcoal:   '#2D2A26',   /* 本文テキスト */
  muted:      '#8C8279',   /* サブテキスト、プレースホルダ */

  /* セマンティック */
  success:    '#7EB8A0',   /* 完了、成功 */
  warning:    '#E8B85E',   /* 注意、期限 */
  danger:     '#D97070',   /* エラー、期限切れ */

  /* レア度 */
  ssr:        '#FFD700',   /* SSR（ゴールド） */
  sr:         '#C084FC',   /* SR（パープル） */
  r:          '#60A5FA',   /* R（ブルー） */
  n:          '#9CA3AF',   /* N（グレー） */
}
```

### 1.2 タイポグラフィ

```
/* Google Fonts */
fontFamily: {
  sans: ['"Noto Sans JP"', '"Inter"', 'sans-serif'],
  display: ['"Zen Maru Gothic"', '"Noto Sans JP"', 'sans-serif'],
}
```

| 用途 | フォント | サイズ | ウェイト |
|------|---------|--------|---------|
| ページタイトル | Zen Maru Gothic | text-xl (20px) | bold |
| セクション見出し | Zen Maru Gothic | text-lg (18px) | semibold |
| カードタイトル | Noto Sans JP | text-base (16px) | medium |
| 本文 | Noto Sans JP | text-sm (14px) | normal |
| キャプション | Noto Sans JP | text-xs (12px) | normal |
| ボタンラベル | Noto Sans JP | text-sm (14px) | semibold |

### 1.3 角丸・シャドウ

```
borderRadius: {
  card: '16px',      /* カード系コンポーネント */
  button: '12px',    /* ボタン */
  badge: '9999px',   /* バッジ・タグ（フル角丸） */
  input: '10px',     /* 入力フィールド */
}

boxShadow: {
  card: '0 2px 12px rgba(45, 42, 38, 0.06)',
  'card-hover': '0 4px 20px rgba(45, 42, 38, 0.10)',
  glow: '0 0 20px rgba(201, 169, 110, 0.25)',  /* ゴールドのグロウ */
}
```

### 1.4 shadcn/ui コンポーネント一覧

Phase 1 で使用する shadcn/ui コンポーネント。`npx shadcn@latest add` でインストール:

```bash
npx shadcn@latest add button card badge avatar input textarea
npx shadcn@latest add dialog drawer sheet tabs scroll-area
npx shadcn@latest add skeleton separator progress toast
npx shadcn@latest add dropdown-menu select toggle-group
```

### 1.5 アイコン

Lucide React を使用。主要アイコンの対応表:

| 用途 | アイコン名 |
|------|----------|
| ホーム / チャット | `MessageCircle` |
| 在庫一覧 | `Package` |
| スキャン | `Camera` / `ScanLine` |
| レシピ | `BookOpen` |
| 設定 | `Settings` |
| 戻る | `ChevronLeft` |
| 検索 | `Search` |
| フィルタ | `SlidersHorizontal` |
| 送信 | `Send` |
| 画像追加 | `ImagePlus` |
| 星 / レア度 | `Star` |
| 発色力 | `Sparkles` |
| 持続力 | `Droplets` |
| ナチュラルさ | `Eye` |
| 製品寿命 | `Timer` |

---

## 2. 画面遷移フロー

### 2.1 全体マップ

```
[S01 ログイン]
    │
    ├── 初回 → [S02 オンボーディング] → [S03 ホーム]
    │
    └── 2回目以降 → [S03 ホーム（チャット）]
                        │
                        ├── BottomNav → [S06 在庫一覧]
                        │                  └── tap → [S07 アイテム詳細]
                        │
                        ├── BottomNav → [S04 コスメスキャン]
                        │                  └── 解析完了 → [S05 鑑定演出+確認]
                        │                                   └── 登録 → [S06 在庫一覧]
                        │
                        ├── BottomNav → [S09 レシピ一覧]
                        │                  └── tap → [S08 レシピカード]
                        │
                        ├── BottomNav → [S10 設定]
                        │
                        └── チャット内レシピ tap → [S08 レシピカード]
```

### 2.2 App Router パス

| パス | 画面 | レイアウト |
|------|------|----------|
| `/` | S01 ログイン | (auth) layout |
| `/onboarding` | S02 オンボーディング | (auth) layout |
| `/chat` | S03 ホーム（チャット） | (main) layout + BottomNav |
| `/scan` | S04 コスメスキャン | (main) layout（BottomNav 非表示） |
| `/scan/confirm` | S05 鑑定演出 + 確認 | (main) layout（BottomNav 非表示） |
| `/inventory` | S06 在庫一覧 | (main) layout + BottomNav |
| `/inventory/[itemId]` | S07 アイテム詳細 | (main) layout（BottomNav 非表示） |
| `/recipes` | S09 レシピ一覧 | (main) layout + BottomNav |
| `/recipes/[recipeId]` | S08 レシピカード | (main) layout（BottomNav 非表示） |
| `/settings` | S10 設定（一覧） | (main) layout + BottomNav |
| `/settings/edit/basic` | S10 基本情報編集 | (main) layout |
| `/settings/edit/beauty` | S10 ビューティプロフィール編集 | (main) layout |
| `/settings/edit/interests` | S10 興味関心・悩み編集 | (main) layout |
| `/settings/edit/agent` | S10 エージェントテーマ編集 | (main) layout |
| `/settings/edit/sns` | S10 SNSリンク編集 | (main) layout |
| `/settings/profile` | S10 公開プロフィール表示 | (main) layout |

---

## 3. 共通レイアウト

### 3.1 (main) レイアウト構造

```
┌──────────────────────────┐
│  SafeArea (top)          │ ← PWA ステータスバー考慮
├──────────────────────────┤
│                          │
│                          │
│     Page Content         │ ← スクロール領域
│     (min-h-screen)       │
│                          │
│                          │
├──────────────────────────┤
│  BottomNav (fixed)       │ ← h-16 / 64px
│  ┌────┬────┬────┬────┐   │
│  │Chat│Scan│Pack│ ⚙  │   │
│  │ 💬 │ 📷 │ 📦 │ ⚙  │   │
│  └────┴────┴────┴────┘   │
└──────────────────────────┘
```

### 3.2 BottomNav 仕様

```
File: components/bottom-nav.tsx
```

| タブ | ラベル | アイコン | パス | バッジ |
|------|--------|---------|------|--------|
| チャット | チャット | `MessageCircle` | `/chat` | 未読メッセージ数 |
| スキャン | スキャン | `Camera` | `/scan` | なし |
| 在庫 | コスメ | `Package` | `/inventory` | アイテム総数 |
| 設定 | マイページ | `Settings` | `/settings` | なし |

**shadcn:** カスタム実装（`fixed bottom-0`、`bg-white/80 backdrop-blur-md`）
**状態:** アクティブタブは `text-alcheme-rose`、非アクティブは `text-alcheme-muted`
**アニメーション:** アクティブアイコンは `scale(1.1)` + `font-weight: semibold`

### 3.3 ページヘッダー（詳細画面用）

```
┌──────────────────────────┐
│ ← 戻る    タイトル    ⋮  │  ← h-14
└──────────────────────────┘
```

**shadcn:** カスタム実装。`sticky top-0 z-50 bg-alcheme-cream/90 backdrop-blur-sm`
**戻るボタン:** `ChevronLeft` → `router.back()`
**⋮ メニュー:** `DropdownMenu`（編集・削除・シェア等）

---

## 4. S01: ランディング / ログイン

### 4.1 ワイヤーフレーム

```
┌──────────────────────────┐
│                          │
│                          │
│       ✦ alche:me ✦       │  ← ロゴ（Zen Maru Gothic, gold）
│                          │
│   手持ちコスメで、         │  ← サブコピー（text-sm, muted）
│   まだ見ぬ私に出会う      │
│                          │
│                          │
│  ┌──────────────────┐    │
│  │ 🔵 Googleでログイン │    │  ← shadcn Button variant="outline"
│  └──────────────────┘    │
│                          │
│  ┌──────────────────┐    │
│  │ ✉ メールでログイン  │    │  ← shadcn Button variant="outline"
│  └──────────────────┘    │
│                          │
│  新規登録はこちら →       │  ← text-xs リンク
│                          │
└──────────────────────────┘
```

### 4.2 コンポーネント仕様

| 要素 | shadcn/ui | Tailwind |
|------|-----------|---------|
| ロゴ | — | `font-display text-3xl font-bold text-alcheme-gold` |
| サブコピー | — | `text-sm text-alcheme-muted text-center leading-relaxed` |
| Google ボタン | `Button` variant="outline" size="lg" | `w-full rounded-[12px]` |
| Email ボタン | `Button` variant="outline" size="lg" | `w-full rounded-[12px]` |
| 新規登録リンク | — | `text-xs text-alcheme-rose underline` |

### 4.3 状態管理

```typescript
// hooks/use-auth.ts

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth の onAuthStateChanged をリッスン
  // ログイン後: onboardingCompleted ? /chat : /onboarding にリダイレクト
};
```

### 4.4 メール認証フォーム（ダイアログ）

```
shadcn: Dialog
内容:
  - Input (email) + Input (password)
  - Button (ログイン)
  - Separator + 「アカウントを作成」リンク
```

---

## 5. S02: オンボーディング

### 5.1 フロー（3ステップ）

```
Step 1/3                  Step 2/3                       Step 3/3
┌──────────────┐          ┌──────────────────┐          ┌──────────────┐
│              │          │                  │          │              │
│  あなたの    │          │  あなたのことを   │          │  最初の      │
│  お名前は？  │          │  教えてください   │          │  コスメを    │
│              │   ──→   │                  │   ──→   │  スキャン！  │
│  [入力]      │          │  肌質:           │          │              │
│              │          │  ○乾燥 ○脂性    │          │  📷 カメラ   │
│              │          │  ○混合 ○普通    │          │              │
│  [次へ]      │          │  ○敏感          │          │  あとで →    │
│              │          │                  │          │  [スキャン]  │
│              │          │  スキントーン:    │          │              │
│              │          │  ○色白 ○標準    │          │              │
│              │          │  ○やや暗め ○暗め│          │              │
│              │          │                  │          │              │
│              │          │  パーソナルカラー: │          │              │
│              │          │  [Select ▼]      │          │              │
│              │          │  (任意)          │          │              │
│              │          │                  │          │              │
│              │          │  [あとで設定 →]   │          │              │
│              │          │  [次へ]          │          │              │
└──────────────┘          └──────────────────┘          └──────────────┘
```

> **設計意図:** オンボーディングは離脱率を考慮し、コア情報のみに絞る。Step 2 の全項目は「あとで設定」でスキップ可能。詳細プロフィール（髪質・骨格・顔タイプ・SNS等）は S10 設定画面で段階的に入力を促す。

### 5.2 コンポーネント仕様

| 要素 | shadcn/ui | 備考 |
|------|-----------|------|
| ステップインジケーター | `Progress` | `value={step * 33}` |
| 名前入力 | `Input` | placeholder="ニックネーム" |
| 肌タイプ選択 | `ToggleGroup` type="single" | 5択（乾燥/脂性/混合/普通/敏感） |
| スキントーン | `ToggleGroup` type="single" | 4択（色白/標準/やや暗め/暗め） |
| パーソナルカラー | `Select` | イエベ春/イエベ秋/ブルベ夏/ブルベ冬/わからない |
| 次へボタン | `Button` | `bg-alcheme-rose text-white` |
| あとで設定リンク | — | `text-xs text-alcheme-muted`。Step 2 全体スキップ（全項目未設定で次へ） |
| スキップリンク | — | text-xs, muted（Step 3 用） |

### 5.3 State 更新

```typescript
// Step 3 完了時に Firestore を更新
await updateDoc(userRef, {
  displayName: name,
  skinType: skinType,         // null if skipped
  skinTone: skinTone,         // null if skipped
  personalColor: personalColor, // null if skipped
  onboardingCompleted: true,
});
```

---

## 6. S03: ホーム（チャット）

### 6.1 ワイヤーフレーム

```
┌──────────────────────────┐
│  alche:me      [avatar]  │  ← ヘッダー: ロゴ + ユーザーアバター
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │  ← AI メッセージ（左寄せ）
│  │ 🧪 おはようございます│  │
│  │ Eri さん！          │  │
│  │ 今日はどんなメイク   │  │
│  │ にしましょうか？✨   │  │
│  └────────────────────┘  │
│                          │
│     ┌─────────────────┐  │  ← ユーザーメッセージ（右寄せ）
│     │ TWICEみたいな    │  │
│     │ 韓国メイクしたい！│  │
│     └─────────────────┘  │
│                          │
│  ┌────────────────────┐  │  ← AI 思考中（ストリーミング）
│  │ 💭 考え中...       │  │
│  │ ▊                  │  │     カーソルブリンクアニメ
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │  ← レシピカード（インライン）
│  │ 📋 韓国風・純欲メイク│  │
│  │ match: 78%  ⏱ 15min│  │
│  │ [詳しく見る →]     │  │     tap → S08
│  └────────────────────┘  │
│                          │
├──────────────────────────┤
│  ┌──┐                   │  ← クイックアクションチップ
│  │📷│ 今日のメイク  時短 │
│  └──┘                   │
├──────────────────────────┤
│ [メッセージを入力...]  ➤ │  ← 入力エリア
├──────────────────────────┤
│  Chat │ Scan │ Pack │ ⚙  │
└──────────────────────────┘
```

### 6.2 コンポーネント仕様

#### チャットメッセージ

| 種別 | 配置 | 背景色 | 角丸 |
|------|------|--------|------|
| AI メッセージ | 左寄せ、max-w-[85%] | `bg-white` | `rounded-2xl rounded-bl-md` |
| ユーザーメッセージ | 右寄せ、max-w-[75%] | `bg-alcheme-rose/10` | `rounded-2xl rounded-br-md` |
| 思考中 | 左寄せ | `bg-white` | ストリーミングテキスト + ブリンクカーソル |
| レシピカード（埋め込み） | 左寄せ、max-w-[90%] | `bg-alcheme-sand` + border | タップで S08 に遷移 |

#### インラインレシピカード

```
┌─────────────────────────────────┐
│ 📋 韓国風・純欲メイク             │
│                                 │
│ ⭐ 再現度 78%   ⏱ 15分   難易度B │
│                                 │
│ 使用アイテム: EXCEL, rom&nd...  │
│                                 │
│ [詳しく見る →]                  │
└─────────────────────────────────┘

shadcn: Card + CardHeader + CardContent
Tailwind: border-alcheme-gold/30, hover:shadow-card-hover
```

#### 入力エリア

```
┌──────────────────────────────────────────┐
│ 📷 │  メッセージを入力...           │ ➤  │
└──────────────────────────────────────────┘

shadcn: Textarea (autoResize, 1行〜4行)
📷: ImagePlus アイコン → tap で画像アップロード（scan に遷移せずチャット内で対応）
➤: Send アイコン → メッセージ送信
```

#### クイックアクションチップ

```
┌──────────────────────────────────────────┐
│  [今日のメイク]  [時短5分]  [デートメイク] │
└──────────────────────────────────────────┘

shadcn: Badge variant="outline" (タップ可能)
Tailwind: cursor-pointer, hover:bg-alcheme-blush
機能: tap → テキストとして input に自動挿入して送信
初回表示時のみ表示。1回目の送信後に非表示。
```

### 6.3 状態管理

```typescript
// hooks/use-chat.ts

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recipeCard?: RecipeCardSummary;  // インラインレシピ
  isStreaming?: boolean;
}

const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const sendMessage = async (text: string, image?: File) => {
    // 1. ユーザーメッセージを追加
    // 2. POST /api/chat (SSE)
    // 3. ストリーミングで assistant メッセージを更新
    // 4. レシピ JSON が含まれていたら recipeCard を抽出
  };
};
```

### 6.4 SSE ストリーミング

```typescript
// BFF: app/api/chat/route.ts
// Content-Type: text/event-stream

// クライアント側:
const eventSource = new EventSource('/api/chat?sessionId=xxx');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'text_delta') { /* テキスト追加 */ }
  if (data.type === 'recipe_card') { /* レシピカード生成 */ }
  if (data.type === 'done') { eventSource.close(); }
};
```

---

## 7. S04: コスメスキャン

### 7.1 ワイヤーフレーム

```
┌──────────────────────────┐
│ ← 戻る    スキャン       │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │                    │  │
│  │   カメラプレビュー   │  │  ← 正方形、角丸 16px
│  │   または            │  │
│  │   画像プレースホルダ │  │
│  │                    │  │
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  ┌──────────┐ ┌────────┐ │
│  │ 📷 撮影  │ │🖼 選択  │ │  ← 2つのアクションボタン
│  └──────────┘ └────────┘ │
│                          │
│  ─── または ───          │
│                          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │  ここに画像を       │  │  ← ドラッグ＆ドロップ領域
│  │  ドラッグ＆ドロップ  │  │     （デスクトップ用）
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  💡 ポーチの中身を撮影   │  ← ヒントテキスト
│  すると、まとめて鑑定    │
│  できますよ✨            │
│                          │
│  ┌────────────────────┐  │
│  │   🔍 鑑定スタート    │  │  ← Button, disabled until image
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

### 7.2 コンポーネント仕様

| 要素 | shadcn/ui | 備考 |
|------|-----------|------|
| カメラプレビュー | — | `<video>` + getUserMedia API |
| 撮影ボタン | `Button` variant="default" | `bg-alcheme-rose`, Camera アイコン |
| ギャラリー選択 | `Button` variant="outline" | `<input type="file" accept="image/*">` を非表示で連携 |
| D&D 領域 | — | `border-2 border-dashed border-alcheme-muted/40` |
| 鑑定ボタン | `Button` size="lg" | `w-full bg-alcheme-gold text-white`, 画像未選択時 disabled |
| 画像プレビュー | — | 選択後に `object-cover rounded-card` で表示 |

### 7.3 カメラアクセス

```typescript
// components/scan-camera.tsx

// PWA でのカメラアクセス:
// 1. getUserMedia({ video: { facingMode: 'environment' } })
// 2. フォールバック: <input type="file" accept="image/*" capture="environment">
// 3. デスクトップ: ファイル選択 or D&D

// 画像前処理:
// - クライアント側で max 1024px にリサイズ
// - WebP に変換（対応ブラウザ）
// - Base64 エンコード
```

### 7.4 マルチ画像キャプチャ (Phase 5)

- 最大4枚の画像を保持（正面/背面/側面/開封状態）
- メイン画像を大きく表示 + サムネイルストリップ（2枚目以降）
- 各画像に × ボタンで個別削除
- 4枚未満で「+ 画像を追加」ボタン表示
- ヒント: 「複数の角度から撮影すると、より正確に鑑定できます（最大4枚）」

### 7.5 API 呼び出し

```typescript
// 鑑定スタート tap:
const result = await fetch('/api/inventory/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    images: images.map(img => ({ base64: img.base64, mime_type: img.mimeType })),
  }),
});
// → S05（鑑定演出 + 確認）に遷移
// → result.items を sessionStorage に保存して遷移
```

---

## 8. S05: 鑑定演出 + 確認

### 8.1 フェーズ A: 鑑定演出（3〜5秒）

```
┌──────────────────────────┐
│                          │
│                          │
│                          │
│      ✦ 鑑定中... ✦       │  ← パルスアニメーション
│                          │
│    ┌──────────────┐      │
│    │  コスメ画像   │      │  ← 回転 + グロウエフェクト
│    └──────────────┘      │
│                          │
│   アイテムを解析しています │  ← フェードイン・アウト
│                          │
│     ● ● ○  (1/3)        │  ← 鑑定プログレス
│                          │
└──────────────────────────┘
```

**演出シーケンス:**
1. 画像が中央に表示、ゴールドのグロウが脈動（0〜1秒）
2. 「鑑定中...」テキストが点滅（1〜3秒）
3. アイテムが1つずつ「発見」される（レア度に応じた演出）
4. 全完了後 → フェーズ B（確認画面）にスライド遷移

**レア度別演出:**

| レア度 | 演出 |
|--------|------|
| SSR ★★★★★ | ゴールド爆発パーティクル + 画面シェイク + 「✨✨ 伝説級アイテムを発見！！」 |
| SR ★★★★ | パープルのグロウ拡大 + 「✨ レアアイテムを発見！」 |
| R ★★★ | ブルーのソフトグロウ + 「頼れる定番アイテムですね！」 |
| N ★★ | シンプルなフェードイン + 「新しいアイテムを登録しました」 |

### 8.2 フェーズ B: 確認画面

```
┌──────────────────────────┐
│ ← 戻る  鑑定結果 (3件)   │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │  ← 鑑定済みアイテムカード
│  │ ★★★ R              │  │
│  │ KATE               │  │
│  │ リップモンスター     │  │
│  │ マットレッド        │  │
│  │                    │  │
│  │ 発色:4 持続:4 寿命:4 │  │  ← コスメスペックバー
│  │                    │  │
│  │ [✏️ 修正] [✓ OK]    │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ★★ N  ⚠️ 要確認     │  │  ← confidence: low のアイテム
│  │ 不明               │  │
│  │ ブラウンパレット     │  │
│  │                    │  │
│  │ 🔍 Web検索中...     │  │  ← Product Search Agent が稼働中
│  │                    │  │
│  │ [✏️ 手動入力] [✓ OK] │  │
│  └────────────────────┘  │
│                          │
│  ┌─────────┐ ┌──────────┐│
│  │キャンセル│ │N件を登録  ││  ← キャンセル + 件数表示CTA (Phase 5)
│  └─────────┘ └──────────┘│
│                          │
└──────────────────────────┘
```

### 8.3 鑑定結果カードのコンポーネント仕様

```
File: components/appraisal-card.tsx
```

| 要素 | shadcn/ui | 備考 |
|------|-----------|------|
| カード | `Card` | `border-l-4` + レア度カラー（SSR=gold, SR=purple, R=blue, N=gray） |
| レア度バッジ | `Badge` | 背景色=レア度カラー |
| ブランド名 | — | `text-xs text-alcheme-muted uppercase tracking-wider` |
| 商品名 | — | `text-base font-medium` |
| 色説明 | — | `text-sm text-alcheme-muted` |
| スペックバー | `Progress` × 4 | pigment=rose, longevity=blue, shelf_life=green, natural_finish=purple |
| 修正ボタン | `Button` variant="ghost" size="sm" | → 編集ダイアログ |
| OKボタン | `Button` variant="outline" size="sm" | チェック状態をトグル |
| confidence 警告 | `Badge` variant="destructive" | `⚠️ 要確認` |
| 登録ボタン | `Button` size="lg" | `w-full bg-alcheme-gold text-white` |

### 8.4 修正ダイアログ

```
shadcn: Sheet (bottom-up)

┌──────────────────────────┐
│  ── アイテムを修正 ──     │
│                          │
│  カテゴリ    [Select ▼]  │  ← ベースメイク/アイメイク/リップ/スキンケア/その他
│  アイテム種別 [Select ▼]  │  ← カテゴリ連動（31種 + その他）
│              PAO: 約Xヶ月 │  ← item_type から自動表示
│  ブランド    [Input    ]  │
│  商品名      [Input    ]  │
│  色          [Input    ]  │
│  質感        [Select ▼]  │  ← マット/ツヤ/サテン/シマー/クリーム/パウダー/リキッド
│  残量        [Select ▼]  │  ← 100%〜10%
│                          │
│  [保存]                  │
└──────────────────────────┘
```

---

## 9. S06: 在庫一覧

### 9.1 ワイヤーフレーム

```
┌──────────────────────────┐
│  コスメ (15)    [🔍] [⊕]│  ← タイトル + 検索 + 追加ボタン
├──────────────────────────┤
│ [All][Lip][Eye][Cheek]...│  ← カテゴリフィルタ（横スクロール）
├──────────────────────────┤
│                          │
│ ┌──────────┐ ┌──────────┐│  ← 2列グリッド
│ │ ★★★      │ │ ★★★      ││
│ │ [画像]   │ │ [画像]   ││
│ │ KATE     │ │ rom&nd   ││
│ │ リップ    │ │ ティント  ││
│ │ モンスター│ │ フィグ   ││
│ │ ████░░80%│ │ ███░░60% ││  ← 残量バー
│ └──────────┘ └──────────┘│
│                          │
│ ┌──────────┐ ┌──────────┐│
│ │ ★★★      │ │ ★★★      ││
│ │ [画像]   │ │ [画像]   ││
│ │ CANMAKE  │ │ EXCEL    ││
│ │ グロウ    │ │ スキニー  ││
│ │ チークス  │ │ リッチ   ││
│ │ ████░70% │ │ ██░░40%  ││
│ └──────────┘ └──────────┘│
│                          │
│        ...               │
│                          │
├──────────────────────────┤
│  Chat │ Scan │ Pack │ ⚙  │
└──────────────────────────┘
```

### 9.2 カテゴリフィルタ

```
File: components/category-filter.tsx
shadcn: Tabs (横スクロール)

Tailwind: overflow-x-auto, flex, gap-2, no-scrollbar
タブ: All(全て) / Lip / Eye / Cheek / Base / Other
アクティブ: bg-alcheme-rose text-white rounded-badge
非アクティブ: bg-alcheme-sand text-alcheme-charcoal rounded-badge
```

### 9.3 コスメカード（グリッド）

```
File: components/cosme-card.tsx
shadcn: Card
```

| 要素 | 仕様 |
|------|------|
| サイズ | 2列グリッド。`grid grid-cols-2 gap-3 px-4` |
| 画像エリア | `aspect-square rounded-t-card bg-alcheme-sand`。画像なしの場合カテゴリアイコンを中央配置 |
| レア度 | 左上に `Badge` オーバーレイ（小サイズ） |
| ブランド | `text-xs text-alcheme-muted uppercase tracking-wider` |
| 商品名 | `text-sm font-medium line-clamp-2` |
| 残量バー | `Progress` value={remaining}。色: >60% green, 40-60% yellow, <40% red |
| タップ | → S07（アイテム詳細）に遷移 |

### 9.4 検索

```
shadcn: Dialog (フルスクリーンモーダル on mobile)

入力: Input with Search アイコン
結果: リアルタイムフィルタ（クライアント側）
対象: brand + productName + colorDescription
```

### 9.5 状態管理

```typescript
// hooks/use-inventory.ts

const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Firestore onSnapshot でリアルタイム同期
  // フィルタ・検索はクライアント側で実行
};
```

---

## 10. S07: アイテム詳細

### 10.1 ワイヤーフレーム

```
┌──────────────────────────┐
│ ← 戻る   アイテム詳細  ⋮ │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │    コスメ画像      │  │  ← アスペクト比 4:3
│  │    (大きめ表示)     │  │
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  ★★★ R                  │  ← レア度 + バッジ
│  KATE                    │  ← ブランド
│  リップモンスター 03 陽炎  │  ← 商品名
│  マットレッド             │  ← 色説明
│                          │
│  ── スペック ──           │
│  ✦ 発色力    ████░░░ 4/5   │
│  💧 持続力    ████░░░ 4/5   │
│  ⏱ 製品寿命  ████░░░ 4/5   │
│  👁 ナチュラル ██░░░░░ 2/5   │
│                          │
│  ── 情報 ──              │
│  質感:    マット          │
│  残量:    80% ████████░░  │
│  登録日:  2026/02/10     │
│  使用回数: 12回           │
│                          │
│  ── このアイテムのレシピ ──│
│  ┌────────────────────┐  │
│  │ 韓国風・純欲メイク   │  │  ← このアイテムを含むレシピ一覧
│  │ match: 78%         │  │
│  └────────────────────┘  │
│                          │
│  [✏️ 編集]  [🗑 削除]     │
│                          │
└──────────────────────────┘
```

### 10.2 コンポーネント仕様

| 要素 | shadcn/ui | 備考 |
|------|-----------|------|
| 画像 | — | `aspect-[4/3] object-cover rounded-card` |
| レア度 | `Badge` | レア度カラー背景 |
| スペックバー | `Progress` × 4 | pigment=rose, longevity=blue, shelf_life=green, natural_finish=purple |
| 情報テーブル | — | `grid grid-cols-2 gap-y-2 text-sm` |
| 関連レシピ | `Card` (小) | タップで S08 に遷移 |
| 編集ボタン | `Button` variant="outline" | Sheet を開く（S05 の修正ダイアログと同じ） |
| 削除ボタン | `Button` variant="destructive" | 確認ダイアログ付き |

---

## 11. S08: レシピカード

### 11.1 ワイヤーフレーム

```
┌──────────────────────────┐
│ ← 戻る   レシピ       ⋮  │
├──────────────────────────┤
│                          │
│  韓国風・純欲メイク ✨     │  ← タイトル（display font）
│  デート × 大人っぽい      │  ← テーマタグ
│                          │
│  ┌────────────────────┐  │
│  │  再現度  78%       │  │  ← 大きめの円グラフ or 数字
│  │  ⏱ 15分  難易度 B  │  │
│  └────────────────────┘  │
│                          │
│  ── 💭 AIの思考 ──        │  ← 折りたたみ可能
│  ▸ 思考プロセスを見る     │
│                          │
│  ── 📋 ステップ ──        │
│                          │
│  ① ベース                │
│  ┌────────────────────┐  │
│  │ [img] PAUL & JOE   │  │  ← アイテム参照カード
│  │ プライマー           │  │
│  │ 下地を顔全体に薄く   │  │  ← instruction
│  │ 伸ばし...            │  │
│  └────────────────────┘  │
│                          │
│  ② アイ                  │
│  ┌────────────────────┐  │
│  │ [img] EXCEL        │  │
│  │ スキニーリッチ       │  │
│  │ ①ベージュをアイ     │  │
│  │ ホール全体に...      │  │
│  └────────────────────┘  │
│                          │
│  ③ アイ  🔄 代用テク     │  ← substitution バッジ
│  ┌────────────────────┐  │
│  │ [img] CANMAKE      │  │
│  │ グロウフルールチークス │  │
│  │ 【代用】チークを      │  │
│  │ 涙袋カラーとして...   │  │
│  │ ─────────────────── │  │
│  │ 💡 チークのシマー     │  │  ← substitution_note
│  │ 粒子が涙袋の         │  │
│  │ ぷっくり感を演出      │  │
│  └────────────────────┘  │
│                          │
│  ...（④〜⑥ 省略）        │
│                          │
│  ── 💡 プロのコツ ──      │
│  • チークを目元にも...   │
│  • rom&ndのティントは... │
│                          │
│  ── このレシピどうだった？ │
│  [💗 良い] [🤔 微妙] [😢]│  ← フィードバックボタン
│                          │
└──────────────────────────┘
```

### 11.2 コンポーネント仕様

#### ヘッダー部

| 要素 | shadcn/ui | 備考 |
|------|-----------|------|
| タイトル | — | `font-display text-xl font-bold` |
| テーマタグ | `Badge` × N | `variant="outline" rounded-badge` |
| 再現度 | — | `text-4xl font-bold text-alcheme-gold` + `%` |
| 時間・難易度 | — | `text-sm text-alcheme-muted` |

#### 思考プロセス（折りたたみ）

```
shadcn: なし（カスタム実装）
クリックで展開/折りたたみ。
展開時: 各思考ステップを「💭」付きのリストで表示。
Tailwind: bg-alcheme-sand/50 rounded-card p-4
```

#### レシピステップ

```
File: components/recipe-step-card.tsx
```

| 要素 | 仕様 |
|------|------|
| ステップ番号 | `w-8 h-8 rounded-full bg-alcheme-rose text-white` 中央揃え数字 |
| エリアラベル | `text-xs text-alcheme-muted uppercase` |
| アイテムカード | `Card` 内に画像サムネ(48x48) + ブランド + 商品名 |
| instruction | `text-sm leading-relaxed` |
| 代用バッジ | `Badge` `bg-alcheme-warning/20 text-alcheme-warning` + 🔄アイコン |
| 代用ノート | `bg-alcheme-sand rounded-lg p-3 text-xs` + 💡アイコン |

#### フィードバック

```
File: components/recipe-feedback.tsx
shadcn: ToggleGroup type="single"

3つのボタン:
  💗 良い   → "liked"
  🤔 微妙   → "neutral"
  😢 合わない → "disliked"

選択後: POST /api/recipes/{recipeId}/feedback
選択済み状態: 選択ボタンが filled に変化
```

---

## 12. S09: レシピ一覧

### 12.1 ワイヤーフレーム

```
┌──────────────────────────┐
│  レシピ (4)              │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │  ← レシピサマリカード（リスト形式）
│  │ 韓国風・純欲メイク   │  │
│  │ ⭐78% ⏱15min 💗     │  │
│  │ 2026/02/13          │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ 大人ローズブラウン   │  │
│  │ ⭐88% ⏱15min 🤔     │  │
│  │ 2026/02/12          │  │
│  └────────────────────┘  │
│                          │
│  ...                     │
│                          │
│  レシピがまだありません    │  ← 空状態
│  チャットでリクエスト     │
│  してみましょう✨        │
│                          │
├──────────────────────────┤
│  Chat │ Scan │ Pack │ ⚙  │
└──────────────────────────┘
```

### 12.2 コンポーネント仕様

| 要素 | shadcn/ui | 備考 |
|------|-----------|------|
| カード | `Card` | `hover:shadow-card-hover` タップで S08 |
| タイトル | — | `font-medium text-base` |
| スコア | — | `text-alcheme-gold font-bold` |
| 時間 | — | `text-xs text-alcheme-muted` |
| フィードバック | — | 💗/🤔/😢 のアイコン表示 |
| 日付 | — | `text-xs text-alcheme-muted` |
| 空状態 | — | 中央配置、イラスト + テキスト + CTA |

---

## 13. S10: 設定 / プロフィール

### 13.1 構成

設定は**階層型ナビゲーション**で実装。`/settings` がLIPS風のプロフィール一覧（リスト表示）として機能し、各セクションの編集は `/settings/edit/{section}` サブページに遷移する。公開プロフィール表示は `/settings/profile` で確認可能。

**ルート構成:**
```
/settings                    → プロフィール一覧（リスト表示）
/settings/edit/basic         → 基本情報編集
/settings/edit/beauty        → ビューティプロフィール編集
/settings/edit/interests     → 興味関心・悩み編集
/settings/edit/agent         → エージェントテーマ編集
/settings/edit/sns           → SNSリンク編集
/settings/profile            → 公開プロフィール表示（読み取り専用）
```

**ファイル構成:**
```
app/(main)/settings/
├── page.tsx                    # 一覧ページ（プロフィールカード + セクション行）
├── constants.ts                # 全選択肢データ
├── utils.ts                    # calcAgeRange, calcCompletionRate等のユーティリティ
├── use-settings-form.ts        # フォーム状態管理カスタムhook
├── profile/
│   └── page.tsx                # 公開プロフィール表示
├── edit/
│   ├── basic/page.tsx          # 基本情報編集
│   ├── beauty/page.tsx         # ビューティプロフィール編集
│   ├── interests/page.tsx      # 興味関心・悩み編集
│   ├── agent/page.tsx          # エージェントテーマ編集
│   └── sns/page.tsx            # SNSリンク編集
└── _components/
    ├── avatar-upload.tsx       # プロフィール画像アップロード（Firebase Storage + リサイズ）
    ├── profile-row.tsx         # ChevronRight付きナビゲーション行
    ├── visibility-checkbox.tsx  # 公開/非公開チェックボックス（共通部品）
    ├── basic-info-section.tsx   # ニックネーム・性別・生年月日
    ├── beauty-profile-section.tsx # 肌質・スキントーン(カラーサークル)・パーソナルカラー・顔タイプ
    ├── interests-section.tsx    # 興味関心タグ・悩みタグ（各最大5件）
    ├── agent-theme-section.tsx  # エージェントテーマ選択
    ├── sns-links-section.tsx    # SNS 5種入力
    └── data-stats-section.tsx   # コスメ数・レシピ数統計
```

### 13.2 一覧ページ（/settings）

プロフィールカード（アバター・名前・サマリー）を上部に配置し、その下にセクション行を並べる。各行はタップで対応する編集ページに遷移する。

**レイアウト:**
- プロフィールカード: glass-card + `AvatarUpload`（プロフィール画像アップロード/変更） + 名前 + 完了度バッジ（`calcCompletionRate` — グラデーション `from-magic-pink to-magic-purple`） + 「プロフィールを見る」リンク
- セクション行: `ProfileRow` コンポーネント (アイコン + ラベル + サマリー + ChevronRight)
- データ統計: インライン表示（遷移なし）
- ログアウトボタン

### 13.3 編集ページ

各編集ページは `PageHeader` (backHref="/settings") + 該当セクションコンポーネント + 保存ボタンで構成。保存成功後は `/settings` に自動遷移。

### 13.4 セクション仕様

| セクション | フィールド | UI | 公開/非公開 |
|-----------|-----------|-----|-----------|
| 基本情報 | ニックネーム | テキスト入力 | — |
| | 性別 (男性/女性/その他) | ピルボタン3択 | チェックボックス |
| | 生年月日 | ネイティブデートピッカー (`type="date"`) + 自動年齢レンジバッジ | チェックボックス |
| ビューティプロフィール | 肌質 (6種) | ピルボタン | チェックボックス |
| | スキントーン (5段階) | **カラーサークル** (視覚的選択) | チェックボックス |
| | パーソナルカラー (5種) | ピルボタン | チェックボックス |
| | 顔タイプ (9種) | ピルボタン | — |
| 興味関心・悩み | 興味タグ (22種, 最大5件) | マルチセレクトピルボタン + 選択済みチップ表示 | チェックボックス |
| | 悩みタグ (10種, 最大5件) | マルチセレクトピルボタン | (同上) |
| エージェントテーマ | 親友系/K-POP系/メイドさん | カード選択UI | — |
| SNSリンク | Twitter, Instagram, YouTube, TikTok, Webサイト | テキスト入力 × 5 | — |
| プロフィール画像 | photoURL | `AvatarUpload` (Firebase Storage, 256px JPEG 0.85) | — |
| データ | コスメ数, レシピ数 | glass-card 統計表示 | — |

### 13.5 公開プロフィールページ（/settings/profile）

LIPS風の行レイアウト。`profileVisibility` の各フラグが `true`（デフォルト）のフィールドのみを表示する読み取り専用ビュー。

**レイアウト:**
- 上部: アバター画像（`photoURL` or プレースホルダー） + 表示名
- 本体: `glass-card rounded-2xl divide-y` で行区切り表示。各行: ラベル（左） | 値 + 「公開」バッジ（右）
- 値なしの場合: 「未設定」をグレーテキストで表示
- スキントーン: カラーサークル（`backgroundColor` style属性） + ラベル
- 興味関心・悩み: `rounded-full` タグチップをflex-wrap表示
- SNSリンク: 別 `glass-card` ブロックに行表示

表示項目: ニックネーム、性別、年齢レンジ（生年月日 + `calcAgeRange`）、肌質、スキントーン、パーソナルカラー、顔タイプ、興味関心・悩み、SNSリンク。

### 13.6 デザインパターン

- **ピルボタン**: `rounded-full px-3 py-1.5` + 選択時 `bg-text-ink text-white shadow-md`（高コントラスト）
- **カラーサークル**: `w-12 h-12 rounded-full` + 背景色は `style={{ backgroundColor }}` + 選択時 `border-text-ink ring-2`
- **公開/非公開チェックボックス**: `<input type="checkbox">` + `accent-neon-accent` + ラベル「〜をプロフィールに表示しない」
- **タグチップ（選択済み）**: `bg-text-ink text-white rounded-full` + X ボタンで削除可能
- **保存ボタン**: グラデーション紫 (`bg-linear-to-r from-neon-accent via-purple-500`) + `shadow-neon-glow`
- **ナビゲーション行**: アイコン + ラベル + サマリー + ChevronRight
- **アバターアップロード**: `AvatarUpload` — カメラオーバーレイ表示、タップでファイル選択、Firebase Storage に `profile-photos/{userId}/avatar.jpg` で保存、canvas リサイズ（最大256px, JPEG 0.85品質）
- **完了度バッジ**: グラデーション（`from-magic-pink to-magic-purple`）+ 白テキスト `完了度: XX%`、`calcCompletionRate()` で11項目チェック

> **設計意図:** オンボーディングでは最小限（名前・肌質・スキントーン・PC）のみ取得し、詳細プロフィールはこの設定画面で段階的に入力を促す。LIPS風の階層構造により、一覧で全体を俯瞰しつつ各セクションを個別に編集できる。公開プロフィールページで他ユーザーからの見え方を事前確認可能。

---

## 14. アニメーション仕様

### 14.1 使用ライブラリ

CSS Transitions + Tailwind の `animate-*` を基本とする。複雑なアニメーションは `framer-motion` を使用。

```bash
npm install framer-motion
```

### 14.2 鑑定演出（appraisal-effect.tsx）

```typescript
// components/appraisal-effect.tsx

// Phase 1: CSS アニメーションで実装
// Phase 2: Canvas パーティクルに昇格

// アニメーション定義:
const animations = {
  // 画像のパルス（グロウ拡縮）
  pulse: {
    boxShadow: [
      '0 0 0px rgba(201,169,110,0)',
      '0 0 40px rgba(201,169,110,0.4)',
      '0 0 0px rgba(201,169,110,0)',
    ],
    transition: { duration: 1.5, repeat: Infinity },
  },

  // カード登場（下からスライドイン）
  cardReveal: {
    initial: { opacity: 0, y: 40, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },

  // SSR 発見時の画面フラッシュ
  ssrFlash: {
    initial: { opacity: 0 },
    animate: { opacity: [0, 0.6, 0] },
    transition: { duration: 0.4 },
    className: 'fixed inset-0 bg-alcheme-ssr/30 z-50 pointer-events-none',
  },
};
```

### 14.3 共通トランジション

| 対象 | アニメーション | 実装 |
|------|-------------|------|
| ページ遷移 | フェード + スライド | Tailwind `transition-all duration-300` |
| カードホバー | シャドウ拡大 | `hover:shadow-card-hover transition-shadow` |
| ボタンタップ | スケール縮小 | `active:scale-95 transition-transform` |
| スケルトン | パルスシマー | shadcn `Skeleton` |
| トースト | 右下からスライドイン | shadcn `Toast` |
| BottomSheet | 下からスライドアップ | shadcn `Sheet` |
| メッセージ追加 | 下からフェードイン | `animate-in fade-in slide-in-from-bottom-2` |

### 14.4 ローディング状態

| 画面 | ローディング表現 |
|------|----------------|
| チャット（AI応答中） | ストリーミングテキスト + ブリンクカーソル `▊` |
| スキャン（解析中） | 鑑定演出アニメーション（§14.2） |
| 在庫一覧（初回） | Skeleton カード × 4（2列グリッド） |
| レシピ生成中 | チャット内で「💭 考え中...」+ パルスドット |
| 画像アップロード | Progress バー + パーセント |

---

## 15. 状態管理設計

### 15.1 方針

React 19 の組み込み機能 + SWR で管理。外部の状態管理ライブラリ（Redux, Zustand 等）は Phase 1 では使用しない。

```
npm install swr
```

### 15.2 データフロー

```
[Firestore] ←→ [SWR Cache] ←→ [React Component]
                    ↑
            [Server Action / API Route]
```

### 15.3 カスタム Hooks 一覧

| Hook | 責務 | データソース |
|------|------|-----------|
| `useAuth()` | 認証状態、ユーザー情報 | Firebase Auth `onAuthStateChanged` |
| `useInventory()` | 在庫一覧、フィルタ、検索 | Firestore `onSnapshot` via SWR |
| `useInventoryItem(itemId)` | 単一アイテム詳細 | Firestore `getDoc` via SWR |
| `useChat()` | チャット履歴、送信、SSE | ローカル state + SSE |
| `useRecipes()` | レシピ一覧 | Firestore via SWR |
| `useRecipe(recipeId)` | 単一レシピ詳細 | Firestore via SWR |

### 15.4 楽観的更新

```typescript
// 例: フィードバック送信
const submitFeedback = async (recipeId: string, rating: string) => {
  // 1. UI を即座に更新（楽観的）
  mutate(`/api/recipes/${recipeId}`, (prev) => ({
    ...prev,
    feedback: { ...prev.feedback, userRating: rating },
  }), false);

  // 2. API 送信
  await fetch(`/api/recipes/${recipeId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  });

  // 3. 再検証
  mutate(`/api/recipes/${recipeId}`);
};
```

---

## 16. コンポーネント→ファイル対応表

```
frontend/src/
├── app/
│   ├── layout.tsx                    # ルートレイアウト（フォント、メタ）
│   ├── (auth)/
│   │   ├── layout.tsx                # 認証レイアウト（中央配置）
│   │   ├── login/page.tsx            # S01
│   │   ├── signup/page.tsx           # S01（サインアップ）
│   │   └── onboarding/page.tsx       # S02
│   ├── (main)/
│   │   ├── layout.tsx                # メインレイアウト（BottomNav）
│   │   ├── chat/page.tsx             # S03
│   │   ├── scan/
│   │   │   ├── page.tsx              # S04
│   │   │   └── confirm/page.tsx      # S05
│   │   ├── inventory/
│   │   │   ├── page.tsx              # S06
│   │   │   └── [itemId]/page.tsx     # S07
│   │   ├── recipes/
│   │   │   ├── page.tsx              # S09
│   │   │   └── [recipeId]/page.tsx   # S08
│   │   └── settings/                 # S10 (階層型)
│   │       ├── page.tsx              # 一覧ページ
│   │       ├── constants.ts          # 選択肢データ
│   │       ├── utils.ts              # calcAgeRange, calcCompletionRate
│   │       ├── use-settings-form.ts  # フォーム状態管理hook
│   │       ├── profile/page.tsx      # 公開プロフィール(LIPS風)
│   │       ├── edit/basic/page.tsx   # 基本情報編集
│   │       ├── edit/beauty/page.tsx  # ビューティ編集
│   │       ├── edit/interests/page.tsx # 興味関心編集
│   │       ├── edit/agent/page.tsx   # エージェントテーマ編集
│   │       ├── edit/sns/page.tsx     # SNSリンク編集
│   │       └── _components/          # avatar-upload, profile-row, sections...
│   └── api/                          # BFF Routes
│       ├── auth/session/route.ts
│       ├── inventory/
│       │   ├── route.ts              # GET (一覧)
│       │   ├── scan/route.ts         # POST (スキャン)
│       │   ├── confirm/route.ts      # POST (登録確定)
│       │   └── [itemId]/route.ts     # PATCH, DELETE
│       ├── chat/route.ts             # POST (SSE)
│       └── recipes/
│           ├── route.ts              # GET (一覧)
│           └── [recipeId]/
│               ├── route.ts          # GET (詳細)
│               └── feedback/route.ts # POST (評価)
│
├── components/
│   ├── ui/                           # shadcn/ui (自動生成)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── tabs.tsx
│   │   ├── progress.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   ├── select.tsx
│   │   ├── toggle-group.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── scroll-area.tsx
│   │   └── separator.tsx
│   │
│   ├── bottom-nav.tsx                # BottomNav (§3.2)
│   ├── page-header.tsx               # ページヘッダー (§3.3)
│   ├── cosme-card.tsx                # コスメカード (§9.3)
│   ├── cosme-card-mini.tsx           # ミニカード（レシピステップ内）
│   ├── appraisal-card.tsx            # 鑑定結果カード (§8.3)
│   ├── appraisal-effect.tsx          # 鑑定演出アニメーション (§14.2)
│   ├── recipe-card-inline.tsx        # チャット内レシピカード (§6.2)
│   ├── recipe-step-card.tsx          # レシピステップ (§11.2)
│   ├── recipe-feedback.tsx           # フィードバックボタン (§11.2)
│   ├── stat-bar.tsx                  # コスメスペックバー (共通)
│   ├── rarity-badge.tsx              # レア度バッジ (共通)
│   ├── category-filter.tsx           # カテゴリフィルタ (§9.2)
│   ├── remaining-bar.tsx             # 残量バー (共通)
│   ├── chat-message.tsx              # チャットメッセージ (§6.2)
│   ├── chat-input.tsx                # チャット入力 (§6.2)
│   ├── quick-action-chips.tsx        # クイックアクション (§6.2)
│   ├── scan-camera.tsx               # カメラ/画像入力 (§7.3)
│   ├── item-edit-sheet.tsx           # アイテム編集シート (§8.4)
│   ├── empty-state.tsx               # 空状態表示 (共通)
│   └── loading-skeleton.tsx          # スケルトンローダー (共通)
│
├── hooks/
│   ├── use-auth.ts                   # §4.3
│   ├── use-inventory.ts              # §9.5
│   ├── use-chat.ts                   # §6.3
│   └── use-recipes.ts               # (同パターン)
│
├── lib/
│   ├── firebase.ts                   # Firebase 初期化
│   ├── auth.ts                       # 認証ヘルパー
│   ├── firestore.ts                  # Firestore ヘルパー
│   └── api-client.ts                 # fetch ラッパー
│
└── types/
    ├── inventory.ts                  # InventoryItem, Category
    ├── recipe.ts                     # RecipeCard, RecipeStep
    └── chat.ts                       # ChatMessage
```

---

## Appendix A: PWA 設定

### manifest.json

```json
{
  "name": "alche:me",
  "short_name": "alche:me",
  "description": "手持ちコスメで、まだ見ぬ私に出会う",
  "start_url": "/chat",
  "display": "standalone",
  "background_color": "#FFF8F3",
  "theme_color": "#C9A96E",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### next.config.ts での PWA

```typescript
// next-pwa または @serwist/next を使用
// Service Worker: 画像キャッシュ + オフラインフォールバック
```

## Appendix B: レスポンシブブレークポイント

| ブレークポイント | 幅 | 対応 |
|---------------|------|------|
| `mobile` (default) | < 640px | メインターゲット。全画面はこれ基準 |
| `sm` | 640px+ | タブレット横。グリッド 3 列 |
| `md` | 768px+ | デスクトップ。サイドバー表示 |
| `lg` | 1024px+ | デスクトップ。max-w-lg で中央配置 |

**Phase 1 方針:** モバイルのみ完全対応。デスクトップは `max-w-md mx-auto` でモバイル幅に制限。

---

*— End of Document —*
*Version 2.0 | Last Updated: 2026-02-14*
