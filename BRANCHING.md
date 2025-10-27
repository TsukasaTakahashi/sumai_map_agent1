# ブランチ戦略

## ブランチ構成

```
main (本番環境・安定版)
  └── develop (開発ブランチ)
       └── feature/* (個別機能開発ブランチ)
```

## 各ブランチの役割

### `main` ブランチ
- **用途**: 本番環境にデプロイされる安定版
- **デプロイURL**: https://sumai-map-frontend-h4uibw667a-an.a.run.app
- **ルール**:
  - 直接コミットしない
  - develop ブランチからのマージのみ
  - タグでバージョン管理（例: v1.0, v1.1）

### `develop` ブランチ
- **用途**: 開発統合ブランチ
- **ルール**:
  - 日常的な開発はここで行う
  - 安定したら main にマージ

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

# 4. 動作確認後、main にマージ
git checkout main
git pull origin main
git merge develop
git push origin main
```

### 本番デプロイ（main ブランチから）

```bash
# main ブランチに切り替え
git checkout main

# 最新を取得
git pull origin main

# デプロイ
cd frontend
./deploy.sh
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

# デプロイ
cd frontend
./deploy.sh
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
