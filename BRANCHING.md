# ブランチ戦略

## ブランチ構成

```
main (本番環境・安定版)
  └── develop (開発ブランチ)
       └── feature/* (個別機能開発ブランチ)
```

## 環境構成

### 本番環境 (Production)
- **ブランチ**: `main`
- **フロントエンド**: https://sumai-map-frontend-801454761821.asia-northeast1.run.app
- **バックエンド**: https://sumai-map-backend-801454761821.asia-northeast1.run.app
- **用途**: エンドユーザー向けの安定版

### 開発環境 (Development)
- **ブランチ**: `develop`
- **フロントエンド**: https://sumai-map-frontend-dev-801454761821.asia-northeast1.run.app
- **バックエンド**: https://sumai-map-backend-dev-801454761821.asia-northeast1.run.app
- **用途**: 開発・テスト用

---

## 各ブランチの役割

### `main` ブランチ
- **用途**: 本番環境にデプロイされる安定版
- **デプロイ先**: 本番環境（エンドユーザー向け）
- **ルール**:
  - 直接コミットしない
  - develop ブランチからのマージのみ
  - タグでバージョン管理（例: v1.0, v1.1）

### `develop` ブランチ
- **用途**: 開発統合ブランチ
- **デプロイ先**: 開発環境（テスト用）
- **ルール**:
  - 日常的な開発はここで行う
  - 開発環境で動作確認後、main にマージ

### `feature/*` ブランチ（オプション）
- **用途**: 大きな機能開発用
- **命名規則**: `feature/機能名`
- **例**: `feature/user-authentication`, `feature/csv-export`
- **ルール**:
  - develop から分岐
  - 完成したら develop にマージ

---

## 開発フロー

### 日常的な開発・修正

```bash
# 1. develop ブランチで作業
git checkout develop
git pull origin develop

# 2. 修正・開発
# [ファイルを編集]

# 3. コミット
git add .
git commit -m "修正: ○○を変更"
git push origin develop

# 4. 開発環境にデプロイして動作確認
cd frontend
export GOOGLE_MAPS_API_KEY=your-api-key
./deploy-dev.sh

cd ../server
./deploy-dev.sh

# 5. 開発環境で確認 → OK なら main にマージ
git checkout main
git pull origin main
git merge develop
git push origin main

# 6. 本番環境にデプロイ
cd frontend
./deploy.sh

cd ../server
# バックエンドは自動デプロイまたは手動で実行
gcloud run deploy sumai-map-backend --source . --region asia-northeast1 --project sumai-agent
```

### 開発環境デプロイ（develop ブランチから）

```bash
# develop ブランチに切り替え
git checkout develop

# 最新を取得
git pull origin develop

# バックエンド開発環境デプロイ
cd server
./deploy-dev.sh

# フロントエンド開発環境デプロイ
cd ../frontend
export GOOGLE_MAPS_API_KEY=your-api-key
./deploy-dev.sh

# 開発環境で確認
# https://sumai-map-frontend-dev-801454761821.asia-northeast1.run.app
```

### 本番デプロイ（main ブランチから）

```bash
# main ブランチに切り替え
git checkout main

# 最新を取得
git pull origin main

# バックエンド本番環境デプロイ
cd server
gcloud run deploy sumai-map-backend --source . --region asia-northeast1 --project sumai-agent

# フロントエンド本番環境デプロイ
cd ../frontend
export GOOGLE_MAPS_API_KEY=your-api-key
./deploy.sh

# 本番環境で確認
# https://sumai-map-frontend-801454761821.asia-northeast1.run.app
```

---

## コミットメッセージ規約

- **機能追加**: `機能: ○○を追加`
- **修正**: `修正: ○○を変更`
- **バグ修正**: `修正: ○○のバグを修正`
- **UI改善**: `UI: ○○のデザインを改善`
- **ドキュメント**: `docs: ○○を更新`

---

## タグでのバージョン管理

安定版リリース時にタグを付ける：

```bash
# main ブランチでタグを作成
git checkout main
git tag -a v1.0 -m "初回リリース版"
git push origin v1.0
```

---

## 緊急修正（Hotfix）

本番環境で緊急の修正が必要な場合：

```bash
# main から hotfix ブランチを作成
git checkout main
git checkout -b hotfix/修正内容

# 修正
# [ファイルを編集]

# コミット
git add .
git commit -m "緊急修正: ○○を修正"

# main と develop の両方にマージ
git checkout main
git merge hotfix/修正内容
git push origin main

git checkout develop
git merge hotfix/修正内容
git push origin develop

# 本番環境にデプロイ
cd frontend
export GOOGLE_MAPS_API_KEY=your-api-key
./deploy.sh

cd ../server
gcloud run deploy sumai-map-backend --source . --region asia-northeast1 --project sumai-agent
```

---

## 現在のブランチ確認

```bash
git branch -a
```

## ブランチ切り替え

```bash
# develop に移動
git checkout develop

# main に移動
git checkout main
```
