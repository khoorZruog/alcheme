#!/bin/bash
# alche:me — Cloud Run deploy script
# Usage: ./scripts/deploy.sh [--agent-only | --web-only]
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-alcheme-c36ef}"
REGION="asia-northeast1"
AR_REPO="alcheme"
TAG="${1:-latest}"
AGENT_SERVICE="alcheme-agent"
WEB_SERVICE="alcheme-web"

AR_PREFIX="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"

echo "🔧 Project: ${PROJECT_ID}"
echo "📍 Region:  ${REGION}"
echo "🏷  Tag:     ${TAG}"

# ── Ensure Artifact Registry repo exists ──
gcloud artifacts repositories describe "${AR_REPO}" \
  --location="${REGION}" --project="${PROJECT_ID}" 2>/dev/null || \
gcloud artifacts repositories create "${AR_REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT_ID}"

# ── Build & deploy agent ──
if [[ "${2:-}" != "--web-only" ]]; then
  echo ""
  echo "=== Building agent image ==="
  docker build -t "${AR_PREFIX}/agent:${TAG}" ./agent
  docker push "${AR_PREFIX}/agent:${TAG}"

  echo ""
  echo "=== Deploying agent to Cloud Run ==="
  gcloud run deploy "${AGENT_SERVICE}" \
    --image="${AR_PREFIX}/agent:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --no-allow-unauthenticated \
    --port=8080 \
    --memory=1Gi \
    --max-instances=3 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
    --project="${PROJECT_ID}"
fi

# ── Get agent URL ──
AGENT_URL=$(gcloud run services describe "${AGENT_SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format='value(status.url)')
echo "🤖 Agent URL: ${AGENT_URL}"

# ── Build & deploy web ──
if [[ "${2:-}" != "--agent-only" ]]; then
  echo ""
  echo "=== Building web image ==="
  docker build -t "${AR_PREFIX}/web:${TAG}" \
    --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY:-}" \
    --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-}" \
    --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="${PROJECT_ID}" \
    --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-}" \
    --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-}" \
    --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="${NEXT_PUBLIC_FIREBASE_APP_ID:-}" \
    --build-arg NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-}" \
    .
  docker push "${AR_PREFIX}/web:${TAG}"

  echo ""
  echo "=== Deploying web to Cloud Run ==="
  gcloud run deploy "${WEB_SERVICE}" \
    --image="${AR_PREFIX}/web:${TAG}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3000 \
    --memory=512Mi \
    --max-instances=5 \
    --set-env-vars="NODE_ENV=production,ADK_AGENT_URL=${AGENT_URL},FIREBASE_PROJECT_ID=${PROJECT_ID},GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
    --project="${PROJECT_ID}"

  WEB_URL=$(gcloud run services describe "${WEB_SERVICE}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --format='value(status.url)')
  echo ""
  echo "✅ Deploy complete!"
  echo "🌐 Web URL:   ${WEB_URL}"
  echo "🤖 Agent URL: ${AGENT_URL}"
fi
