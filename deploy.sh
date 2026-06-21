#!/bin/bash
set -e
export PATH="$HOME/google-cloud-sdk/bin:$PATH"

PROJECT_ID="venueflow-493616"
REGION="asia-south1"

echo "════════════════════════════════════════════"
echo "  EcoTrace AI — Cloud Run Deployment"
echo "  Project: $PROJECT_ID"
echo "  Region:  $REGION"
echo "════════════════════════════════════════════"

echo "🚀 Step 1: Deploying backend (ecotrace-api)..."
gcloud run deploy ecotrace-api \
  --source backend \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --quiet

echo "🚀 Step 2: Deploying frontend (ecotrace-frontend)..."
gcloud run deploy ecotrace-frontend \
  --source frontend \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --quiet

FRONTEND_URL=$(gcloud run services describe ecotrace-frontend --platform managed --region $REGION --project $PROJECT_ID --format 'value(status.url)')

echo "🔗 Step 3: Updating backend CORS with frontend URL..."
gcloud run services update ecotrace-api \
  --set-env-vars FRONTEND_URL=$FRONTEND_URL \
  --region $REGION \
  --project $PROJECT_ID \
  --quiet

echo "════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "════════════════════════════════════════════"
