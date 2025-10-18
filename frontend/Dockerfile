# ビルドステージ
FROM node:18-alpine AS builder

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

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ビルドしたファイルをNginxの公開ディレクトリにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# 環境変数を実行時に置換するスクリプトを追加
COPY env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
