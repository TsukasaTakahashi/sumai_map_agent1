#!/bin/sh

# 環境変数をJavaScriptファイルに置換
# これにより、ビルド後でも環境変数を動的に設定可能

echo "=== Starting env.sh ==="
echo "VITE_API_BASE_URL: ${VITE_API_BASE_URL}"
echo "VITE_GOOGLE_MAPS_JS_KEY: ${VITE_GOOGLE_MAPS_JS_KEY:0:20}..."

ROOT_DIR=/usr/share/nginx/html

# PORT環境変数のデフォルト値を設定（Cloud Runは通常8080を使用）
export PORT=${PORT:-8080}

# Nginx設定ファイル内のPORTプレースホルダーを置換
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
echo "Nginx config updated with PORT: $PORT"

# JavaScriptファイルを検索
echo "Searching for JS files in: $ROOT_DIR"
JS_FILES=$(find "$ROOT_DIR" -type f -name "*.js")
echo "Found JS files:"
echo "$JS_FILES"

# JavaScriptファイル内のlocalhost:8000を実際のバックエンドURLで置換
if [ -z "$JS_FILES" ]; then
  echo "ERROR: No JS files found!"
else
  for file in $JS_FILES; do
    echo "Processing: $file"
    sed -i.bak \
      -e "s|VITE_API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL}|g" \
      -e "s|http://localhost:8000|${VITE_API_BASE_URL}|g" \
      -e "s|VITE_GOOGLE_MAPS_JS_KEY_PLACEHOLDER|${VITE_GOOGLE_MAPS_JS_KEY}|g" \
      "$file"
    rm -f "${file}.bak"
    echo "✓ Replaced variables in: $file"
  done
fi

echo "=== Environment variables injected successfully ==="
