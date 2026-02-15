# alche:me — Design Doc（技術設計書）

| | |
|---|---|
| **Version** | 1.2 |
| **Date** | 2026-02-16 |
| **Author** | Eri Kaneko (Product Owner) |
| **Status** | Phase 2 Beta Complete (Batch 0.5〜8.5) |
| **Related** | alcheme_PRD_v4.md, alcheme_rollout-plan_phase-0.md |

> 本ドキュメントは、alche:me の技術的な実現方法を詳細に記述するDesign Docである。PRD v4 に定義された要件を、どのようなアーキテクチャ・技術スタック・データモデルで実現するかを明確にする。

---

## Table of Contents

1. [概要と目的](#1-概要と目的)
2. [システムアーキテクチャ](#2-システムアーキテクチャ)
3. [技術スタック選定理由](#3-技術スタック選定理由)
4. [データモデル / スキーマ設計](#4-データモデル--スキーマ設計)
5. [API設計](#5-api設計)
6. [AIエージェント設計](#6-aiエージェント設計)
7. [セキュリティ考慮事項](#7-セキュリティ考慮事項)
8. [パフォーマンス要件](#8-パフォーマンス要件)
9. [テスト戦略](#9-テスト戦略)
10. [デプロイメント戦略](#10-デプロイメント戦略)

---

## 1. 概要と目的

### 1.1 本ドキュメントの目的

PRD v4 で定義された alche:me のフルビジョン（16+エージェント構成、SNS/コミュニティ機能、EC連携、B2Bデータインテリジェンス）を技術的に実現するための設計指針を示す。Phase 0（Zennハッカソンプロトタイプ）で実証されたコアロジックを基盤に、Phase 1〜4 にわたる段階的な拡張を見据えた設計とする。

### 1.2 設計原則

1. **Progressive Enhancement（段階的拡張）:** Phase 1 の最小構成から始め、エージェント追加・機能拡張が既存コードを壊さずに行える設計。
2. **Agent-First Architecture:** 単一のモノリシックAIではなく、専門化されたエージェント群の協調動作を前提とする。ADK のマルチエージェントパターンをフル活用。
3. **Data as Asset:** ユーザーの在庫・使用・フィードバックデータを構造化して蓄積し、AI精度向上・B2Bインテリジェンス・SNS機能の基盤とする。
4. **Mobile-First PWA:** 毎朝の鏡の前で使う想定。スマホでの操作性を最優先に設計。
5. **Cost-Aware AI:** Gemini Flash モデルを軽量タスクに、Pro を高精度タスクに使い分け、APIコストを最適化する。

### 1.3 スコープ

本ドキュメントは以下を対象とする。

- Phase 1（MVP）で実装する技術構成の詳細設計
- Phase 2〜4 で拡張する際のアーキテクチャガイドライン
- 全フェーズ共通のデータモデル・API設計・セキュリティ方針

---

## 2. システムアーキテクチャ

### 2.1 アーキテクチャ概要

BFF（Backend for Frontend）パターンを採用する。Next.js API Routes がフロントエンドのリクエストを仲介し、ADKエージェント群は **Cloud Run 上の FastAPI + ADK Runner** でホストする。Cloud Run のコンテナベースインフラにより、柔軟なデプロイ・自動スケーリング・カスタムミドルウェア（SSEストリーミング、セッション管理等）を実現する。

> **注記 (2026-02-16):** 当初 Vertex AI Agent Engine の利用を検討したが（ADR-002参照）、SSEストリーミングやカスタムセッション管理の要件から Cloud Run + FastAPI + ADK Runner 構成を採用した。

### 2.2 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                  Client Layer                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Next.js 16 (React 19) + PWA                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ カメラ/   │ │ チャット │ │ レシピ   │ │ SNS/     │   │   │
│  │  │ 画像入力  │ │ UI      │ │ カード   │ │ コミュニ │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │  Tailwind CSS + shadcn/ui + モバイルファースト設計        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTPS (REST + SSE)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              BFF Layer (Next.js API Routes)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  認証ミドルウェア (Firebase Auth Token 検証)              │   │
│  │  セッション管理 / レート制限 / リクエスト整形              │   │
│  │  画像アップロード (Cloud Storage 直接 or signed URL)      │   │
│  │  Cloud Run Agent Server 呼び出し / SSEストリーミング      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ REST (X-API-Key 認証)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│           Cloud Run — Agent Server (FastAPI + ADK Runner)         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          FastAPI + Google ADK Runner (Python)              │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │      Root Agent (Concierge / Conductor)          │     │   │
│  │  │  ┌───────────────────────────────────────────┐  │     │   │
│  │  │  │  Phase 1: 資産化                           │  │     │   │
│  │  │  │  ┌────────────┐ ┌──────────────────────┐  │  │     │   │
│  │  │  │  │ Inventory  │ │ Product Search       │  │  │     │   │
│  │  │  │  │ Manager    │ │ (google_search)      │  │  │     │   │
│  │  │  │  └────────────┘ └──────────────────────┘  │  │     │   │
│  │  │  └───────────────────────────────────────────┘  │     │   │
│  │  │  ┌───────────────────────────────────────────┐  │     │   │
│  │  │  │  Phase 2: 調合 (The Alchemy)              │  │     │   │
│  │  │  │  ┌────────────┐                            │  │     │   │
│  │  │  │  │ Cosmetic   │                            │  │     │   │
│  │  │  │  │ Alchemist  │                            │  │     │   │
│  │  │  │  └────────────┘                            │  │     │   │
│  │  │  └───────────────────────────────────────────┘  │     │   │
│  │  │  ┌───────────────────────────────────────────┐  │     │   │
│  │  │  │  Phase 4: 体験出力                         │  │     │   │
│  │  │  │  ┌────────────┐                            │  │     │   │
│  │  │  │  │ Simulator  │ (Gemini 2.5 Flash Image)  │  │     │   │
│  │  │  │  └────────────┘                            │  │     │   │
│  │  │  └───────────────────────────────────────────┘  │     │   │
│  │  └─────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Cloud Firestore │ │ Cloud Storage│ │ External APIs    │
│  ─────────────── │ │ ──────────── │ │ ──────────────── │
│  users/          │ │ cosme-images/│ │ 楽天市場 API     │
│  inventories/    │ │ simulations/ │ │ Google Search    │
│  recipes/        │ │ avatars/     │ │ Weather API      │
│  beauty_logs/    │ │              │ │ Google Calendar  │
│  social/         │ │              │ │ Amazon API (将来)│
└──────────────────┘ └──────────────┘ └──────────────────┘
```

### 2.3 Phase別アーキテクチャ進化

| Phase | 追加コンポーネント | アーキテクチャ変更 |
|-------|------------------|-----------------|
| **Phase 1 (MVP)** ✅ | Inventory Manager, Product Search, Alchemist, Concierge | ✅ 完了 (2026-02-15)。Cloud Run (FastAPI + ADK Runner) + InMemorySessionService。 |
| **Phase 2 (Beta)** ✅ | Simulator, Memory Keeper, Trend Hunter, TPO Tactician, Profiler, Makeup Instructor + SNS + Beauty Log + UX改善 | ✅ Batch 0.5〜8.5 完了。Cloud Run 2サービス構成 (web + agent)。DatabaseSessionService (SQLite) + InMemoryMemoryService。SNS/フィード/フォロー/コメント。登録4パターン、フィルタ・ソート、テーマ提案タップUI。 |
| **Phase 3 (Launch)** | Content Curator, Health Monitor, Event Strategist, + SNS本格展開 | BigQuery によるB2Bデータ分析基盤。Cloud Tasks による非同期処理。Pub/Sub によるイベント駆動。 |
| **Phase 4 (Growth)** | EC連携、ネイティブアプリ、グローバル展開 | Cloud CDN + マルチリージョン。React Native or Flutter によるネイティブアプリ。Stripe/決済基盤。 |

---

## 3. 技術スタック選定理由

### 3.1 フロントエンド

| 技術 | 選定理由 |
|------|---------|
| **Next.js 16 (React 19)** | App Router によるサーバーコンポーネント。API Routes で BFF レイヤーを同一プロジェクトに統合。ISR/SSR による高速初期表示。React 19 の Suspense/Transitions で非同期UIを最適化。 |
| **TypeScript** | 型安全性。AIエージェントからの複雑なJSONレスポンスの型定義に必須。 |
| **Tailwind CSS + shadcn/ui** | 高速プロトタイピング。shadcn/ui は headless でカスタマイズ性が高く、コスメカードUIなどの独自デザインに対応。 |
| **PWA** | ネイティブアプリ開発前のモバイル対応。カメラアクセス、オフライン対応、ホーム画面追加。Service Worker によるキャッシュ戦略。 |

### 3.2 バックエンド / AI基盤

| 技術 | 選定理由 |
|------|---------|
| **Google ADK (Python)** | Googleの公式エージェント開発フレームワーク。マルチエージェント構成（Sequential/Parallel/Loop/Custom）を宣言的に定義可能。Gemini モデルとのネイティブ統合。Session/State/Artifact/Memory の組み込み管理。 |
| **Cloud Run + FastAPI** | ADK エージェントのホスティング。FastAPI でカスタム SSE ストリーミング、セッション管理、プログレス通知を実装。Cloud Build による自動デプロイ。ADK Runner でマルチエージェント協調を管理。 |
| **Gemini 2.5 Flash** | メイン推論モデル。高速・低コスト。画像認識、テキスト生成、JSON構造化出力に対応。Phase 0 で実用レベルを確認済み。 |
| **Gemini 2.5 Pro** | 高精度が求められるタスク（複雑な代用レシピ推論、Profiler の長期パターン分析等）に使用。 |
| **Gemini 2.5 Flash Image** | 仕上がりプレビュー・AIキャラクターイメージ生成。$0.039/image のコスト効率。GA済み。フォールバックとして Gemini 2.0 Flash（ネイティブ画像生成対応）も利用可能。 |

### 3.3 データベース / ストレージ

| 技術 | 選定理由 |
|------|---------|
| **Cloud Firestore** | リアルタイム同期（SNS機能に必須）。柔軟なスキーマ（コスメデータは多様）。オフライン対応（PWAと相性良好）。セキュリティルールによるクライアント直接アクセスも可能。 |
| **Cloud Storage** | コスメ画像・シミュレーション画像の保存。signed URL による安全なアップロード/ダウンロード。画像のリサイズ・変換は Cloud Functions で自動処理。 |
| **Vertex AI Vector Search** | コスメの多次元ベクトル（HSV + Texture）による類似検索。Dupe判定の精度向上。Growth Phase での導入を予定。MVP では Gemini の推論で代替。 |

### 3.4 認証 / セキュリティ

| 技術 | 選定理由 |
|------|---------|
| **Firebase Auth** | Email/Password + Google OAuth + Apple Sign-In。Next.js との統合が容易。Firestore セキュリティルールとの連携。 |

### 3.5 外部API

| API | 用途 | Phase |
|-----|------|-------|
| **Google Search (ADK built-in)** | 商品名・ブランド名の補完。トレンド情報の取得。 | Phase 1〜 |
| **楽天市場商品検索API（無料）** | コスメ商品の名称・価格・画像・レビュー取得。MVP段階での商品情報補完。 | Phase 1〜 |
| **Weather API (OpenWeatherMap等)** | TPO Tactician の天気取得。 | Phase 2〜 |
| **Google Calendar API** | TPO Tactician の予定取得。 | Phase 2〜 |
| **Amazon Product Advertising API** | 商品データの拡充（有料）。 | Phase 3〜 |

> **⚠️ SerpAPI 利用不可:** 2025年12月、Google が SerpAPI に対し DMCA違反で訴訟を提起。alche:me では利用しない方針。同種のスクレイピングサービスも回避する。

---

## 4. データモデル / スキーマ設計

### 4.1 Firestore コレクション構造

```
firestore/
├── users/                          # ユーザー情報
│   └── {userId}/
│       ├── profile                 # ユーザープロフィール（ドキュメント）
│       ├── settings                # アプリ設定
│       └── stats                   # 集計データ（在庫数、レシピ数等）
│
├── inventories/                    # コスメ在庫
│   └── {userId}/
│       └── items/
│           └── {itemId}            # 各コスメアイテム
│
├── recipes/                        # メイクレシピ
│   └── {recipeId}                  # レシピカード（公開/非公開）
│
├── beauty_logs/                    # メイクカレンダー
│   └── {userId}/
│       └── logs/
│           └── {date}              # 日次ログ
│
├── social/                         # SNS関連（Phase 2〜）
│   ├── posts/{postId}              # 公開レシピ投稿
│   ├── follows/{userId}/following/ # フォロー関係
│   ├── likes/{postId}/users/       # いいね
│   └── comments/{postId}/items/    # コメント
│
├── products/                       # 商品マスタ（ユーザー参加型DB）
│   └── {productId}                 # 商品情報（AI認識 + ユーザー補正の集約）
│
└── feedback/                       # AIフィードバック
    └── {feedbackId}                # レシピ評価・修正データ
```

### 4.2 主要ドキュメントスキーマ

#### ユーザープロフィール (`users/{userId}`)

> **実装**: `types/user.ts` の `UserProfile` インターフェース。ドキュメントID = Firebase Auth UID。

```typescript
interface UserProfile {
  displayName: string | null;
  bio: string | null;
  gender: string | null;           // "male" | "female" | "other"
  birthDate: string | null;        // "yyyy/mm/dd" 形式

  // 美容プロフィール
  skinType: string | null;         // "普通肌" | "脂性肌" | "乾燥肌" | "混合肌" | "敏感肌" | "アトピー肌"
  skinTone: string | null;         // "tone-1"〜"tone-5"（ビジュアルカラーサークル選択）
  personalColor: string | null;    // "spring" | "summer" | "autumn" | "winter" | "unknown"
  faceType: string | null;         // "キュート" | "アクティブキュート" | ... | "その他・わからない"
  hairType: string | null;
  bodyType: string | null;
  occupation: string | null;

  // 興味関心・悩み
  interests: string[];             // 最大5件、例: ["デパコス好き", "韓国コスメ好き"]
  concerns: string[];              // 最大5件、例: ["シミが気になる", "乾燥が気になる"]
  favoriteBrands: string[];

  // キャラクター設定
  agentTheme: "maid" | "kpop" | "bestfriend";

  // SNSリンク
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };

  // プロフィール公開設定（true = 公開）
  profileVisibility?: {
    gender?: boolean;
    ageRange?: boolean;
    skinType?: boolean;
    skinTone?: boolean;
    personalColor?: boolean;
    interests?: boolean;
  };

  onboardingCompleted: boolean;
  created_at?: string;
  updated_at?: string;
}
```

#### インベントリアイテム (`inventories/{userId}/items/{itemId}`)

```typescript
interface InventoryItem {
  id: string;
  userId: string;
  status: "HAVE" | "WANT" | "ARCHIVE";

  // 商品情報
  category: "Lip" | "Cheek" | "Eye" | "Base" | "Other";
  brand: string;
  productName: string;
  colorCode?: string;
  colorName?: string;
  colorDescription: string;
  texture: "matte" | "glossy" | "shimmer" | "cream" | "powder" | "liquid";
  price?: number;
  productId?: string;             // products コレクションへの参照

  // 状態管理
  estimatedRemaining: string;     // "80%" 等
  openDate?: string;              // ISO 8601
  useCount: number;
  costPerWear?: number;           // price ÷ useCount
  lastUsedAt?: Timestamp;

  // AI解析データ
  confidence: "high" | "medium" | "low";
  source: string;                 // "画像認識 + 楽天API" 等
  imageUrl?: string;              // Cloud Storage URL

  // ベクトル（Dupe判定・類似検索用）
  vector: {
    hue: number;                  // 0.0〜1.0
    saturation: number;
    value: number;
    textureScore: number;
  };

  // 衛生管理
  hygiene: {
    isOpened: boolean;
    openedAt?: string;
    paoMonths: number;            // Period After Opening
    expiryDate?: string;
    daysRemaining?: number;
    alertLevel: "safe" | "warning" | "expired";
  };

  // RPG的ステータス（エンゲージメント用）
  stats: {
    durability: "S" | "A" | "B" | "C";    // 耐久性（マット→高）
    versatility: "S" | "A" | "B" | "C";   // 汎用性
    trendScore: "S" | "A" | "B" | "C";    // トレンド度
  };

  // メタデータ
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### レシピカード (`recipes/{recipeId}`)

```typescript
interface RecipeCard {
  recipeId: string;
  authorId: string;
  parentRecipeId?: string;         // アレンジ元レシピID

  recipeName: string;
  thumbnailUrl?: string;
  aiCharacterImageUrl?: string;    // AIキャラクターイメージ
  message: string;

  matchScore: number;              // 再現度 0-100%
  thinkingProcess: string[];       // AIの思考プロセス

  steps: RecipeStep[];

  context: {
    weatherCompatibility: string[];
    occasion: string[];
    concernTags: string[];
    seasonality?: string;
  };

  proTips: string[];
  substitutionNotes: string[];

  // フィードバック
  feedback?: {
    userRating: "liked" | "neutral" | "disliked" | null;
    ratingDetail?: string;
    wasExecuted: boolean;
    modifications: string[];
  };

  // SNS用統計（Phase 2〜）
  stats: {
    totalCost?: number;
    arrangeCount: number;
    likeCount: number;
    commentCount: number;
    saveCount: number;
  };

  // 公開設定
  visibility: "private" | "public";
  publishedAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface RecipeStep {
  step: number;
  area: string;                    // "ベース", "アイ", "リップ" 等
  itemId: string;
  itemName?: string;
  instruction: string;
  substitutionNote?: string;
  technique?: string;              // "重ね塗り", "ぼかし" 等
}
```

#### Beauty Log (`beauty_logs/{userId}/logs/{date}`)

```typescript
interface BeautyLog {
  date: string;                    // "2026-02-13"
  userId: string;

  // AI提案
  proposedRecipeId?: string;
  proposedLookName?: string;

  // 実績
  executedRecipeId?: string;
  modifications: string[];
  actualItems: string[];           // 使用アイテムIDリスト

  // コンテキスト
  weather?: string;
  occasion?: string;
  mood?: string;

  // 評価
  selfRating?: 1 | 2 | 3 | 4 | 5;
  memo?: string;

  createdAt: Timestamp;
}
```

### 4.3 Cloud Storage バケット構造

```
gs://alcheme-{env}/
├── cosme-images/
│   └── {userId}/
│       └── {itemId}/
│           ├── original.jpg       # オリジナル画像
│           ├── thumbnail.webp     # サムネイル (200x200)
│           └── card.webp          # カード用 (400x400)
│
├── simulations/
│   └── {userId}/
│       └── {recipeId}.webp        # 仕上がりプレビュー画像
│
├── avatars/
│   └── {userId}/
│       └── avatar.webp            # AIキャラクター画像
│
└── social/                        # Phase 2〜
    └── posts/
        └── {postId}.webp          # SNS投稿画像
```

---

## 5. API設計

### 5.1 BFF (Next.js API Routes) エンドポイント

基本方針として、フロントエンドは Next.js API Routes（BFF）を経由して Cloud Run 上の FastAPI Agent Server と通信する。BFF は認証検証、レート制限、レスポンス整形を担当する。

#### 認証・ユーザー

| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/api/auth/session` | Firebase Auth Token → セッションCookie 発行 |
| DELETE | `/api/auth/session` | セッション破棄 |
| GET | `/api/users/me` | 自分のプロフィール取得 |
| PATCH | `/api/users/me` | プロフィール更新 |

#### インベントリ

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/inventory` | 在庫一覧取得（フィルタ・ソート対応） |
| POST | `/api/inventory/scan` | 画像アップロード → AI解析 → アイテム候補返却 |
| POST | `/api/inventory/confirm` | 解析結果を確認・修正して登録 |
| PATCH | `/api/inventory/{itemId}` | アイテム情報更新 |
| DELETE | `/api/inventory/{itemId}` | アイテム削除 |
| POST | `/api/inventory/{itemId}/use` | 使用記録（useCount++, lastUsedAt更新） |

#### エージェント対話

| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/api/chat` | Concierge Bot への自然言語メッセージ送信。SSE でストリーミングレスポンス。 |
| POST | `/api/recipe/generate` | 明示的なレシピ生成リクエスト（オケージョン・天気・テーマ指定可） |
| POST | `/api/recipe/{recipeId}/simulate` | 仕上がりプレビュー画像生成 |

#### レシピ

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/recipes` | 自分のレシピ一覧 |
| GET | `/api/recipes/{recipeId}` | レシピ詳細 |
| POST | `/api/recipes/{recipeId}/feedback` | ワンタップ評価 + 詳細フィードバック |
| POST | `/api/recipes/{recipeId}/publish` | レシピを公開 |

#### Beauty Log

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/beauty-log` | カレンダー形式でログ一覧取得 |
| POST | `/api/beauty-log` | 日次ログ記録 |
| PATCH | `/api/beauty-log/{date}` | ログ更新 |

#### SNS（Phase 2〜）

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/feed` | タイムライン取得 |
| POST | `/api/posts/{postId}/like` | いいね |
| POST | `/api/posts/{postId}/arrange` | アレンジ投稿（つくれぽ） |
| POST | `/api/users/{userId}/follow` | フォロー |

### 5.2 Agent Server との通信

BFF から Cloud Run Agent Server へは REST + SSE で通信する。Agent Server は FastAPI + ADK Runner で構成され、SSE イベントストリーミングでリアルタイムレスポンスを返す。

```python
# Agent Server (FastAPI) の実装パターン
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService

runner = Runner(
    agent=root_agent,
    app_name="alcheme",
    session_service=DatabaseSessionService(db_url=SESSION_DB_URL)
)

# SSE ストリーミングレスポンス
@app.post("/chat")
async def chat(request: ChatRequest):
    async def event_stream():
        async for event in runner.run_async(
            user_id=user_id,
            session_id=f"chat-{user_id}",
            new_message=Content(role="user", parts=[Part.from_text(message)])
        ):
            # SSE イベントタイプ: text_delta, recipe_card, preview_image, progress, done, error
            yield f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

BFF → Agent Server 間は `X-API-Key` ヘッダーによる共有シークレット認証（`AGENT_API_KEY` 環境変数）を使用。開発環境では省略可能。

---

## 6. AIエージェント設計

### 6.1 ADK エージェントツリー（全体像）

```
App (alcheme)
└── root_agent: Concierge Bot (LlmAgent - Gemini 2.5 Flash)
    │   ルーティング・対話窓口・コミュニケーションスタイル管理
    │
    ├── inventory_pipeline (SequentialAgent)
    │   │   画像入力 → 解析 → 補完 → 登録の直列処理
    │   │
    │   ├── inventory_manager (LlmAgent - Gemini 2.5 Flash)
    │   │     画像認識でコスメを鑑定。カテゴリ・色・質感を構造化。
    │   │     Tools: analyze_image, add_items_to_inventory
    │   │
    │   ├── product_search (LlmAgent - Gemini 2.5 Flash)  ★独立サブエージェント
    │   │     google_search ツールで商品名・色番号を補完。
    │   │     Tools: google_search (ADK built-in), search_rakuten_api
    │   │
    │   ├── freshness_guardian (LlmAgent - Gemini 2.5 Flash) [Phase 2]
    │   │     PAOルールに基づく使用期限チェック。
    │   │     Tools: check_expiry, send_alert
    │   │
    │   └── portfolio_analyst (LlmAgent - Gemini 2.5 Flash) [Phase 2]
    │         色相・テクスチャの偏り分析。不足カテゴリの指摘。
    │         Tools: analyze_portfolio
    │
    ├── alchemy_coordinator (LlmAgent - Gemini 2.5 Pro) [Coordinator パターン]
    │   │   ユーザーリクエストに応じて最適な調合エージェントにルーティング
    │   │
    │   ├── cosmetic_alchemist (LlmAgent - Gemini 2.5 Pro)
    │   │     手持ち在庫のみでレシピ作成。代用テクニック・重ね技。
    │   │     Hallucination厳禁ルール（在庫にないアイテムは使用不可）。
    │   │     Tools: get_inventory, search_inventory, validate_recipe_items
    │   │     Output: RecipeCard JSON
    │   │
    │   ├── dupe_stylist (LlmAgent - Gemini 2.5 Flash) [Phase 2]
    │   │     持っていないアイテムの代用案を提示。
    │   │     Tools: vector_search_similar (Vertex AI Vector Search)
    │   │
    │   └── stylist_agent (LlmAgent - Gemini 2.5 Flash) [Phase 2]
    │         手持ち90% + 買い足し10%のハイブリッドレシピ。
    │         Tools: search_rakuten_api, calculate_plus_one_impact
    │
    ├── context_gatherer (ParallelAgent) [Phase 2]
    │   │   並列で外部情報を収集
    │   │
    │   ├── trend_hunter (LlmAgent - Gemini 2.5 Flash)
    │   │     Tools: google_search (独立サブエージェント)
    │   │
    │   ├── tpo_tactician (LlmAgent - Gemini 2.5 Flash)
    │   │     Tools: get_weather, get_calendar_events
    │   │
    │   └── product_scout (LlmAgent - Gemini 2.5 Flash)
    │         Tools: search_rakuten_api, search_amazon_api
    │
    ├── experience_pipeline (SequentialAgent)
    │   │
    │   ├── simulator (LlmAgent - Gemini 2.5 Flash Image)
    │   │     レシピの仕上がりプレビュー画像を生成。
    │   │     AIキャラクターにメイクを施したイメージ画像。
    │   │     Tools: generate_preview_image
    │   │
    │   └── memory_keeper (LlmAgent - Gemini 2.5 Flash) [Phase 2]
    │         AI提案 vs 実績の差分を記録。
    │         Tools: save_beauty_log, update_item_usage
    │
    └── learning_agents (ParallelAgent) [Phase 2〜]
        │
        ├── profiler (Custom Agent - Gemini 2.5 Pro)
        │     履歴から好みの変化・マンネリを検知。
        │     VertexAiRagMemoryService でパターン学習。
        │
        ├── plus_one_advisor (LlmAgent - Gemini 2.5 Flash)
        │     買い足しROI最大のキーストーンアイテム提案。
        │
        ├── rescue_matcher (LlmAgent - Gemini 2.5 Flash)
        │     死蔵コスメの「相棒」を提案。
        │
        └── roi_visualizer (LlmAgent - Gemini 2.5 Flash)
              購入検討アイテムの投資対効果をネットワーク図で可視化。
```

### 6.2 Phase 1 MVP のエージェント詳細

#### Root Agent (Concierge Bot)

```python
from google.adk.agents import LlmAgent
from google.adk.apps import App

root_agent = LlmAgent(
    name="concierge",
    model="gemini-2.5-flash",
    description="alche:meのメイン対話窓口。ユーザーの意図を判定し、適切なサブエージェントにルーティングする。",
    instruction="""
    あなたは alche:me のコンシェルジュです。
    ユーザーの美容パートナーとして、温かく知的な対話を提供します。

    ## ルーティングルール:
    - 画像アップロード / コスメ登録 → inventory_pipeline に委譲
    - メイクレシピリクエスト / 「今日のメイク」 → alchemy_coordinator に委譲
    - 仕上がりプレビュー / シミュレーション → experience_pipeline に委譲
    - 在庫確認 / アイテム情報 → 直接ツールで対応

    ## コミュニケーションスタイル:
    - 親しみのある美容部員のような口調
    - ゲーム用語は使わず、美容文脈で自然なワーディング
    - 「こんなアイテムをお持ちだったんですね！」のような発見のワクワク感
    """,
    sub_agents=[inventory_pipeline, alchemy_coordinator, experience_pipeline],
    tools=[get_inventory_summary, search_inventory, filter_inventory_by_category]
)

app = App(agent=root_agent, name="alcheme")
```

#### google_search ツールの制約対応

ADK の `google_search` ツールは他ツールとの併用不可の制約があるため、Product Search Agent は独立サブエージェントとして設計する。

```python
from google.adk.tools import google_search

product_search_agent = LlmAgent(
    name="product_search",
    model="gemini-2.5-flash",
    description="コスメの商品名・ブランド名・色番号をGoogle検索と楽天APIで補完する。",
    instruction="画像認識で不明だった情報をWeb検索で特定してください。",
    tools=[google_search]  # google_search は単独割り当て
)
```

### 6.3 State管理戦略

ADK の State プレフィックスを活用し、スコープを明確に分離する。

| プレフィックス | スコープ | 用途 |
|-------------|---------|------|
| `app:` | アプリケーション全体 | 共通設定、PAOマスタデータ |
| `user:` | ユーザー永続 | パーソナルカラー、肌質、好み、在庫サマリ |
| `session:` (default) | 現在のセッション | 今回の会話コンテキスト、生成中のレシピ |
| `temp:` | 一時的 | エージェント間の中間データ受け渡し |

```python
# State 活用例: alchemy_coordinator
# 在庫データをStateに格納し、複数エージェント間で共有
def before_agent_callback(callback_context):
    """Alchemist 実行前に在庫データをStateにプリロード"""
    inventory = load_user_inventory(callback_context.state["user:uid"])
    callback_context.state["session:current_inventory"] = inventory
```

### 6.4 Artifact 管理

ADK の Artifact Service を活用し、セッション中に生成されるバイナリデータを管理する。

| Artifact | 内容 | ストレージ |
|----------|------|----------|
| コスメ画像 | ユーザーがアップロードした画像 | GcsArtifactService → Cloud Storage |
| シミュレーション画像 | Gemini Flash Image が生成した仕上がりプレビュー | GcsArtifactService → Cloud Storage |
| レシピJSON | Alchemist が生成した構造化レシピデータ | Session State に保持 → Firestore に永続化 |

### 6.5 Memory / 学習 (Phase 2〜)

```python
from google.adk.memory import VertexAiRagMemoryService

memory_service = VertexAiRagMemoryService(
    rag_corpus="alcheme-beauty-log"
)

# Beauty Log の蓄積 → パターン学習
# 「Eriさんは雨の日に暖色を選びがち」等の法則を検索可能にする
```

---

## 7. セキュリティ考慮事項

### 7.1 認証・認可

| レイヤー | 実装 |
|---------|------|
| **フロントエンド** | Firebase Auth SDK によるトークン管理。セッション Cookie（httpOnly, secure, SameSite=Strict）。 |
| **BFF** | 全 API Routes で Firebase Admin SDK による ID Token 検証。 |
| **Firestore** | セキュリティルールで `request.auth.uid == resource.data.userId` を強制。ユーザーは自分のデータのみアクセス可能。 |
| **Cloud Storage** | signed URL による期限付きアクセス。直接公開URLは原則使用しない。 |

### 7.2 データプライバシー

| 対策 | 詳細 |
|------|------|
| **顔写真の扱い** | 仕上がりプレビューは AIキャラクターイメージで代替。ユーザーの顔写真はサーバーに保存しない（端末内完結）。SNS共有時も顔は不要。 |
| **個人データの暗号化** | Firestore は Google Cloud のデフォルト暗号化（AES-256）を利用。特に機微な情報（肌の悩み等）は追加でフィールドレベル暗号化を検討。 |
| **B2Bデータ提供** | 匿名化・集計済みデータのみ提供。個人を特定可能な情報はエクスポートしない。 |
| **GDPR/個人情報保護法** | データ削除リクエスト対応。エクスポート機能。Cookie同意管理。 |

### 7.3 AIセーフティ

| 対策 | 詳細 |
|------|------|
| **Hallucination防止** | Alchemist Agent に「在庫にないアイテムは絶対に使用しない」ルールを厳格に適用。`validate_recipe_items` ツールでレシピ出力前にアイテムIDを検証。 |
| **肌トラブル防止** | Freshness Guardian が期限切れコスメの使用を警告。免責事項をUI上に明示。 |
| **不適切コンテンツ** | Gemini のセーフティフィルター + SNS投稿時のモデレーション。 |
| **Callback によるバリデーション** | `before_model_callback` / `after_model_callback` でエージェント出力をチェック。 |

### 7.4 レート制限

| 対象 | 制限 |
|------|------|
| Free ユーザー | AI API 呼び出し: 10回/日 |
| Premium ユーザー | AI API 呼び出し: 無制限（コスト上限あり） |
| 画像アップロード | 20枚/日 |
| SNS投稿 | 50件/日 |

---

## 8. パフォーマンス要件

### 8.1 レスポンスタイム目標

| 操作 | 目標 | 実現方法 |
|------|------|---------|
| **画像スキャン** (画像→AI解析→候補表示) | < 5秒 | Gemini 2.5 Flash の高速推論。画像リサイズをクライアント側で実施。 |
| **レシピ生成** (リクエスト→レシピJSON) | < 8秒 | Concierge → Alchemist のルーティング最適化。在庫データの事前キャッシュ。ストリーミング応答でUX上の待ち時間を短縮。 |
| **仕上がりプレビュー** (レシピ→画像生成) | < 10秒 | Gemini 2.5 Flash Image。非同期生成 + プレースホルダーUI。 |
| **在庫一覧表示** | < 1秒 | Firestore のインデックス最適化。クライアント側キャッシュ（React Query / SWR）。 |
| **SNSフィード** | < 2秒 | Firestore のリアルタイムリスナー + ページネーション。 |

### 8.2 スケーラビリティ

| フェーズ | 想定ユーザー数 | インフラ |
|---------|-------------|---------|
| Phase 1 | 50人 (クローズドβ) | Cloud Run 最小構成（web + agent 各1インスタンス）。Firestore 無料枠内。 |
| Phase 2 | 500人 (オープンβ) | Cloud Run 自動スケーリング。Firestore 有料プラン。 |
| Phase 3 | 5,000人 (ローンチ) | Cloud CDN + マルチインスタンス。BigQuery 連携。 |
| Phase 4 | 50,000人+ (グロース) | マルチリージョン。キャッシュ層追加（Redis / Memorystore）。 |

### 8.3 コスト最適化

| 戦略 | 詳細 |
|------|------|
| **モデル使い分け** | 軽量タスク（ルーティング、在庫検索、フィルタ）→ Flash。複雑推論（代用レシピ、パターン分析）→ Pro。 |
| **キャッシュ** | 同一在庫構成での類似リクエストをキャッシュ。商品マスタ情報のキャッシュ（楽天API呼び出し削減）。 |
| **バッチ処理** | 期限チェック、ポートフォリオ分析は夜間バッチで実行。 |
| **画像最適化** | アップロード時に WebP 変換 + リサイズ。サムネイル・カード用の自動生成。 |

### 8.4 Cloud Run コールドスタート対策

Cloud Run は初回リクエスト時にコンテナ起動のレイテンシが発生しうる。

| 対策 | 詳細 |
|------|------|
| **最小インスタンス数** | Cloud Run の `--min-instances=1` でインスタンスを常時稼働（Agent Server側は特に重要）。 |
| **フロントエンドUX** | 初回ロード時にスケルトンUIとアニメーションで体感待ち時間を短縮。「AIスタイリストが準備中...」の演出 + 回転ヒント。 |
| **リアルタイム進捗表示** | SSE `progress` イベントでツール実行状況をリアルタイム表示（「在庫を確認中...」「レシピを考え中...」等）。 |

---

## 9. テスト戦略

### 9.1 テストピラミッド

```
              ┌─────────┐
              │  E2E    │  Playwright / Cypress
              │  Tests  │  主要ユーザーフロー（画像スキャン→レシピ生成→保存）
              ├─────────┤
              │  API    │  Supertest / Vitest
              │  Tests  │  BFF エンドポイントの正常系・異常系
           ┌──┴─────────┴──┐
           │  Agent Eval   │  ADK 組み込み評価
           │  (ADK Eval)   │  マルチターン評価データセットによるエージェント精度測定
        ┌──┴───────────────┴──┐
        │  Integration Tests  │  Vitest
        │                     │  Firestore操作、Cloud Storage、外部API連携
     ┌──┴─────────────────────┴──┐
     │       Unit Tests          │  Vitest / pytest
     │                           │  ツール関数、バリデーション、ユーティリティ
     └───────────────────────────┘
```

### 9.2 ADK エージェント評価

ADK の組み込み評価機能を活用し、エージェントの品質を定量的に測定する。

```python
# 評価データセットの例
eval_dataset = [
    {
        "input": "今日は雨で商談があります。手持ちで崩れにくいメイクを教えて",
        "expected_tools": ["get_inventory", "search_inventory"],
        "expected_output_contains": ["マット", "パウダー", "崩れ"],
        "must_not_contain_items_outside_inventory": True
    },
    {
        "input": "[画像: コスメ5点]",
        "expected_tools": ["analyze_image", "google_search"],
        "expected_output_format": "inventory_item_json"
    }
]
```

### 9.3 テスト環境

| 環境 | 用途 | Firestore | Agent Server |
|------|------|-----------|--------------|
| **Local** | 開発・ユニットテスト | Firebase Emulator or 本番接続 | `uvicorn agent/server.py` (localhost:8080) |
| **Staging** | 統合テスト・QA | Firestore テスト用プロジェクト | Cloud Run (staging) |
| **Production** | 本番 | 本番 Firestore | Cloud Run (production) |

### 9.4 品質ゲート

リリース前に以下の品質ゲートをパスすることを必須とする。

| ゲート | 基準 |
|-------|------|
| **在庫Hallucination率** | 0%（在庫にないアイテムがレシピに含まれないこと） |
| **レシピ生成成功率** | 95%以上（有効なJSONが返却されること） |
| **画像認識精度** | 80%以上（カテゴリ・テクスチャの正答率） |
| **API レスポンスタイム** | P95 < 10秒 |
| **エラー率** | < 1% |

---

## 10. デプロイメント戦略

### 10.1 環境構成

```
┌────────────────────────────────────────────────────────┐
│                    GCP Project: alcheme-prod             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Cloud Run — Web Service                          │   │
│  │  - alcheme-web (Next.js フロントエンド + BFF)     │   │
│  │  - Dockerfile (Node.js, port 3000)                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Cloud Run — Agent Service                        │   │
│  │  - alcheme-agent (FastAPI + ADK Runner)           │   │
│  │  - agent/Dockerfile (Python, port 8080)           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Firebase                                         │   │
│  │  - Auth (認証)                                    │   │
│  │  - Firestore (データベース)                        │   │
│  │  - Cloud Storage (画像)                           │   │
│  │  - Cloud Functions (画像リサイズ、バッチ処理)      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Monitoring                                       │   │
│  │  - Cloud Monitoring (インフラ)                     │   │
│  │  - Cloud Logging (ログ)                           │   │
│  │  - Error Reporting (エラー追跡)                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└────────────────────────────────────────────────────────┘
```

### 10.2 CI/CD パイプライン

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  GitHub   │───▶│  GitHub   │───▶│  Staging  │───▶│Production │
│  Push     │    │  Actions  │    │  Deploy   │    │  Deploy   │
└───────────┘    └───────────┘    └───────────┘    └───────────┘
                      │
                      ├── Lint (ESLint + Ruff)
                      ├── Type Check (TypeScript + mypy)
                      ├── Unit Tests (Vitest + pytest)
                      ├── ADK Agent Eval
                      ├── Build (Next.js)
                      └── Docker Build (ADK Agent)
```

### 10.3 デプロイ手順

#### フロントエンド（Next.js）

1. GitHub main ブランチへのマージをトリガー
2. GitHub Actions で lint / type check / test / build
3. Cloud Run へデプロイ（or Vercel へ自動デプロイ）
4. ヘルスチェック確認後、トラフィック切り替え

#### エージェント（ADK on Cloud Run）

1. `agent/` ディレクトリの変更を検知
2. pytest でユニットテスト実行
3. Docker イメージビルド + Cloud Run にデプロイ
4. ヘルスチェック確認後、トラフィック切り替え

```bash
# Cloud Build による自動デプロイ (cloudbuild.yaml)
# main ブランチへの push で web + agent の両サービスが自動デプロイ
gcloud builds submit --config=cloudbuild.yaml
```

### 10.4 ロールバック戦略

| コンポーネント | ロールバック方法 |
|-------------|--------------|
| **フロントエンド** | Cloud Run のリビジョン切り替え（即時） |
| **エージェント** | Cloud Run のリビジョン切り替え（即時） |
| **Firestore スキーマ** | 後方互換性を維持する設計。破壊的変更は Migration Script で段階的に実施。 |

### 10.5 監視・アラート

| 監視対象 | ツール | アラート条件 |
|---------|-------|-----------|
| API レスポンスタイム | Cloud Monitoring | P95 > 15秒 |
| エラー率 | Error Reporting | > 5% / 5分 |
| Agent Server ヘルス | Cloud Monitoring | Cloud Run インスタンス数 = 0 |
| Firestore 読み取り | Cloud Monitoring | 日次リミットの80%到達 |
| Gemini API コスト | Budget Alert | 月間予算の80%到達 |
| Hallucination検知 | Custom Metric | validate_recipe_items 失敗率 > 0% |

---

## 付録 A: Phase 0 コード再利用マップ

Phase 0（Zennハッカソン）で構築済みのコードの再利用方針。

| ファイル | 再利用度 | Phase 1 での扱い |
|---------|---------|----------------|
| `tools.py` | ★★★★ | ツール関数のロジックは大部分流用可能。I/O層のみ Firestore 対応に差し替え。 |
| `prompts.py` | ★★★★ | システムプロンプトは品質確認済み。拡張して使用。`match_score` 出力の追加等。 |
| `agent.py` | ★★★☆ | ADK エージェント定義の構造は参考になる。Product Search Agent 追加・リネーム必要。 |
| `app.py` | ★☆☆☆ | Streamlit → Next.js に完全移行。UIロジック・フローは参考になるが直接流用は不可。 |
| `sample_inventory.json` | ★★★★★ | テスト・開発用サンプルデータとしてそのまま使用可能。 |

---

## 付録 B: 重要な技術的決定事項（ADR）

### ADR-001: BFFパターンの採用

**決定:** Next.js API Routes を BFF として採用し、フロントエンドから Agent Engine への直接通信は行わない。

**理由:** 認証・レート制限・レスポンス整形の一元管理。Agent Engine API のアクセス制御。将来的なバックエンド変更（Agent Engine → Cloud Run）の影響をフロントエンドから隔離。

### ADR-002: Cloud Run + FastAPI + ADK Runner を採用

**決定:** Cloud Run 上で FastAPI + ADK Runner を使用してエージェントをホスト。当初 Agent Engine を第一選択としていたが、SSEストリーミング・カスタムセッション管理・プログレス通知等の要件から Cloud Run を採用した。

**理由:** Cloud Run は SSE ストリーミングの完全制御、FastAPI によるカスタムミドルウェア（API Key 認証、進捗通知、レシピカード抽出等）、DatabaseSessionService のカスタム設定が可能。ADK Runner はどちらの環境でも同じコードで動作するため、将来 Agent Engine への移行も容易。

**結果:** 2サービス構成 — `alcheme-web` (Next.js, Cloud Run) + `alcheme-agent` (FastAPI + ADK, Cloud Run)。Cloud Build (`cloudbuild.yaml`) で main ブランチ push 時に両サービスを自動デプロイ。

### ADR-003: ユーザー参加型DB設計

**決定:** 初期段階では自社コスメDBを構築せず、AI画像認識 + Google Search + 楽天API + Gemini世界知識で補完する。ユーザー登録データの蓄積でDBが自然成長する設計。

**理由:** コスメDB構築は膨大なコストと時間を要する。ユーザーが増えるほどデータが充実するネットワーク効果を狙う。

### ADR-004: 画像生成モデルの選択

**決定:** 仕上がりプレビューには Gemini 2.5 Flash Image を使用。ユーザーの顔写真ではなく、AIキャラクターイメージにメイクを施す方式とする。

**理由:** 肖像権・プライバシーリスクの回避。キャラクターテーマ（メイド/K-POP等）によるエンゲージメント向上。$0.039/image のコスト効率。

---

*— End of Document —*
*Version 1.2 | Last Updated: 2026-02-16*
*Author: Eri Kaneko (Product Owner)*
