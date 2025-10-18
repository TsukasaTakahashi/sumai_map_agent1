# Cloud Runデプロイ手順

このドキュメントでは、住まいマップ共有アプリをGoogle Cloud Runにデプロイする手順を説明します。

## 前提条件

1. **GCPアカウント**
   - Google Cloudアカウントとプロジェクトが必要です
   - https://console.cloud.google.com/

2. **gcloud CLIのインストール**
   ```bash
   # インストール確認
   gcloud --version

   # ない場合はインストール
   # https://cloud.google.com/sdk/docs/install
   ```

3. **Docker Desktop**
   - Dockerがインストールされていること
   - https://www.docker.com/products/docker-desktop/

4. **Google Maps APIキー**
   - Geocoding API用（バックエンド）
   - Maps JavaScript API用（フロントエンド）

---

## 手順1: GCPプロジェクトの設定

```bash
# GCPにログイン
gcloud auth login

# プロジェクトIDを設定（あなたのプロジェクトIDに置き換えてください）
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

---

## 手順2: バックエンドをデプロイ

```bash
cd server

# イメージをビルドしてCloud Runにデプロイ
gcloud run deploy sumai-map-backend \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_GEOCODING_KEY=YOUR_GEOCODING_API_KEY" \
  --set-env-vars "DB_PATH=/data/maps.db" \
  --set-env-vars "FRONTEND_URL=https://YOUR_FRONTEND_URL" \
  --execution-environment gen2 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10

# SQLiteファイルを永続化するためのボリュームマウント
# 注: Cloud Runでボリュームをマウントする場合は、GCS FUSEまたはCloud SQLを使用する必要があります
# 簡易版としては、まずボリュームなしでデプロイし、後でCloud SQL移行を検討
```

**デプロイ後、バックエンドのURLをメモしてください:**
```
例: https://sumai-map-backend-xxxxx-an.a.run.app
```

---

## 手順3: フロントエンドをデプロイ

```bash
cd ../frontend

# 環境変数を設定してビルド＆デプロイ
gcloud run deploy sumai-map-frontend \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "VITE_API_BASE_URL=https://YOUR_BACKEND_URL" \
  --set-env-vars "VITE_GOOGLE_MAPS_JS_KEY=YOUR_MAPS_JS_API_KEY" \
  --cpu 1 \
  --memory 256Mi \
  --min-instances 0 \
  --max-instances 5
```

**デプロイ後、フロントエンドのURLをメモしてください:**
```
例: https://sumai-map-frontend-xxxxx-an.a.run.app
```

---

## 手順4: CORS設定を更新

バックエンドのCORS設定を更新して、フロントエンドからのリクエストを許可します。

```bash
cd server

# フロントエンドURLを環境変数に追加して再デプロイ
gcloud run deploy sumai-map-backend \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --update-env-vars "FRONTEND_URL=https://YOUR_FRONTEND_URL,ALLOWED_ORIGINS=https://YOUR_FRONTEND_URL"
```

---

## 手順5: Google Maps API Keyの制限設定

セキュリティのため、APIキーに制限を設定します。

### Geocoding API Key（バックエンド用）
1. https://console.cloud.google.com/apis/credentials
2. バックエンド用のAPIキーを選択
3. 「アプリケーションの制限」→「なし」（Cloud Run IPは動的なため）
4. 「API の制限」→「Geocoding API」のみ許可

### Maps JavaScript API Key（フロントエンド用）
1. フロントエンド用のAPIキーを選択
2. 「アプリケーションの制限」→「HTTPリファラー」
3. 以下を追加:
   - `https://YOUR_FRONTEND_URL/*`
4. 「API の制限」→「Maps JavaScript API」のみ許可

---

## 手順6: 動作確認

1. フロントエンドURLにアクセス: `https://YOUR_FRONTEND_URL`
2. マップを作成してテスト
3. 共有URLが正しく生成されるか確認

---

## トラブルシューティング

### ログの確認

```bash
# バックエンドのログ
gcloud run logs read sumai-map-backend --region asia-northeast1

# フロントエンドのログ
gcloud run logs read sumai-map-frontend --region asia-northeast1
```

### よくあるエラー

1. **CORS エラー**
   - バックエンドの`ALLOWED_ORIGINS`にフロントエンドURLが含まれているか確認

2. **API Key エラー**
   - APIキーが正しく設定されているか確認
   - APIが有効化されているか確認

3. **SQLite データが消える**
   - Cloud Runはステートレスなので、コンテナ再起動でデータが消えます
   - 本番運用では Cloud SQL または Firestore への移行を推奨

---

## コスト試算

**無料枠（月次）:**
- Cloud Run: 200万リクエスト、36万vCPU秒、18万GiB秒

**想定コスト（月間1000アクセスの場合）:**
- ほぼ無料（無料枠内）

**スケールした場合（月間10万アクセス）:**
- 約 $5-10/月

---

## 次のステップ

1. **独自ドメインの設定**
   ```bash
   gcloud run domain-mappings create \
     --service sumai-map-frontend \
     --domain your-domain.com \
     --region asia-northeast1
   ```

2. **Cloud SQLへの移行**（データ永続化）
   - PostgreSQL or MySQLに移行
   - 月額 $7～

3. **CI/CDの設定**
   - GitHub Actionsで自動デプロイ

4. **モニタリング**
   - Cloud Monitoringでアラート設定
