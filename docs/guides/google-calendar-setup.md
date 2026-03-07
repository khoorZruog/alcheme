# Google Calendar API セットアップガイド

## 前提条件
- GCP プロジェクト（billing 有効）
- Firebase プロジェクトが GCP にリンク済み

## Step 1: Google Calendar API の有効化
1. [GCP Console](https://console.cloud.google.com/) にアクセス
2. alcheme のプロジェクトを選択
3. **APIs & Services** → **Library**
4. 「Google Calendar API」を検索 → **ENABLE**

## Step 2: OAuth 同意画面の設定
1. **APIs & Services** → **OAuth consent screen**
2. User Type: **External**
3. App information:
   - App name: `alche:me`
   - User support email: 管理者メールアドレス
   - Developer contact: 管理者メールアドレス
4. Scopes → **ADD OR REMOVE SCOPES**:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
5. Test users → **ADD USERS** → 自分のGoogleアカウント追加

## Step 3: OAuth 2.0 クライアントID の作成
1. **APIs & Services** → **Credentials**
2. **CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `alche:me Calendar Integration`
5. Authorized redirect URIs:
   - 開発: `http://localhost:3000/api/auth/google-calendar/callback`
   - 本番: `https://YOUR_DOMAIN/api/auth/google-calendar/callback`
6. **CREATE** → Client ID と Client Secret をコピー

## Step 4: 環境変数の設定

### Next.js (.env.local)
```
GOOGLE_CALENDAR_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxx
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
```

### Agent Server (agent/.env)
```
GOOGLE_CALENDAR_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxx
```

## Step 5: Cloud Run デプロイ時
`cloudbuild.yaml` の substitutions に以下を設定:
```yaml
_GOOGLE_CALENDAR_CLIENT_ID: "xxx.apps.googleusercontent.com"
_GOOGLE_CALENDAR_CLIENT_SECRET: "xxx"
```

Web サービスの `GOOGLE_CALENDAR_REDIRECT_URI` は `cloudbuild.yaml` で自動設定される。

## セキュリティノート
- トークンは Firestore `users/{userId}` に保存（Firestore rules でオーナーのみアクセス可）
- Scopes は読み取り専用（`calendar.readonly`, `calendar.events.readonly`）
- ユーザーはいつでも連携解除可能（トークン revoke + Firestore 削除）

---

*Created: 2026-03-07*
