# Python 3.11ベースイメージ
FROM python:3.11-slim

# 作業ディレクトリ
WORKDIR /app

# 依存関係ファイルをコピー
COPY requirements.txt .

# 依存関係をインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# SQLiteファイルを保存するディレクトリを作成
RUN mkdir -p /data

# ポートを公開（Cloud RunのPORT環境変数を使用）
EXPOSE 8080

# Uvicornでアプリケーションを起動（PORT環境変数を使用）
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
