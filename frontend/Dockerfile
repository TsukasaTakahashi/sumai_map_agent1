# ビルドステージ
FROM node:18-alpine AS builder

# キャッシュバスト用
ARG CACHEBUST=1761519562

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# ビルド（環境変数は実行時に注入されるため、ここではダミー値）
RUN npm run build

# 本番ステージ
FROM nginx:alpine

# Nginxの設定ファイルをテンプレートとしてコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# ビルドしたファイルをNginxの公開ディレクトリにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# 環境変数を実行時に置換するスクリプトを追加
# /docker-entrypoint.d/ 内のスクリプトは自動実行される
COPY env.sh /docker-entrypoint.d/40-env-inject.sh
RUN chmod +x /docker-entrypoint.d/40-env-inject.sh

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
