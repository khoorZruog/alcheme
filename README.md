# alche:me (アルケミー)

> 眠ったコスメから無限の可能性を調合する、あなた専属の自律型AIエージェントチーム

**alche:me** は、手持ちのコスメ在庫から最適なメイクレシピをAIエージェントが提案するフルスタックPWAアプリケーションです。Google ADK（Agent Development Kit）で構築された10体の専門AIエージェントが自律的に協調し、「手持ちコスメで、まだ見ぬ私に出会う」体験を実現します。

---

## 概要

「コスメはたくさん持っているのに、毎朝のメイクが決まらない」——
この **「コスメティック・パラドックス」** を解決するために、alche:me は以下を実現します:

- スマホで撮影するだけでAIがコスメを鑑定・在庫登録
- 手持ちコスメ **だけ** でメイクレシピを生成（ハルシネーション率 0%）
- AIキャラクターによる仕上がりプレビュー画像を自動生成
- Beauty Logで日々のメイクを記録し、好みの傾向を分析
- SNS機能でレシピを共有、フォロー・いいね・コメント

---

## 主な機能

### AI Concierge（チャット）
SSEストリーミングによるリアルタイム対話。10体のAIエージェントが連携し、在庫確認・レシピ生成・トレンド分析・天気ベース提案などを自律的に判断・実行します。

### コスメスキャン
カメラで撮影したコスメをGemini Visionが解析。ブランド・商品名・色・質感を自動識別し、楽天APIで商品情報を補完します。最大4枚同時スキャン対応。

### インベントリ（Vanity）
カテゴリフィルタ・検索機能付きの在庫一覧。各アイテムのスペック（発色力・持続力・製品寿命・ナチュラルさ）、残量、使用期限を管理。

### メイクレシピ
手持ち在庫のみで生成されたAIレシピ。ステップ別の手順、プロのコツ、代用テクニックを表示。Gemini 2.0 Flashによるプレビュー画像付き。公開/共有機能。

### Beauty Log
カレンダービューで日々のメイクを記録。使用レシピ・気分・天気・自己評価（1-5）を記録し、Profilerエージェントが傾向分析やマンネリ検知に活用。

### SNSフィード
Cookpad/WEAR風のレシピ共有SNS。フォロー/いいね/コメント機能、クイックリアクション（素敵！/真似したい！/参考になる！）、無限スクロールフィード。

---

## テクノロジースタック

| レイヤー | 技術 |
|---------|------|
| **Frontend** | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| **Agent** | Python 3.12 + Google ADK + FastAPI + Gemini 2.5 Flash / 2.0 Flash |
| **Database** | Cloud Firestore |
| **Auth** | Firebase Authentication (Email/Password + Google OAuth) |
| **Storage** | Cloud Storage |
| **Hosting** | Cloud Run (Web + Agent) |
| **CI/CD** | GitHub Actions |
| **Testing** | Vitest + pytest + Playwright |

---

## アーキテクチャ

### システム構成（BFFパターン）

```
[Next.js PWA — Cloud Run :3000]
         │  HTTPS (REST + SSE)
         ▼
[Next.js API Routes — BFF]
  - Firebase Auth Token 検証
  - SSEストリーミングプロキシ
         │
         ▼
[FastAPI + Google ADK — Cloud Run :8080]
  - ADK Runner (エージェント実行)
  - DatabaseSessionService (セッション永続化)
  - InMemoryMemoryService (クロスセッション記憶)
         │
    ┌────┼────┐
    ▼    ▼    ▼
Firestore  Cloud Storage  External APIs
(データ)   (画像)          (楽天/天気/Google)
```

### エージェントシステム（10体）

```
Concierge (Root Agent / gemini-2.0-flash)
├── Inventory Manager     — コスメ画像認識・在庫管理
├── Product Search        — Google検索 + 楽天APIで商品補完
├── Cosmetic Alchemist    — 手持ち在庫のみでレシピ生成
├── Memory Keeper         — Beauty Log の記録・取得
├── Trend Hunter          — SNS/美容メディアのトレンド分析
├── TPO Tactician         — 天気・予定ベースのメイク提案
├── Profiler              — 嗜好傾向分析・マンネリ検知
├── Makeup Instructor     — 代用テクニック・手順指導
└── Simulator (stub)      — プレビュー画像生成
```

---

## セットアップ

### 前提条件

- **Node.js** 22+
- **Python** 3.12+
- **Firebase** プロジェクト（Auth + Firestore + Storage）
- **Google Cloud** プロジェクト（Vertex AI API 有効化）
- **楽天 Web Service** アプリID（[取得はこちら](https://webservice.rakuten.co.jp/app/list)）

### フロントエンド

```bash
# 依存関係インストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local に Firebase / GCP の設定を記入

# 開発サーバー起動
npm run dev
# → http://localhost:3000
```

### エージェントサーバー

```bash
cd agent

# 依存関係インストール
pip install -e ".[dev]"

# 環境変数を設定
cp .env.example .env
# .env に Google Cloud / 楽天 / OpenWeatherMap の設定を記入

# サーバー起動
python server.py
# → http://localhost:8080

# または ADK Web UI で起動（開発・デバッグ用）
adk web alcheme
# → http://localhost:8000
```

---

## 環境変数

### フロントエンド（`.env.local`）

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `FIREBASE_PROJECT_ID` | Firebase Admin Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin Client Email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin Private Key |
| `NEXT_PUBLIC_APP_URL` | App URL (default: `http://localhost:3000`) |
| `ADK_AGENT_URL` | Agent Server URL (default: `http://localhost:8080`) |
| `AGENT_API_KEY` | Agent Server API Key |

### エージェントサーバー（`agent/.env`）

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_GENAI_USE_VERTEXAI` | Vertex AI使用フラグ (`TRUE`) |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID |
| `GOOGLE_CLOUD_LOCATION` | GCP Region (default: `asia-northeast1`) |
| `RAKUTEN_APP_ID` | 楽天 Web Service App ID |
| `SESSION_DB_URL` | セッションDB URL (default: `sqlite+aiosqlite:///sessions.db`) |
| `OPENWEATHERMAP_API_KEY` | OpenWeatherMap API Key |
| `GCS_PREVIEW_BUCKET` | Cloud Storage bucket for preview images |
| `SIMULATOR_MODEL` | 画像生成モデル (default: `gemini-2.0-flash-exp`) |

---

## テスト

```bash
# フロントエンド（Vitest — 61+ tests）
npm test

# フロントエンド（watch mode）
npm run test:watch

# エージェント（pytest — 100+ tests）
cd agent && python -m pytest tests/ -v

# E2E（Playwright — 5 specs）
npx playwright test
```

### 品質ゲート

| ゲート | 基準 |
|-------|------|
| **Hallucination Rate** | 0%（在庫外アイテムがレシピに含まれないこと） |
| **Unit Tests** | 全テスト通過（Python 100+ / Frontend 61+） |
| **E2E** | 主要フロー通過（5 Playwright specs） |

---

## デプロイ

### Cloud Build（推奨）

```bash
gcloud builds submit --config=cloudbuild.yaml
```

Web + Agent の2つのCloud Runサービスが自動デプロイされます:
- `alcheme-web` — Next.js フロントエンド + BFF（port 3000）
- `alcheme-agent` — FastAPI エージェントサーバー（port 8080）

### 手動デプロイ

```bash
./scripts/deploy.sh
```

---

## プロジェクト構造

```
alcheme/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 認証ページ (login, signup, onboarding)
│   ├── (main)/                 # メイン機能（6タブ）
│   │   ├── chat/               #   AIチャット
│   │   ├── feed/               #   SNSフィード
│   │   ├── scan/               #   コスメスキャン
│   │   ├── inventory/          #   在庫一覧・詳細
│   │   ├── recipes/            #   レシピ一覧・詳細
│   │   ├── beauty-log/         #   Beauty Log
│   │   └── settings/           #   プロフィール設定
│   └── api/                    # BFF API Routes (25+ endpoints)
│       ├── auth/               #   認証
│       ├── chat/               #   チャット (SSE)
│       ├── inventory/          #   在庫 CRUD + スキャン
│       ├── recipes/            #   レシピ CRUD + 公開
│       ├── beauty-log/         #   Beauty Log CRUD
│       └── social/             #   SNS (フィード/いいね/コメント/フォロー)
├── agent/                      # Python ADK エージェントサーバー
│   ├── alcheme/
│   │   ├── agents/             #   10 AIエージェント定義
│   │   ├── prompts/            #   システムプロンプト
│   │   ├── tools/              #   12 ツール関数
│   │   └── schemas/            #   Pydantic スキーマ
│   ├── tests/                  #   pytest (100+ tests)
│   ├── server.py               #   FastAPI サーバー
│   └── Dockerfile
├── components/                 # React UIコンポーネント (30+)
│   ├── ui/                     #   shadcn/ui ベースコンポーネント
│   ├── auth/                   #   認証コンポーネント
│   ├── beauty-log-*.tsx        #   Beauty Log関連
│   ├── feed-post-card.tsx      #   SNSフィード関連
│   ├── recipe-*.tsx            #   レシピ関連
│   └── bottom-nav.tsx          #   ボトムナビゲーション
├── hooks/                      # カスタムフック
│   ├── use-chat.ts             #   チャット (SSE)
│   ├── use-feed.ts             #   SNSフィード (SWR Infinite)
│   ├── use-beauty-log.ts       #   Beauty Log
│   └── use-inventory.ts        #   在庫管理
├── types/                      # TypeScript 型定義
├── lib/                        # ユーティリティ
├── __tests__/                  # フロントエンドテスト (61+)
├── docs/                       # ドキュメント
├── .github/workflows/ci.yml    # CI/CD パイプライン
├── Dockerfile                  # Web Dockerfile
├── cloudbuild.yaml             # Cloud Build 設定
└── firestore.rules             # Firestore セキュリティルール
```

---

## スクリプト一覧

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 (Turbopack) |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLint 実行 |
| `npm test` | Vitest 実行 |
| `npm run test:watch` | Vitest ウォッチモード |
| `npm run test:e2e` | Playwright E2Eテスト |

---

## ライセンス

TBD

---

## クレジット

- [Google ADK](https://google.github.io/adk-docs/) — Agent Development Kit
- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI Model (Flash / Pro / Image Generation)
- [Firebase](https://firebase.google.com/) — Auth, Firestore, Cloud Storage
- [Next.js](https://nextjs.org/) — React Framework
- [shadcn/ui](https://ui.shadcn.com/) — UI Component Library
- [Cloud Run](https://cloud.google.com/run) — Serverless Container Hosting
- [Claude Code](https://claude.com/claude-code) — AI-Powered Development
