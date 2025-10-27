# SumaiAgent - 住まいマップ共有アプリ

Google Maps APIとjageocoderを使用した日本の住所に特化したマップ共有アプリケーション。

---

## 🚨 超重要：本番環境について

### ⚠️ 絶対に守ること

**本番環境（mainブランチ）は現在エンドユーザーが使用中です。**

#### ❌ やってはいけないこと

- mainブランチから直接デプロイしない
- 本番環境（mainブランチ）で実験的な変更をしない
- 本番URLで動作テストをしない
- 本番環境のCloud Runサービスを直接変更しない

#### ✅ 必ずやること

- **開発は必ずdevelopブランチで行う**
- **テストは必ず開発環境で行う**
- **開発環境で確認後にmainにマージ**
- **本番デプロイ前に必ず最終確認**

### 本番環境URL（ユーザー使用中 - 触らない！）

- **フロントエンド**: https://sumai-map-frontend-801454761821.asia-northeast1.run.app
- **バックエンド**: https://sumai-map-backend-801454761821.asia-northeast1.run.app
- **Cloud Runサービス名**: `sumai-map-frontend`, `sumai-map-backend`

---

## 環境構成

### 開発環境 (Development) - 開発・テスト用 👷

- **ブランチ**: `develop`
- **フロントエンド**: https://sumai-map-frontend-dev-801454761821.asia-northeast1.run.app
- **バックエンド**: https://sumai-map-backend-dev-801454761821.asia-northeast1.run.app
- **Cloud Runサービス名**: `sumai-map-frontend-dev`, `sumai-map-backend-dev`
- **用途**: 新機能の開発・テスト・動作確認
- **デプロイスクリプト**: `deploy-dev.sh`

### 本番環境 (Production) - エンドユーザー向け 👥

- **ブランチ**: `main`
- **フロントエンド**: https://sumai-map-frontend-801454761821.asia-northeast1.run.app
- **バックエンド**: https://sumai-map-backend-801454761821.asia-northeast1.run.app
- **Cloud Runサービス名**: `sumai-map-frontend`, `sumai-map-backend`
- **用途**: エンドユーザーが実際に使用する安定版
- **デプロイスクリプト**: `deploy.sh`

---

## プロジェクト構成

```
sumai_map_agent1/
├── frontend/              # React + Vite フロントエンド
│   ├── src/
│   │   └── pages/
│   │       ├── CreatePage.jsx    # マップ作成ページ
│   │       └── SharedMap.jsx     # マップ表示ページ
│   ├── Dockerfile
│   ├── deploy.sh              # 本番環境デプロイ（Git管理外）
│   └── deploy-dev.sh          # 開発環境デプロイ（Git管理外）
│
├── server/                # FastAPI バックエンド
│   ├── main.py           # APIエンドポイント
│   ├── db.py             # データベース層
│   ├── models.py         # Pydanticモデル
│   ├── Dockerfile
│   └── deploy-dev.sh     # 開発環境デプロイ（Git管理外）
│
├── BRANCHING.md          # ブランチ戦略とデプロイフロー
├── SECURITY.md           # セキュリティガイド
└── README.md             # このファイル
```

---

## 技術スタック

### バックエンド
- **言語**: Python 3.11
- **フレームワーク**: FastAPI
- **ジオコーディング**: jageocoder（日本住所特化・無料）
- **データベース**: SQLite
- **デプロイ**: Google Cloud Run

### フロントエンド
- **言語**: JavaScript (React)
- **ビルドツール**: Vite
- **地図**: Google Maps JavaScript API
- **デプロイ**: Google Cloud Run

---

## ⚠️ Git管理とセキュリティ

### 絶対にGitにコミットしてはいけないもの

以下のファイルは `.gitignore` で除外されています：

```
# デプロイスクリプト（APIキーを含む）
frontend/deploy.sh
frontend/deploy-dev.sh
server/deploy-dev.sh
deploy.sh
*.deploy.sh

# 環境変数ファイル
.env
.env.local
.env.*.local

# データベースファイル
server/*.db
server/*.db-journal

# その他
server/.venv/
server/__pycache__/
frontend/node_modules/
frontend/dist/
```

### APIキーの管理

- **Google Maps API Key**: 環境変数 `GOOGLE_MAPS_API_KEY` で管理
- デプロイスクリプトは環境変数から読み込む
- 詳細は `SECURITY.md` を参照

**⚠️ 万が一APIキーがGitにコミットされた場合:**
1. 即座に新しいキーを発行
2. 古いキーを削除
3. `SECURITY.md` の手順に従う

---

## セットアップ

### 前提条件

- Node.js 18以上
- Python 3.11以上
- Google Cloud SDK (`gcloud`)
- Google Maps API Key

### 初回セットアップ

#### 1. リポジトリをクローン

```bash
git clone https://github.com/TsukasaTakahashi/sumai_map_agent1.git
cd sumai_map_agent1
```

#### 2. バックエンドのセットアップ

```bash
cd server

# 仮想環境を作成・有効化
python -m venv .venv
source .venv/bin/activate  # Windowsの場合: .venv\Scripts\activate

# 依存関係をインストール
pip install -r requirements.txt

# jageocoder辞書のダウンロード（初回のみ）
jageocoder download-dictionary
jageocoder install-dictionary
```

#### 3. フロントエンドのセットアップ

```bash
cd frontend
npm install
```

#### 4. デプロイスクリプトの作成

```bash
# ⚠️ これらのファイルは Git管理外です

# フロントエンド本番環境
cp frontend/deploy.sh.example frontend/deploy.sh
chmod +x frontend/deploy.sh

# フロントエンド開発環境
cp frontend/deploy.sh.example frontend/deploy-dev.sh
chmod +x frontend/deploy-dev.sh
# 編集してサービス名を sumai-map-frontend-dev に変更

# バックエンド開発環境
# （既に作成済み）
chmod +x server/deploy-dev.sh
```

---

## 🔄 開発フロー（必ず守る！）

### 推奨：安全な開発フロー

```bash
# ========================================
# 1. developブランチで開発
# ========================================
git checkout develop
git pull origin develop

# ========================================
# 2. 機能を実装
# ========================================
# [ファイルを編集]

# ========================================
# 3. コミット
# ========================================
git add .
git commit -m "機能: ○○を追加"
git push origin develop

# ========================================
# 4. 開発環境にデプロイ
# ========================================
export GOOGLE_MAPS_API_KEY=your-api-key

cd server
./deploy-dev.sh

cd ../frontend
./deploy-dev.sh

# ========================================
# 5. 開発環境で動作確認 ✅
# ========================================
open https://sumai-map-frontend-dev-801454761821.asia-northeast1.run.app

# 問題があれば修正 → 3に戻る

# ========================================
# 6. OKなら本番環境へ（慎重に！）
# ========================================
git checkout main
git pull origin main
git merge develop
git push origin main

# ========================================
# 7. 本番環境にデプロイ（最終確認後）
# ========================================
cd server
gcloud run deploy sumai-map-backend \
  --source . \
  --region asia-northeast1 \
  --project sumai-agent

cd ../frontend
export GOOGLE_MAPS_API_KEY=your-api-key
./deploy.sh

# ========================================
# 8. 本番環境で最終確認 ✅
# ========================================
open https://sumai-map-frontend-801454761821.asia-northeast1.run.app
```

### 開発環境デプロイ（頻繁に使用）

```bash
git checkout develop

# バックエンド開発環境
cd server
./deploy-dev.sh

# フロントエンド開発環境
cd ../frontend
export GOOGLE_MAPS_API_KEY=your-api-key
./deploy-dev.sh

# 確認
open https://sumai-map-frontend-dev-801454761821.asia-northeast1.run.app
```

### 本番環境デプロイ（慎重に！）

```bash
# ⚠️ 必ず開発環境で確認後に実行

git checkout main
git pull origin main

# バックエンド
cd server
gcloud run deploy sumai-map-backend \
  --source . \
  --region asia-northeast1 \
  --project sumai-agent

# フロントエンド
cd ../frontend
export GOOGLE_MAPS_API_KEY=your-api-key
./deploy.sh

# 確認
open https://sumai-map-frontend-801454761821.asia-northeast1.run.app
```

---

## ローカル開発

### バックエンド起動

```bash
cd server
source .venv/bin/activate  # Windowsの場合: .venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

### フロントエンド起動

```bash
cd frontend
npm run dev
```

ブラウザで http://localhost:5173 を開く

---

## 主な機能

### 実装済み機能

- ✅ 日本の住所からGoogle Mapsのピンを自動配置
- ✅ jageocoder（無料）を使用したジオコーディング
- ✅ 10m以内の重複物件を自動グループ化
- ✅ ポップアップのドラッグ移動
- ✅ 短縮URL生成とマップ共有
- ✅ 印刷対応
- ✅ **無効な住所のスキップ機能**（有効な住所だけでマップ作成）

### 最近の変更

#### 2025-10-27: 開発環境と本番環境の分離
- 開発環境（dev）を作成
- 本番環境を保護するための環境分離

#### 2025-10-27: 無効な住所スキップ機能
- 無効な住所があっても有効な住所だけでマップを作成
- スキップされた住所を警告として表示

---

## トラブルシューティング

### デプロイが失敗する

1. **環境変数を確認**
   ```bash
   echo $GOOGLE_MAPS_API_KEY
   ```

2. **gcloud認証を確認**
   ```bash
   gcloud auth list
   gcloud config get-value project
   # プロジェクトIDは sumai-agent であること
   ```

3. **デプロイスクリプトの権限を確認**
   ```bash
   chmod +x frontend/deploy-dev.sh
   chmod +x server/deploy-dev.sh
   ```

### ジオコーディングが失敗する

- jageocoder辞書がインストールされているか確認
  ```bash
  jageocoder get-db-dir
  ```

### Cloud Runのログ確認

```bash
# 開発環境
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=sumai-map-frontend-dev" \
  --limit=50 --project=sumai-agent

# 本番環境
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=sumai-map-frontend" \
  --limit=50 --project=sumai-agent
```

---

## 関連ドキュメント

- **[BRANCHING.md](./BRANCHING.md)** - ブランチ戦略とデプロイフロー詳細
- **[SECURITY.md](./SECURITY.md)** - セキュリティガイドとAPIキー管理

---

## 📝 セッション再開時の伝え方

Claude Codeでセッションが切れた場合、以下のように伝えてください：

```
/Users/tsukasa/Arealinks/map1/sumai_map_agent1 で開発中の
SumaiAgent（住まいマップ共有アプリ）の開発を続けたい

重要:
- 本番環境（main）は現在ユーザーが使用中なので絶対に触らない
- 開発は必ず develop ブランチと開発環境で行う
- README.md を読んで現在の構成を確認してほしい
```

---

## プロジェクト情報

- **開発者**: Tsukasa Takahashi
- **リポジトリ**: https://github.com/TsukasaTakahashi/sumai_map_agent1
- **ライセンス**: Private Project
- **Google Cloud Project**: sumai-agent

---

## チェックリスト

開発時に確認すること：

- [ ] developブランチで作業している
- [ ] 開発環境でテストしている
- [ ] 本番環境を直接触っていない
- [ ] APIキーをGitにコミットしていない
- [ ] デプロイスクリプトをGitにコミットしていない
- [ ] 開発環境で動作確認済み
- [ ] コミットメッセージが明確
