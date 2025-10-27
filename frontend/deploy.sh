#!/bin/bash

# フロントエンド専用デプロイスクリプト

set -e

echo "====================================="
echo "フロントエンドをデプロイ"
echo "====================================="

# CACHEBUSTを自動更新
TIMESTAMP=$(date +%s)
echo "Dockerのキャッシュをクリア中... (CACHEBUST=${TIMESTAMP})"
sed -i.bak "s/ARG CACHEBUST=.*/ARG CACHEBUST=${TIMESTAMP}/" Dockerfile
rm -f Dockerfile.bak

# デプロイ実行
echo "デプロイを開始..."
gcloud run deploy sumai-map-frontend \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "VITE_API_BASE_URL=https://sumai-map-backend-h4uibw667a-an.a.run.app,VITE_GOOGLE_MAPS_JS_KEY=AIzaSyB5_kCzu5EXynibi61tEAD1XnewXdUfS9U" \
  --project sumai-agent

echo ""
echo "====================================="
echo "デプロイ完了！"
echo "====================================="
echo ""
echo "URL: https://sumai-map-frontend-h4uibw667a-an.a.run.app"
echo ""
