# alche:me — Cloud Build deploy script (Docker不要)
# Usage: .\scripts\deploy-cloud.ps1 [-Tag v1]
param(
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ── .env.local から Firebase 値を読み取り ──
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Error ".env.local が見つかりません: $envFile"
    exit 1
}

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.+)$') {
        $envVars[$Matches[1]] = $Matches[2].Trim()
    }
}

# 必須キーのチェック
$requiredKeys = @(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)
foreach ($key in $requiredKeys) {
    if (-not $envVars[$key]) {
        Write-Error ".env.local に ${key} が設定されていません"
        exit 1
    }
}

# ── substitutions 文字列を組み立て ──
$substitutions = @(
    "_TAG=$Tag",
    "_FIREBASE_API_KEY=$($envVars['NEXT_PUBLIC_FIREBASE_API_KEY'])",
    "_FIREBASE_AUTH_DOMAIN=$($envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'])",
    "_FIREBASE_STORAGE_BUCKET=$($envVars['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'])",
    "_FIREBASE_MESSAGING_SENDER_ID=$($envVars['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'])",
    "_FIREBASE_APP_ID=$($envVars['NEXT_PUBLIC_FIREBASE_APP_ID'])"
) -join ","

Write-Host ""
Write-Host "=== alche:me Cloud Build Deploy ===" -ForegroundColor Cyan
Write-Host "Tag:     $Tag"
Write-Host "Project: alcheme-c36ef"
Write-Host "Region:  asia-northeast1"
Write-Host ""

# ── Artifact Registry リポジトリの存在確認 ──
Write-Host "Checking Artifact Registry..." -ForegroundColor Yellow
$ErrorActionPreference = "Continue"
$repoExists = gcloud artifacts repositories describe alcheme --location=asia-northeast1 --project=alcheme-c36ef 2>&1
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Artifact Registry repository..." -ForegroundColor Yellow
    gcloud artifacts repositories create alcheme `
        --repository-format=docker `
        --location=asia-northeast1 `
        --project=alcheme-c36ef
}

# ── Cloud Build でビルド＆デプロイ ──
Write-Host ""
Write-Host "Submitting to Cloud Build..." -ForegroundColor Yellow
Write-Host "(Agent + Web のビルド＆デプロイを GCP 側で実行します。数分かかります)"
Write-Host ""

gcloud builds submit . `
    --config=cloudbuild.yaml `
    --substitutions="$substitutions" `
    --project=alcheme-c36ef

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Build failed. Check logs: https://console.cloud.google.com/cloud-build/builds?project=alcheme-c36ef"
    exit 1
}

# ── デプロイ結果を表示 ──
Write-Host ""
Write-Host "=== Deploy Complete ===" -ForegroundColor Green

$agentUrl = gcloud run services describe alcheme-agent `
    --region=asia-northeast1 --project=alcheme-c36ef `
    --format="value(status.url)"
$webUrl = gcloud run services describe alcheme-web `
    --region=asia-northeast1 --project=alcheme-c36ef `
    --format="value(status.url)"

Write-Host "Agent URL: $agentUrl" -ForegroundColor Cyan
Write-Host "Web URL:   $webUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. ブラウザで $webUrl にアクセス"
Write-Host "  2. Firebase Console で承認済みドメインに Web URL を追加"
Write-Host "  3. Agent の環境変数を追加: gcloud run services update alcheme-agent --region=asia-northeast1 --set-env-vars='GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_CLOUD_LOCATION=asia-northeast1'"
