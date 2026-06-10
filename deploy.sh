#!/bin/bash
# ═══════════════════════════════════════════════════════════
# EcoTrace AI — Google Cloud Run Deployment Script
#
# Deploys frontend + backend as separate Cloud Run services.
# Uses `gcloud run deploy --source` (Cloud Build) — no Docker needed locally.
# ═══════════════════════════════════════════════════════════

set -euo pipefail

# ─── Config ────────────────────────────────────────────────
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="asia-south1"  # Mumbai — closest to India
BACKEND_SERVICE="ecotrace-api"
FRONTEND_SERVICE="ecotrace-frontend"

echo "════════════════════════════════════════════"
echo "  EcoTrace AI — Cloud Run Deployment"
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "════════════════════════════════════════════"

# ─── Step 1: Enable required APIs ─────────────────────────
echo ""
echo "📦 Step 1: Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project="${PROJECT_ID}" --quiet

echo "✅ APIs enabled"

# ─── Step 2: Deploy Backend ───────────────────────────────
echo ""
echo "🚀 Step 2: Deploying backend (${BACKEND_SERVICE})..."
gcloud run deploy "${BACKEND_SERVICE}" \
  --source=./backend \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="ECOTRACE_DB_PATH=/tmp/ecotrace.db" \
  --project="${PROJECT_ID}" \
  --quiet

# Get backend URL
BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)" 2>/dev/null)

echo "✅ Backend deployed: ${BACKEND_URL}"

# ─── Step 3: Deploy Frontend ─────────────────────────────
echo ""
echo "🚀 Step 3: Deploying frontend (${FRONTEND_SERVICE})..."
gcloud run deploy "${FRONTEND_SERVICE}" \
  --source=./frontend \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="VITE_API_URL=${BACKEND_URL}/api" \
  --project="${PROJECT_ID}" \
  --quiet

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)" 2>/dev/null)

echo "✅ Frontend deployed: ${FRONTEND_URL}"

# ─── Step 4: Update backend CORS with frontend URL ───────
echo ""
echo "🔗 Step 4: Updating backend CORS with frontend URL..."
gcloud run services update "${BACKEND_SERVICE}" \
  --region="${REGION}" \
  --platform=managed \
  --set-env-vars="ECOTRACE_DB_PATH=/tmp/ecotrace.db,FRONTEND_URL=${FRONTEND_URL}" \
  --project="${PROJECT_ID}" \
  --quiet

echo "✅ CORS updated"

# ─── Done ─────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo ""
echo "  Frontend: ${FRONTEND_URL}"
echo "  Backend:  ${BACKEND_URL}"
echo "  API Docs: ${BACKEND_URL}/docs"
echo "════════════════════════════════════════════"
