# Secret Manager 移行 + Cloud Build トリガー設定

| | |
|---|---|
| **Date** | 2026-03-07 |
| **Status** | **✅ 完了** |
| **変更ファイル** | `cloudbuild.yaml` |

## Context

`gcloud builds submit --substitutions=...` でデプロイ時に毎回11個の機密値を手動で渡していた。本番サービスの業界標準に合わせ、機密値は Secret Manager、非機密設定値は substitutions に分離し、`git push` だけで自動デプロイされるようにする。

---

## 変数の分類

### Secret Manager に移行（機密値）— 10個

| Secret 名 | 用途 |
|-----------|------|
| `RAKUTEN_APP_ID` | 楽天 API 認証 |
| `RAKUTEN_ACCESS_KEY` | 楽天 API 認証 |
| `GOOGLE_WEATHER_API_KEY` | 天気 API |
| `GOOGLE_CALENDAR_CLIENT_ID` | Calendar OAuth |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Calendar OAuth |
| `FIREBASE_API_KEY` | Firebase (ビルド引数) |
| `FIREBASE_AUTH_DOMAIN` | Firebase (ビルド引数) |
| `FIREBASE_STORAGE_BUCKET` | Firebase (ビルド引数) |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase (ビルド引数) |
| `FIREBASE_APP_ID` | Firebase (ビルド引数) |

### substitutions に残す（非機密設定値）— 6個

| 変数 | デフォルト値 | 用途 |
|------|-----------|------|
| `_REGION` | `asia-northeast1` | リージョン |
| `_AR_REPO` | `alcheme` | Artifact Registry リポ |
| `_WEB_SERVICE` | `alcheme-web` | Cloud Run サービス名 |
| `_AGENT_SERVICE` | `alcheme-agent` | Cloud Run サービス名 |
| `_TAG` | `latest` | Docker タグ |
| `_GCS_PREVIEW_BUCKET` | `alcheme-previews` | GCS バケット名 |

---

## 実装手順

### Step 1: Secret Manager にシークレット作成 ✅

10個のシークレットを `gcloud secrets create` + `gcloud secrets versions add` で作成・値設定。

### Step 2: Cloud Build SA に権限付与 ✅

- Cloud Build legacy SA (`90453473992@cloudbuild.gserviceaccount.com`) に `roles/secretmanager.secretAccessor` を付与
- Compute Engine default SA (`90453473992-compute@developer.gserviceaccount.com`) にも同じロールを付与（`gcloud builds submit` はこちらの SA で実行されるため）
- Cloud Build P4SA (`service-90453473992@gcp-sa-cloudbuild.iam.gserviceaccount.com`) に `roles/secretmanager.admin` を付与（GitHub 接続に必要）

### Step 3: cloudbuild.yaml を書き換え ✅

- `substitutions` から機密値を削除、`_GCS_PREVIEW_BUCKET` を追加
- `availableSecrets.secretManager` セクションを追加（10個）
- Step 3 (agent deploy): `secretEnv` でシークレット参照
- Step 5 (web build): `secretEnv` で Firebase build-arg を参照
- Step 7 (web deploy): `secretEnv` を追加

### Step 4: Cloud Build トリガー設定 ✅

- GitHub 2nd-gen 接続 (`github-alcheme`) を作成、OAuth 認証完了
- リポジトリ `khoorZruog/alcheme` をリンク
- `deploy-on-push-main` トリガー作成（`main` ブランチへの push で自動ビルド）

### Step 5: デプロイ検証 ✅

- `gcloud builds submit` で substitutions なしでデプロイ成功（build ID: `3ecf8ea4`）
- 全7ステップ正常完了（agent build → push → deploy → get URL → web build → push → deploy）

---

## デプロイ方法（移行後）

### 手動デプロイ（substitutions 不要）
```bash
gcloud builds submit . --project=alcheme-c36ef --config=cloudbuild.yaml
```

### 自動デプロイ
```bash
git push origin main
# → Cloud Build トリガーが自動実行
```

---

## 注意事項

- シークレット値の更新: `gcloud secrets versions add SECRET_NAME --data-file=-`
- トリガーの SA は Cloud Build legacy SA (`90453473992@cloudbuild.gserviceaccount.com`)
- `gcloud builds submit` は Compute Engine default SA (`90453473992-compute@developer.gserviceaccount.com`) を使用
- 両 SA に `secretAccessor` が必要
