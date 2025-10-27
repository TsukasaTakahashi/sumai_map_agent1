#!/bin/bash

# 住まいマップ共有アプリ - Cloud Runデプロイスクリプト

set -e

echo "====================================="
echo "住まいマップ共有アプリ デプロイ"
echo "====================================="
echo

# 環境変数の確認
if [ -z "$PROJECT_ID" ]; then
    echo "エラー: PROJECT_ID が設定されていません"
    echo "使用方法:"
    echo "  export PROJECT_ID=your-project-id"
    echo "  export MAPS_JS_API_KEY=your-maps-js-key"
    echo "  ./deploy.sh"
    exit 1
fi

if [ -z "$MAPS_JS_API_KEY" ]; then
    echo "エラー: MAPS_JS_API_KEY が設定されていません"
    exit 1
fi

# プロジェクト設定
echo "プロジェクトを設定: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# リージョン設定
REGION="asia-northeast1"
echo "リージョン: $REGION"
echo

# バックエンドをデプロイ
echo "====================================="
echo "1. バックエンドをデプロイ中..."
echo "====================================="
cd server

gcloud run deploy sumai-map-backend \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "DB_PATH=/data/maps.db" \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10

# バックエンドURLを取得
BACKEND_URL=$(gcloud run services describe sumai-map-backend --region $REGION --format 'value(status.url)')
echo
echo "バックエンドURL: $BACKEND_URL"
echo

cd ..

# フロントエンドをデプロイ
echo "====================================="
echo "2. フロントエンドをデプロイ中..."
echo "====================================="
cd frontend

# キャッシュバスト: Dockerfileのビルドタイムスタンプを更新
echo "Dockerのキャッシュをクリア中..."
TIMESTAMP=$(date +%s)
sed -i.bak "s/ARG CACHEBUST=.*/ARG CACHEBUST=${TIMESTAMP}/" Dockerfile
echo "CACHEBUST=${TIMESTAMP} に更新"

gcloud run deploy sumai-map-frontend \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "VITE_API_BASE_URL=$BACKEND_URL,VITE_GOOGLE_MAPS_JS_KEY=$MAPS_JS_API_KEY" \
  --cpu 1 \
  --memory 256Mi \
  --min-instances 0 \
  --max-instances 5

# フロントエンドURLを取得
FRONTEND_URL=$(gcloud run services describe sumai-map-frontend --region $REGION --format 'value(status.url)')
echo
echo "フロントエンドURL: $FRONTEND_URL"
echo

# Dockerfileをクリーンアップ（バックアップがあれば削除）
rm -f Dockerfile.bak

cd ..

# バックエンドのCORS設定を更新
echo "====================================="
echo "3. CORS設定を更新中..."
echo "====================================="
cd server

gcloud run services update sumai-map-backend \
  --region $REGION \
  --update-env-vars "FRONTEND_URL=$FRONTEND_URL,ALLOWED_ORIGINS=$FRONTEND_URL"

cd ..

echo
echo "====================================="
echo "デプロイ完了！"
echo "====================================="
echo
echo "アプリURL: $FRONTEND_URL"
echo "API URL: $BACKEND_URL"
echo
echo "次のステップ:"
echo "1. $FRONTEND_URL にアクセスしてテスト"
echo "2. Google Maps APIキーの制限設定（DEPLOY.mdを参照）"
echo
