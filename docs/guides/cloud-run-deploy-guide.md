# Cloud Run デプロイガイド（汎用版）

Google Cloud Run にコンテナアプリケーションをデプロイするための汎用手順書。
フロントエンド (Next.js) + バックエンド (FastAPI/Express等) の 2 サービス構成を想定。

---

## 目次

1. [前提条件](#1-前提条件)
2. [GCP プロジェクト初期設定](#2-gcp-プロジェクト初期設定)
3. [Dockerfile の準備](#3-dockerfile-の準備)
4. [手動デプロイ（初回・検証用）](#4-手動デプロイ初回検証用)
5. [Cloud Build による自動デプロイ](#5-cloud-build-による自動デプロイ)
6. [環境変数とシークレット管理](#6-環境変数とシークレット管理)
7. [カスタムドメイン設定](#7-カスタムドメイン設定)
8. [監視とログ](#8-監視とログ)
9. [コスト管理](#9-コスト管理)
10. [トラブルシューティング](#10-トラブルシューティング)

---

## 1. 前提条件

### ツールのインストール

```bash
# Google Cloud CLI
# https://cloud.google.com/sdk/docs/install からダウンロード
gcloud version

# Docker Desktop (ローカルビルド確認用)
docker --version

# (任意) gh CLI — GitHub 連携に便利
gh --version
```

### GCP アカウント準備

- Google Cloud アカウントが有効であること
- 課金が有効化されていること（Cloud Run は従量課金、無料枠あり）
- プロジェクトが作成済みであること

### Cloud Run 無料枠（2026年時点）

| リソース | 無料枠/月 |
|---------|----------|
| CPU | 180,000 vCPU 秒 |
| メモリ | 360,000 GiB 秒 |
| リクエスト | 200 万回 |
| ネットワーク送信 | 1 GB（北米内） |

> Beta テスト程度であれば無料枠内に収まることが多い。

---

## 2. GCP プロジェクト初期設定

### 2.1 認証とプロジェクト設定

```bash
# ログイン
gcloud auth login

# プロジェクト設定
gcloud config set project YOUR_PROJECT_ID

# リージョン設定（東京）
gcloud config set run/region asia-northeast1

# プロジェクト確認
gcloud config list
```

### 2.2 必要な API の有効化

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

| API | 用途 |
|-----|------|
| `run.googleapis.com` | Cloud Run サービス |
| `cloudbuild.googleapis.com` | CI/CD ビルド |
| `artifactregistry.googleapis.com` | Docker イメージ保管 |
| `secretmanager.googleapis.com` | シークレット管理（任意） |

### 2.3 Artifact Registry リポジトリ作成

```bash
REGION=asia-northeast1
REPO_NAME=my-app

gcloud artifacts repositories create ${REPO_NAME} \
  --repository-format=docker \
  --location=${REGION} \
  --description="Docker images for my-app"
```

### 2.4 Docker 認証設定

```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

---

## 3. Dockerfile の準備

### 3.1 Next.js (フロントエンド)

```dockerfile
# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ビルド時に必要な環境変数を ARG で受け取る
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# ... 他の NEXT_PUBLIC_* も同様に追加

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ── Stage 3: Production ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

> **重要:** `next.config.ts` に `output: "standalone"` が必須。

```typescript
// next.config.ts
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```

### 3.2 FastAPI / Python (バックエンド)

```dockerfile
FROM python:3.12-slim
WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY my_app/ my_app/
COPY server.py .

EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 3.3 .dockerignore

```
node_modules
.next
.git
.env*
__tests__
docs/
*.md
```

---

## 4. 手動デプロイ（初回・検証用）

初回デプロイや検証時は手動でステップを実行する。

### 4.1 バックエンド (API) のデプロイ

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION=asia-northeast1
REPO=my-app
TAG=v1

AR_PREFIX="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

# ビルド＆プッシュ
docker build -t "${AR_PREFIX}/api:${TAG}" ./api
docker push "${AR_PREFIX}/api:${TAG}"

# デプロイ
gcloud run deploy my-app-api \
  --image="${AR_PREFIX}/api:${TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --no-allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --max-instances=3 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
```

> `--no-allow-unauthenticated`: API は内部通信のみ。外部からのアクセスはフロントエンド経由。

### 4.2 API の URL を取得

```bash
API_URL=$(gcloud run services describe my-app-api \
  --region=${REGION} \
  --format='value(status.url)')
echo "API URL: ${API_URL}"
```

### 4.3 フロントエンドのデプロイ

```bash
# ビルド（環境変数をビルド引数として渡す）
docker build -t "${AR_PREFIX}/web:${TAG}" \
  --build-arg NEXT_PUBLIC_API_URL="${API_URL}" \
  .

docker push "${AR_PREFIX}/web:${TAG}"

# デプロイ
gcloud run deploy my-app-web \
  --image="${AR_PREFIX}/web:${TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --max-instances=5 \
  --set-env-vars="NODE_ENV=production,API_URL=${API_URL}"
```

### 4.4 デプロイ確認

```bash
WEB_URL=$(gcloud run services describe my-app-web \
  --region=${REGION} \
  --format='value(status.url)')
echo "Web URL: ${WEB_URL}"

# ヘルスチェック
curl -s -o /dev/null -w "%{http_code}" "${WEB_URL}"
# → 200 なら成功
```

---

## 5. Cloud Build による自動デプロイ

### 5.1 cloudbuild.yaml テンプレート

```yaml
substitutions:
  _REGION: asia-northeast1
  _AR_REPO: my-app
  _WEB_SERVICE: my-app-web
  _API_SERVICE: my-app-api

steps:
  # ── 1. Build API image ──
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "build"
      - "-t"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}/api:$SHORT_SHA"
      - "./api"

  # ── 2. Push API image ──
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "push"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}/api:$SHORT_SHA"

  # ── 3. Deploy API to Cloud Run ──
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: gcloud
    args:
      - "run"
      - "deploy"
      - "${_API_SERVICE}"
      - "--image"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}/api:$SHORT_SHA"
      - "--region"
      - "${_REGION}"
      - "--platform"
      - "managed"
      - "--no-allow-unauthenticated"
      - "--port"
      - "8080"
      - "--memory"
      - "1Gi"
      - "--max-instances"
      - "3"

  # ── 4. Get API URL ──
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: bash
    args:
      - "-c"
      - |
        gcloud run services describe ${_API_SERVICE} \
          --region=${_REGION} \
          --format='value(status.url)' > /workspace/api_url.txt

  # ── 5. Build web image ──
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "build"
      - "-t"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}/web:$SHORT_SHA"
      - "--build-arg"
      - "NEXT_PUBLIC_API_URL=$(cat /workspace/api_url.txt)"
      - "."

  # ── 6. Push web image ──
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "push"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}/web:$SHORT_SHA"

  # ── 7. Deploy web to Cloud Run ──
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: bash
    args:
      - "-c"
      - |
        API_URL=$(cat /workspace/api_url.txt)
        gcloud run deploy ${_WEB_SERVICE} \
          --image=${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}/web:$SHORT_SHA \
          --region=${_REGION} \
          --platform=managed \
          --allow-unauthenticated \
          --port=3000 \
          --memory=512Mi \
          --max-instances=5 \
          --set-env-vars="NODE_ENV=production,API_URL=$API_URL"

images:
  - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}/api:$SHORT_SHA"
  - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}/web:$SHORT_SHA"

options:
  logging: CLOUD_LOGGING_ONLY
```

### 5.2 Cloud Build トリガー設定

```bash
# GitHub リポジトリ接続（初回のみ、Console で行うのが簡単）
# https://console.cloud.google.com/cloud-build/triggers

# CLI でトリガー作成
gcloud builds triggers create github \
  --repo-name=my-app \
  --repo-owner=my-org \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions="_FIREBASE_API_KEY=xxx,_FIREBASE_AUTH_DOMAIN=xxx"
```

### 5.3 手動で Cloud Build を実行

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)
```

---

## 6. 環境変数とシークレット管理

### 6.1 ビルド時 vs ランタイムの違い

| 種類 | 設定方法 | 例 |
|------|---------|-----|
| **ビルド時** (NEXT_PUBLIC_*) | Dockerfile ARG + Cloud Build substitutions | `NEXT_PUBLIC_API_URL` |
| **ランタイム** (サーバーサイド) | `--set-env-vars` または Secret Manager | `DATABASE_URL`, `API_KEY` |

### 6.2 Secret Manager の使用（本番推奨）

```bash
# シークレット作成
echo -n "my-secret-value" | \
  gcloud secrets create MY_SECRET --data-file=-

# Cloud Run にマウント
gcloud run deploy my-app-web \
  --set-secrets="MY_SECRET=MY_SECRET:latest"
```

### 6.3 `.env.example` の維持

プロジェクトルートに `.env.example` を置き、必要な環境変数を文書化する。

```
# .env.example
API_URL=http://localhost:8080
DATABASE_URL=sqlite:///dev.db
SECRET_KEY=change-me-in-production
```

---

## 7. カスタムドメイン設定

### 7.1 Cloud Run にドメインをマッピング

```bash
# ドメイン確認
gcloud beta run domain-mappings create \
  --service=my-app-web \
  --domain=app.example.com \
  --region=asia-northeast1

# 必要な DNS レコードを表示
gcloud beta run domain-mappings describe \
  --domain=app.example.com \
  --region=asia-northeast1
```

### 7.2 DNS 設定

表示された CNAME レコードを DNS プロバイダに設定：

```
app.example.com  CNAME  ghs.googlehosted.com.
```

> SSL 証明書は Google が自動プロビジョニング（数分〜数時間）。

---

## 8. 監視とログ

### 8.1 ログの確認

```bash
# リアルタイムログ
gcloud run services logs read my-app-web --region=asia-northeast1 --limit=50

# 特定のリビジョン
gcloud run revisions logs read my-app-web-00001-xxx --region=asia-northeast1

# Cloud Logging Console
# https://console.cloud.google.com/logs
```

### 8.2 メトリクス

Cloud Console > Cloud Run > サービス選択 > 「メトリクス」タブ：

- リクエスト数/秒
- レイテンシ (p50, p95, p99)
- インスタンス数
- メモリ/CPU 使用率
- エラー率

### 8.3 アラート設定（推奨）

```bash
# エラー率が 5% を超えたらメール通知
# Cloud Console > Monitoring > Alerting で設定するのが簡単
```

---

## 9. コスト管理

### 9.1 コスト削減のベストプラクティス

| 設定 | 推奨値 | 効果 |
|------|-------|------|
| `--min-instances` | 0（デフォルト） | アイドル時にインスタンスなし |
| `--max-instances` | 3-5（Beta） | スパイクからの保護 |
| `--memory` | 必要最小限 | 512Mi (web), 1Gi (API) |
| `--cpu-throttling` | デフォルト (true) | リクエスト外で CPU を制限 |
| `--concurrency` | 80（デフォルト） | 1インスタンスあたりの同時リクエスト |

### 9.2 Budget アラート

```bash
# Console で設定: https://console.cloud.google.com/billing/budgets
# $10/月 や $50/月 でアラートを設定しておく
```

### 9.3 コスト見積もり（Beta 規模）

| サービス | 想定 | 月額目安 |
|---------|------|---------|
| Cloud Run (web) | 1,000 req/日 | $0〜5 |
| Cloud Run (API) | 500 req/日 | $0〜5 |
| Artifact Registry | 2 images | $0.1 |
| Cloud Build | 10 builds/月 | 無料枠内 |
| **合計** | | **$0〜10** |

---

## 10. トラブルシューティング

### よくあるエラーと対処法

| エラー | 原因 | 対処 |
|--------|------|------|
| `Container failed to start` | ポート不一致 or 起動クラッシュ | `EXPOSE` と `--port` が一致しているか確認。ローカルで `docker run` して動作確認 |
| `Memory limit exceeded` | OOM Kill | `--memory` を増やす (512Mi → 1Gi) |
| `Connection refused to API` | サービス間通信の認証 | API サービスの IAM に `roles/run.invoker` を付与 |
| `Build failed: npm ci` | lockfile不一致 | ローカルで `npm ci` が通るか確認。`package-lock.json` をコミット |
| `NEXT_PUBLIC_* が undefined` | ビルド引数未設定 | `--build-arg` でビルド時に渡す（ランタイム環境変数では不可） |
| `502 Bad Gateway` | Cold start timeout | `--min-instances=1` で warm instance を維持 |

### デバッグコマンド集

```bash
# サービス状態確認
gcloud run services describe SERVICE_NAME --region=REGION

# 最新リビジョン確認
gcloud run revisions list --service=SERVICE_NAME --region=REGION

# ログをストリーム表示
gcloud run services logs tail SERVICE_NAME --region=REGION

# ローカルで Docker イメージをテスト
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e API_URL=http://host.docker.internal:8080 \
  my-image:latest

# Cloud Build のログ確認
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### サービス間認証（API が非公開の場合）

```bash
# Web サービスのサービスアカウントに API の呼び出し権限を付与
WEB_SA=$(gcloud run services describe my-app-web \
  --region=asia-northeast1 \
  --format='value(spec.template.spec.serviceAccountName)')

gcloud run services add-iam-policy-binding my-app-api \
  --region=asia-northeast1 \
  --member="serviceAccount:${WEB_SA}" \
  --role="roles/run.invoker"
```

> **注意:** Cloud Run 間通信では、呼び出し側が ID トークンを `Authorization: Bearer` ヘッダーで送る必要がある。
> Next.js の BFF パターンでは、`google-auth-library` を使って自動的にトークンを取得する。

---

## チェックリスト

### 初回デプロイ前

- [ ] GCP プロジェクト作成・課金有効化
- [ ] 必要な API を有効化 (`run`, `cloudbuild`, `artifactregistry`)
- [ ] Artifact Registry リポジトリ作成
- [ ] Docker 認証設定 (`gcloud auth configure-docker`)
- [ ] Dockerfile が正しく動作する（ローカルテスト）
- [ ] `.dockerignore` が適切（node_modules, .env 除外）
- [ ] `next.config.ts` に `output: "standalone"`
- [ ] 環境変数の整理 (`.env.example`)

### デプロイ後

- [ ] Web URL にアクセスして画面表示確認
- [ ] API ヘルスチェック
- [ ] ログにエラーが出ていないか確認
- [ ] サービス間通信が正常か確認
- [ ] Budget アラート設定

### 本番移行前

- [ ] カスタムドメイン設定
- [ ] Secret Manager でシークレット管理
- [ ] `--min-instances=1` で cold start 回避（必要に応じて）
- [ ] Cloud Armor / WAF 設定（必要に応じて）
- [ ] Monitoring アラート設定
