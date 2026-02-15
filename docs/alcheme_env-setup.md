# alche:me — 環境構築手順・設定リファレンス

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2026-02-14 |
| **Author** | Eri Kaneko (Product Owner) |
| **Status** | ✅ 全ステップ完了済み |
| **Related** | CLAUDE_CODE_INSTRUCTIONS_v1_3.md, alcheme_design-doc_v1.md §10 |

> 本ドキュメントは alche:me の開発環境構築に必要な全情報を1ファイルに集約する。Claude Code がインフラ周りでブロックされないためのリファレンスとして使用する。

### Changelog

| Version | Date | 変更内容 |
|---------|------|---------|
| 1.0 | 2026-02-14 | 初版。完了済み環境構築手順を集約。.env 変数一覧、API キー、ADK MCP 設定、Firebase Emulator、トラブルシューティングを網羅。 |

---

## Table of Contents

1. [現在の環境ステータス（完了済み）](#1-現在の環境ステータス完了済み)
2. [GCP / Firebase プロジェクト情報](#2-gcp--firebase-プロジェクト情報)
3. [有効化済み API 一覧](#3-有効化済み-api-一覧)
4. [.env ファイル設定](#4-env-ファイル設定)
5. [認証設定（ADC / Firebase Auth）](#5-認証設定adc--firebase-auth)
6. [フロントエンド環境（Next.js）](#6-フロントエンド環境nextjs)
7. [Python ADK エージェント環境](#7-python-adk-エージェント環境)
8. [ADK MCP サーバー設定](#8-adk-mcp-サーバー設定)
9. [Firebase Emulator Suite（ローカル開発）](#9-firebase-emulator-suiteローカル開発)
10. [Cloud Storage 設定](#10-cloud-storage-設定)
11. [外部 API キー一覧](#11-外部-api-キー一覧)
12. [デプロイ設定（Cloud Run）](#12-デプロイ設定cloud-run)
13. [ディレクトリ構造リファレンス](#13-ディレクトリ構造リファレンス)
14. [ヘルスチェックコマンド集](#14-ヘルスチェックコマンド集)
15. [トラブルシューティング](#15-トラブルシューティング)

---

## 1. 現在の環境ステータス（完了済み）

以下の全ステップは **2026-02-14 時点で完了済み**。Claude Code は再実行不要。

| # | ステップ | 状態 | 備考 |
|---|--------|------|------|
| 1 | Firebase プロジェクト作成 | ✅ 完了 | プロジェクト名: `alcheme` |
| 2 | Authentication 有効化 | ✅ 完了 | Email/Password + Google OAuth |
| 3 | Firestore Database 作成 | ✅ 完了 | `asia-northeast1 (Tokyo)`、テストモード |
| 4 | Cloud Storage 有効化 | ✅ 完了 | `asia-northeast1 (Tokyo)`、テストモード |
| 5 | Web アプリ登録 | ✅ 完了 | ニックネーム: `alcheme-web` |
| 6 | Vertex AI API 有効化 | ✅ 完了 | GCP コンソールから有効化済み |
| 7 | gcloud CLI + ADC 設定 | ✅ 完了 | `erikaneko100@gmail.com` で認証済み |
| 8 | `.env.local` 設定 | ✅ 完了 | Firebase + GCP の全変数設定済み |
| 9 | 動作確認 | ✅ 完了 | ログイン + 新規登録 + ダッシュボード表示確認済み |

---

## 2. GCP / Firebase プロジェクト情報

Claude Code が API 呼び出しや設定ファイル生成時に参照する固定値。

| 項目 | 値 |
|------|---|
| **Firebase プロジェクト名** | `alcheme` |
| **GCP プロジェクト ID** | `alcheme-c36ef` |
| **Firebase Web アプリ名** | `alcheme-web` |
| **GCP アカウント** | `erikaneko100@gmail.com` |
| **リージョン（Firestore / Storage）** | `asia-northeast1` (Tokyo) |
| **リージョン（Vertex AI）** | `asia-northeast1` (Tokyo) |
| **Firebase Auth プロバイダ** | Email/Password, Google OAuth |
| **Firebase Auth 公開名** | `alche:me` |
| **Firestore セキュリティモード** | テストモード（β前に本番ルールに変更必要） |
| **Storage セキュリティモード** | テストモード（β前に本番ルールに変更必要） |
| **Google Analytics** | 未設定（Phase 1 では不要） |

---

## 3. 有効化済み API 一覧

以下の API は GCP コンソールで有効化済み。追加で必要になった場合のコマンドも併記。

### 有効化済み

| API | 用途 | 有効化済み |
|-----|------|----------|
| **Vertex AI API** (`aiplatform.googleapis.com`) | Gemini モデル呼び出し | ✅ |
| **Identity Toolkit API** (`identitytoolkit.googleapis.com`) | Firebase Auth | ✅ |
| **Service Usage API** (`serviceusage.googleapis.com`) | API 管理・quota | ✅ |
| **Cloud Firestore API** | DB 操作 | ✅（Firebase 作成時に自動有効化） |
| **Cloud Storage API** | ファイルストレージ | ✅（Firebase 作成時に自動有効化） |

### Phase 1 で追加が必要になる可能性のある API

```bash
# Agent Engine を使用する場合
gcloud services enable agentengine.googleapis.com --project=alcheme-c36ef

# Cloud Run デプロイ時
gcloud services enable run.googleapis.com --project=alcheme-c36ef
gcloud services enable cloudbuild.googleapis.com --project=alcheme-c36ef
gcloud services enable artifactregistry.googleapis.com --project=alcheme-c36ef

# Secret Manager（本番用シークレット管理）
gcloud services enable secretmanager.googleapis.com --project=alcheme-c36ef
```

---

## 4. .env ファイル設定

### 4.1 フロントエンド: `frontend/.env.local`（設定済み）

```env
# ============================================
# Firebase Client SDK（フロントエンド用）
# Firebase Console > プロジェクト設定 > マイアプリ > alcheme-web で取得済み
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=<設定済み>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alcheme-c36ef.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alcheme-c36ef
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alcheme-c36ef.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<設定済み>
NEXT_PUBLIC_FIREBASE_APP_ID=<設定済み>

# ============================================
# Firebase Admin SDK（バックエンド / BFF 用）
# ADC を使用するため、プロジェクト ID のみ設定
# ============================================
FIREBASE_PROJECT_ID=alcheme-c36ef

# ============================================
# Google Cloud / Vertex AI
# ============================================
GOOGLE_CLOUD_PROJECT=alcheme-c36ef
VERTEX_AI_LOCATION=asia-northeast1

# ============================================
# Application Settings
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================
# Agent Engine / Cloud Run（Phase 1 開発中に追加）
# ============================================
# AGENT_ENGINE_URL=http://localhost:8000      # ローカル開発時（adk web 使用）
# AGENT_ENGINE_URL=https://xxx.run.app        # Cloud Run デプロイ後に設定
```

### 4.2 Python Agent: `agent/.env`（新規作成が必要）

```env
# ============================================
# Google Cloud / Vertex AI
# ============================================
GOOGLE_CLOUD_PROJECT=alcheme-c36ef
GOOGLE_CLOUD_LOCATION=asia-northeast1
GOOGLE_GENAI_USE_VERTEXAI=true

# ============================================
# Firebase（Firestore / Storage アクセス用）
# ADC で認証するため、キーファイルは不要
# ============================================
FIREBASE_PROJECT_ID=alcheme-c36ef

# ============================================
# 楽天 API（商品検索補完用）
# https://webservice.rakuten.co.jp/ で取得
# ============================================
RAKUTEN_APP_ID=<取得後に設定>

# ============================================
# ADK Settings
# ============================================
ADK_APP_NAME=alcheme
ADK_LOG_LEVEL=INFO
```

### 4.3 Firebase Emulator 用: `frontend/.env.test`（テスト時に使用）

```env
# Firebase Emulator 使用時の設定
NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alcheme-c36ef
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alcheme-c36ef.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=test-app-id

FIREBASE_PROJECT_ID=alcheme-c36ef
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

GOOGLE_CLOUD_PROJECT=alcheme-c36ef
VERTEX_AI_LOCATION=asia-northeast1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=test
```

### 4.4 .env 変数一覧（全量）

| 変数名 | ファイル | 必須 | 取得方法 |
|--------|---------|------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | frontend/.env.local | ✅ | Firebase Console > プロジェクト設定 > マイアプリ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | frontend/.env.local | ✅ | 同上（`{projectId}.firebaseapp.com`） |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | frontend/.env.local | ✅ | 同上（`alcheme-c36ef`） |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | frontend/.env.local | ✅ | 同上（`{projectId}.appspot.com`） |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | frontend/.env.local | ✅ | 同上 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | frontend/.env.local | ✅ | 同上 |
| `FIREBASE_PROJECT_ID` | 両方 | ✅ | `alcheme-c36ef` 固定 |
| `GOOGLE_CLOUD_PROJECT` | 両方 | ✅ | `alcheme-c36ef` 固定 |
| `GOOGLE_CLOUD_LOCATION` | agent/.env | ✅ | `asia-northeast1` 固定 |
| `VERTEX_AI_LOCATION` | frontend/.env.local | ✅ | `asia-northeast1` 固定 |
| `GOOGLE_GENAI_USE_VERTEXAI` | agent/.env | ✅ | `true` 固定 |
| `NEXT_PUBLIC_APP_URL` | frontend/.env.local | ✅ | `http://localhost:3000`（ローカル） |
| `NODE_ENV` | frontend/.env.local | ✅ | `development` / `production` |
| `RAKUTEN_APP_ID` | agent/.env | Phase 1 P0 | 楽天 Web Service で発行 |
| `ADK_APP_NAME` | agent/.env | ✅ | `alcheme` 固定 |
| `AGENT_ENGINE_URL` | frontend/.env.local | 開発後半 | Cloud Run デプロイ後に判明 |

### 4.5 `.env.example` テンプレート（Git 管理対象）

```env
# 🚫 このファイルに実際の値を入れないでください
# .env.local にコピーして値を設定してください

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id

# Google Cloud
GOOGLE_CLOUD_PROJECT=your_project_id
VERTEX_AI_LOCATION=asia-northeast1

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 5. 認証設定（ADC / Firebase Auth）

### 5.1 ADC（Application Default Credentials）— 設定済み

ローカル開発では ADC を使用して GCP サービスに認証する。サービスアカウントキーファイルは**不要**。

```bash
# 現在の設定確認
gcloud auth list
# → erikaneko100@gmail.com に * がついていること

gcloud config list
# → project = alcheme-c36ef であること
```

ADC の仕組み:
- `gcloud auth application-default login` で取得した認証情報が `~/.config/gcloud/application_default_credentials.json` に保存される
- Firebase Admin SDK、Vertex AI SDK が自動的にこの認証情報を使用
- **`GOOGLE_APPLICATION_CREDENTIALS` 環境変数やサービスアカウントキーは設定不要**

### 5.2 Firebase Auth プロバイダ — 設定済み

| プロバイダ | 状態 | 設定場所 |
|----------|------|---------|
| **Email/Password** | ✅ 有効 | Firebase Console > Authentication > Sign-in method |
| **Google OAuth** | ✅ 有効 | 同上。公開名: `alche:me` |

### 5.3 Firebase Admin SDK 認証方式

```typescript
// lib/firebase/admin.ts — 既存ボイラープレートの方式（ADC / cert 自動切替）
// ADC が利用可能な場合は自動使用。明示的なキーファイル不要。
import { cert, getApps, initializeApp } from "firebase-admin/app";

const app = getApps().length === 0
  ? initializeApp({
      credential: process.env.FIREBASE_PRIVATE_KEY
        ? cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          })
        : undefined, // ADC を使用
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
  : getApps()[0];
```

**ローカル開発:** `FIREBASE_PRIVATE_KEY` が未設定 → ADC 自動使用 ✅
**Cloud Run 本番:** サービスアカウントの ADC 自動使用 ✅

---

## 6. フロントエンド環境（Next.js）

### 6.1 前提条件

| ツール | バージョン | 確認コマンド |
|-------|----------|------------|
| Node.js | 22.x | `node --version` |
| npm | 10.x+ | `npm --version` |
| Next.js | 16.x | `npx next --version` |

### 6.2 セットアップコマンド

```bash
# 依存関係インストール（初回のみ）
cd frontend/    # or プロジェクトルート
npm install

# Phase 1 で追加する依存関係
npm install framer-motion swr
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D msw

# shadcn/ui 追加コンポーネント（CLAUDE_CODE §5.2 参照）
npx shadcn@latest add dialog drawer sheet tabs scroll-area skeleton
npx shadcn@latest add separator progress toast textarea toggle-group dropdown-menu

# 開発サーバー起動
npm run dev
# → http://localhost:3000
```

### 6.3 PWA 設定（Week 3 で実装）

```json
// public/manifest.json
{
  "name": "alche:me",
  "short_name": "alche:me",
  "start_url": "/chat",
  "display": "standalone",
  "background_color": "#FFF8F0",
  "theme_color": "#C77DBA",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 7. Python ADK エージェント環境

### 7.1 前提条件

| ツール | バージョン | 確認コマンド |
|-------|----------|------------|
| Python | 3.12+ | `python3 --version` |
| pip or uv | latest | `pip --version` / `uv --version` |
| gcloud CLI | latest | `gcloud --version` |

### 7.2 セットアップコマンド

```bash
# agent ディレクトリに移動
cd agent/

# pyproject.toml から依存関係をインストール
pip install -e ".[dev]"
# または uv を使用
uv pip install -e ".[dev]"

# ADK CLI の動作確認
adk --version
```

### 7.3 pyproject.toml テンプレート

```toml
[project]
name = "alcheme-agent"
version = "0.1.0"
description = "alche:me AI Agent (Phase 1 MVP)"
requires-python = ">=3.12"

dependencies = [
    "google-adk>=1.0.0",
    "google-cloud-firestore>=2.19.0",
    "google-cloud-storage>=2.18.0",
    "pydantic>=2.0.0",
    "httpx>=0.27.0",          # 楽天 API 呼び出し
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=5.0.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

### 7.4 ADK ローカル開発サーバー

```bash
# エージェントの開発用 Web UI を起動
cd agent/
adk web alcheme
# → http://localhost:8000 に ADK 開発 UI が起動

# CLI でエージェントを実行
adk run alcheme

# 評価を実行
adk eval alcheme tests/eval/
```

### 7.5 環境変数の読み込み確認

```python
# agent/alcheme/config.py — 起動時に環境変数を検証
import os

REQUIRED_ENV_VARS = [
    "GOOGLE_CLOUD_PROJECT",
    "GOOGLE_CLOUD_LOCATION",
    "GOOGLE_GENAI_USE_VERTEXAI",
]

def validate_env():
    missing = [v for v in REQUIRED_ENV_VARS if not os.getenv(v)]
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            f"See alcheme_env-setup.md §4.2 for configuration."
        )
```

---

## 8. ADK MCP サーバー設定

Claude Code から ADK 公式ドキュメントを参照するための MCP（Model Context Protocol）設定。

### 8.1 MCP サーバー登録コマンド

```bash
# ADK 公式ドキュメントを MCP サーバーとして登録
claude mcp add adk-docs --transport stdio -- uvx --from mcpdoc mcpdoc \
  --urls AgentDevelopmentKit:https://google.github.io/adk-docs/llms.txt \
  --transport stdio
```

### 8.2 登録確認

```bash
# 登録済み MCP サーバーの一覧を確認
claude mcp list
# → adk-docs が表示されること
```

### 8.3 MCP サーバーの用途

Claude Code が以下のような質問に答える際に ADK ドキュメントを参照できる:
- ADK のエージェント定義方法
- `LlmAgent` / `SequentialAgent` の使い分け
- ツール関数のシグネチャ規約
- `google_search` ツールの制約（単独 Agent に割り当て必須）
- Session / State / Artifact の管理方法
- `adk web` / `adk run` / `adk eval` コマンドの使い方
- Agent Engine へのデプロイ方法

### 8.4 ADK で MCP サーバーを使用する場合（将来拡張）

Phase 2 以降でエージェントに外部 MCP ツールを統合する場合:

```python
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams

# 例: 外部 MCP サーバーのツールを ADK エージェントに統合
agent = LlmAgent(
    model="gemini-2.5-flash",
    name="mcp_agent",
    tools=[
        McpToolset(
            connection_params=SseConnectionParams(
                url="https://your-mcp-server.com/sse"
            )
        )
    ]
)
```

---

## 9. Firebase Emulator Suite（ローカル開発）

テスト実行時・オフライン開発時に本番 Firebase の代わりにローカルエミュレータを使用する。

### 9.1 インストール

```bash
# Firebase CLI のインストール（未インストールの場合）
npm install -g firebase-tools

# Firebase プロジェクトにログイン
firebase login

# エミュレータのセットアップ
firebase init emulators
# → Authentication, Firestore, Storage を選択
# → デフォルトポートで OK
```

### 9.2 firebase.json 設定

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### 9.3 起動コマンド

```bash
# エミュレータ起動
firebase emulators:start

# → Emulator UI: http://localhost:4000
# → Auth:       http://localhost:9099
# → Firestore:  http://localhost:8080
# → Storage:    http://localhost:9199
```

### 9.4 エミュレータ接続（フロントエンド側）

```typescript
// lib/firebase/client.ts に以下を追加（開発時のみ）
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";

if (process.env.NODE_ENV === "test") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
}
```

---

## 10. Cloud Storage 設定

### 10.1 バケット構造（Design Doc §8.2 / CLAUDE_CODE §8.2）

```
gs://alcheme-c36ef.appspot.com/
├── cosme-images/{userId}/{itemId}/
│   ├── original.jpg
│   ├── thumbnail.webp     # 200x200
│   └── card.webp           # 400x400
├── simulations/{userId}/{recipeId}.webp
└── avatars/{userId}/avatar.webp
```

### 10.2 CORS 設定（画像のブラウザ直接アクセス用）

```json
// cors.json
[
  {
    "origin": ["http://localhost:3000", "https://alcheme.app"],
    "method": ["GET", "PUT", "POST"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
# CORS 設定を適用
gsutil cors set cors.json gs://alcheme-c36ef.appspot.com
```

### 10.3 セキュリティルール（本番用 — β前に適用）

```
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cosme-images/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 11. 外部 API キー一覧

Phase 1 で必要な外部 API キーの取得方法。

| API | 用途 | 必須度 | 取得 URL | 変数名 |
|-----|------|--------|---------|--------|
| **Firebase Client** | フロントエンド認証・DB | ✅ 取得済み | Firebase Console > プロジェクト設定 | `NEXT_PUBLIC_FIREBASE_*` |
| **Vertex AI** | Gemini モデル | ✅ ADC | ADC で認証（キー不要） | — |
| **楽天 Web Service** | 商品検索補完 (F7) | P0 未取得 | https://webservice.rakuten.co.jp/ | `RAKUTEN_APP_ID` |
| **Google Search** | Product Search Agent | ✅ ADK 内蔵 | ADK `google_search` ツール（キー不要） | — |

### 楽天 API キーの取得手順

1. https://webservice.rakuten.co.jp/ にアクセス
2. 楽天会員でログイン（未登録の場合は新規登録）
3. 「アプリ ID 発行」ページでアプリを登録
4. **アプリ ID** をコピーして `agent/.env` の `RAKUTEN_APP_ID` に設定

⚠️ 楽天 API は無料プラン（1秒1リクエスト制限）で Phase 1 には十分。

---

## 12. デプロイ設定（Cloud Run）

Phase 1 Week 4 で実施予定。

### 12.1 フロントエンド（Next.js）

```bash
# Cloud Run へのデプロイ
gcloud run deploy alcheme-frontend \
  --source . \
  --region asia-northeast1 \
  --project alcheme-c36ef \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=alcheme-c36ef,NODE_ENV=production"
```

### 12.2 エージェント（Python ADK）

```bash
# ADK CLI でデプロイ
cd agent/
adk deploy cloud_run \
  --project=alcheme-c36ef \
  --region=asia-northeast1 \
  --service_name=alcheme-agent \
  --app_name=alcheme \
  --with_ui
```

または Agent Engine を使用:

```bash
# Agent Engine デプロイ（ADR-002: 第一選択）
# Agent Starter Pack の enhance コマンドを使用
uvx agent-starter-pack enhance --adk -d agent_engine
make backend
```

### 12.3 docker-compose.yml（ローカル統合テスト用）

```yaml
version: "3.8"
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - AGENT_ENGINE_URL=http://agent:8000
    depends_on:
      - agent

  agent:
    build:
      context: ./agent
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - GOOGLE_CLOUD_PROJECT=alcheme-c36ef
      - GOOGLE_CLOUD_LOCATION=asia-northeast1
      - GOOGLE_GENAI_USE_VERTEXAI=true
```

---

## 13. ディレクトリ構造リファレンス

CLAUDE_CODE_INSTRUCTIONS §5.4 のターゲット構造からの抜粋（環境設定関連ファイル）。

```
alcheme/
├── frontend/
│   ├── .env.local            # 🔒 Git 管理外。Firebase + GCP 設定値
│   ├── .env.example          # 📝 Git 管理対象。テンプレート
│   ├── .env.test             # 🧪 Firebase Emulator 用
│   ├── firebase.json         # Firebase Emulator 設定
│   ├── firestore.rules       # Firestore セキュリティルール
│   ├── storage.rules         # Storage セキュリティルール
│   ├── next.config.ts
│   ├── package.json
│   ├── Dockerfile
│   └── ...
│
├── agent/
│   ├── .env                  # 🔒 Git 管理外。GCP + 楽天 API 設定
│   ├── .env.example          # 📝 Git 管理対象。テンプレート
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── alcheme/
│   │   ├── __init__.py
│   │   ├── agent.py          # root_agent 定義
│   │   └── ...
│   └── tests/
│       └── eval/             # ADK 評価データセット
│
├── docker-compose.yml
├── cloudbuild.yaml
└── .gitignore                # .env.local, .env, *.key を含む
```

### .gitignore に含めるべきファイル

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Firebase
service-account-key.json
**/firebase-debug.log
**/firestore-debug.log
**/ui-debug.log

# GCP
application_default_credentials.json
```

---

## 14. ヘルスチェックコマンド集

Claude Code が環境状態を確認する際に使用するコマンド群。

```bash
# === GCP 認証状態 ===
gcloud auth list
# → erikaneko100@gmail.com に * がついていること

gcloud config list --format="value(core.project)"
# → alcheme-c36ef

# === ADC の確認 ===
gcloud auth application-default print-access-token > /dev/null 2>&1 && echo "ADC OK" || echo "ADC FAILED"

# === API 有効化状態 ===
gcloud services list --enabled --project=alcheme-c36ef --filter="name:aiplatform" --format="value(name)"
# → aiplatform.googleapis.com

# === Node.js 環境 ===
node --version       # 22.x
npm --version        # 10.x+

# === Python 環境 ===
python3 --version    # 3.12+
pip show google-adk  # google-adk がインストールされていること

# === Firebase CLI ===
firebase --version

# === ADK CLI ===
adk --version

# === フロントエンド起動確認 ===
cd frontend/ && npm run dev
# → http://localhost:3000 が応答すること

# === エージェント起動確認 ===
cd agent/ && adk web alcheme
# → http://localhost:8000 が応答すること
```

---

## 15. トラブルシューティング

### 15.1 ADC quota project エラー

**症状:** `Could not automatically determine credentials` や `Quota project not set`

**解決策（実施済み手順の再実行）:**

```bash
# Step 1: 必要な API を有効化
gcloud services enable serviceusage.googleapis.com --project=alcheme-c36ef
gcloud services enable identitytoolkit.googleapis.com --project=alcheme-c36ef

# Step 2: ADC を再取得
gcloud auth application-default login --project=alcheme-c36ef

# Step 3: quota project を設定
gcloud auth application-default set-quota-project alcheme-c36ef

# Step 4: 開発サーバー再起動
npm run dev
```

### 15.2 Firebase Auth エラー（403 / 401）

**症状:** ログイン時に `auth/unauthorized-domain` エラー

**解決策:**
1. Firebase Console > Authentication > Settings > Authorized domains
2. `localhost` が含まれていることを確認
3. 本番デプロイ後は実際のドメインも追加

### 15.3 Firestore Permission Denied

**症状:** Firestore 操作で `PERMISSION_DENIED`

**原因と解決策:**
- テストモードの有効期限切れ（30日間） → Firebase Console で Rules を再設定
- ADC の認証先プロジェクトが間違っている → `gcloud config set project alcheme-c36ef`

### 15.4 Vertex AI API エラー

**症状:** `google.api_core.exceptions.PermissionDenied: 403`

**解決策:**
```bash
# Vertex AI API が有効か確認
gcloud services list --enabled --project=alcheme-c36ef | grep aiplatform

# 有効でなければ再有効化
gcloud services enable aiplatform.googleapis.com --project=alcheme-c36ef
```

### 15.5 `google_search` ツールが動作しない

**原因:** ADK の制約で `google_search` ツールは**他のツールと同じ Agent に併用不可**。

**解決策:** Product Search Agent を独立サブエージェントとして実装（CLAUDE_CODE §6.4 参照）。

### 15.6 UTF-8 エンコーディング問題

**症状:** 日本語の文字化け（Phase 0 で発生した既知の問題）

**解決策:**
- すべてのファイルを UTF-8（BOM なし）で保存
- Python 3 はデフォルト UTF-8 なので `# -*- coding: utf-8 -*-` は不要
- `.editorconfig` に `charset = utf-8` を設定

### 15.7 Cloud Run デプロイ時の環境変数

**注意:** Cloud Run では `.env.local` が使えない。環境変数は `--set-env-vars` で明示的に渡す。

```bash
gcloud run deploy alcheme-frontend \
  --set-env-vars="FIREBASE_PROJECT_ID=alcheme-c36ef,GOOGLE_CLOUD_PROJECT=alcheme-c36ef,..."
```

本番の機密情報（API キー等）は Secret Manager の使用を推奨:
```bash
gcloud run deploy alcheme-frontend \
  --set-secrets="RAKUTEN_APP_ID=RAKUTEN_APP_ID:latest"
```

---

## Appendix A: GCP API 有効化コマンド一覧

```bash
# Phase 1 で必要になる全 API を一括有効化
gcloud services enable \
  aiplatform.googleapis.com \
  identitytoolkit.googleapis.com \
  serviceusage.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project=alcheme-c36ef
```

## Appendix B: セキュリティ TODO（βリリース前）

| # | タスク | 状態 |
|---|-------|------|
| 1 | Firestore セキュリティルールをテストモード → 本番ルールに変更 | ⬜ 未着手 |
| 2 | Storage セキュリティルールを本番用に変更 | ⬜ 未着手 |
| 3 | Firebase Auth の Authorized domains に本番ドメインを追加 | ⬜ 未着手 |
| 4 | Cloud Run サービスの認証設定（public → 要認証）を検討 | ⬜ 未着手 |
| 5 | Secret Manager で機密情報を管理 | ⬜ 未着手 |
| 6 | HTTPS 強制 + カスタムドメイン設定 | ⬜ 未着手 |

---

*— End of Document —*
*Version 1.0 | Last Updated: 2026-02-14*
*Author: Eri Kaneko (Product Owner)*
