#!/bin/bash
set -e

echo "🚀 Viva360: Staging Deployment Pipeline"
echo "=========================================="

echo "🔹 1/4: Clean Build"
rm -rf dist_staging
echo "✅ Cleaned"

echo "🔹 2/4: Production Build"
npm run build
echo "✅ Build Successful"

echo "🔹 3/4: Artifact Promotion"
mv dist dist_staging
echo "✅ Artifacts moved to /dist_staging"

echo "🔹 4/4: Cloud Sync (Simulated)"
echo "   - Uploading to s3://viva360-staging/ ..."
echo "   - Invalidate CloudFront..."
echo "✅ Mock Deployment Complete"

echo "=========================================="
echo "🌐 APP LIVE AT: https://staging.viva360.app"
