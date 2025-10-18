#!/bin/sh

# 環境変数をJavaScriptファイルに置換
# これにより、ビルド後でも環境変数を動的に設定可能

ROOT_DIR=/usr/share/nginx/html

# JavaScriptファイル内のプレースホルダーを実際の環境変数で置換
find "$ROOT_DIR" -type f -name "*.js" -exec sed -i \
  -e "s|VITE_API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL:-http://localhost:8000}|g" \
  -e "s|VITE_GOOGLE_MAPS_JS_KEY_PLACEHOLDER|${VITE_GOOGLE_MAPS_JS_KEY}|g" \
  {} \;

echo "Environment variables injected successfully"
