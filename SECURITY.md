# セキュリティガイド

## 機密情報の管理

### 絶対にGitにコミットしてはいけないもの

- ❌ APIキー（Google Maps API Key など）
- ❌ データベース接続情報
- ❌ パスワード
- ❌ アクセストークン
- ❌ `.env` ファイル（環境変数ファイル）

### 安全な管理方法

#### 1. 環境変数を使う

デプロイスクリプトでは環境変数から読み込む：

```bash
# ローカル環境で設定
export GOOGLE_MAPS_API_KEY=your-api-key-here

# デプロイ
cd frontend
./deploy.sh
```

#### 2. .gitignore に追加

機密情報を含むファイルは `.gitignore` に追加されています：

```
# デプロイスクリプト（機密情報を含むため）
frontend/deploy.sh
deploy.sh
*.deploy.sh

# 環境変数ファイル
.env
.env.local
.env.*.local
```

#### 3. テンプレートファイルを使う

- `deploy.sh.example` をコピーして `deploy.sh` を作成
- `deploy.sh` は Git管理外（.gitignoreに含まれている）

```bash
# セットアップ
cp frontend/deploy.sh.example frontend/deploy.sh
chmod +x frontend/deploy.sh

# APIキーを環境変数に設定
export GOOGLE_MAPS_API_KEY=your-api-key-here

# デプロイ
./deploy.sh
```

---

## APIキーが漏洩した場合の対応

### 即座に行うこと

1. **新しいAPIキーを発行**
   - Google Cloud Console で新しいキーを作成
   - 古いキーを削除

2. **環境変数を更新**
   ```bash
   export GOOGLE_MAPS_API_KEY=new-api-key-here
   ```

3. **Cloud Runの環境変数を更新**
   ```bash
   gcloud run services update sumai-map-frontend \
     --region=asia-northeast1 \
     --update-env-vars="VITE_GOOGLE_MAPS_JS_KEY=new-api-key-here" \
     --project=sumai-agent
   ```

4. **再デプロイ**
   ```bash
   cd frontend
   ./deploy.sh
   ```

---

## Git履歴から機密情報を削除（高度）

もしGit履歴に機密情報がコミットされてしまった場合：

### 方法1: git filter-repo（推奨）

```bash
# git filter-repo をインストール
brew install git-filter-repo  # Mac
# または pip install git-filter-repo

# 特定のファイルを履歴から削除
git filter-repo --path frontend/deploy.sh --invert-paths

# 強制プッシュ
git push origin --force --all
```

### 方法2: BFG Repo-Cleaner

```bash
# BFG をダウンロード
brew install bfg  # Mac

# 機密情報を含むファイルを削除
bfg --delete-files deploy.sh

# クリーンアップ
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 強制プッシュ
git push origin --force --all
```

⚠️ **注意**: 強制プッシュはチームメンバーに影響を与えます。事前に連絡してください。

---

## APIキーの制限設定（推奨）

Google Maps API Key に制限を設定：

1. Google Cloud Console → API & Services → Credentials
2. API キーを選択
3. 「アプリケーションの制限」を設定：
   - HTTP リファラー: `https://sumai-map-frontend-*.run.app/*`
4. 「API の制限」を設定：
   - Maps JavaScript API のみ許可

これにより、万が一漏洩しても被害を最小限に抑えられます。
