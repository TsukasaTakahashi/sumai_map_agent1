# 住まいマップ共有システム

住所の配列を受け取り、Google Maps上に複数のピンを表示する共有マップシステムです。

## 特徴

- 住所を入力すると自動でジオコーディング（緯度経度に変換）
- 短い共有URL（例：`/m/abc123`）を自動生成
- 各ピンの吹き出しから「地図」「経路」「ストリートビュー」へのリンク
- ジオコーディング結果をキャッシュして無駄なAPI呼び出しを削減
- Google Maps APIの無料枠（$200/月）を前提に設計

## 技術スタック

- **フロントエンド**: React + Vite + Google Maps JavaScript API
- **バックエンド**: Python FastAPI
- **データベース**: SQLite
- **開発環境**: Node.js 18+, Python 3.9+

## プロジェクト構成

```
/server
  main.py           # FastAPIメインアプリケーション
  db.py             # データベース層
  models.py         # リクエスト/レスポンスモデル
  requirements.txt  # Python依存関係
  .env.example      # 環境変数のサンプル

/frontend
  index.html
  src/
    main.jsx              # エントリーポイント
    pages/
      CreatePage.jsx      # マップ作成画面
      SharedMap.jsx       # 共有マップ表示画面
  vite.config.js
  package.json
  .env.example            # 環境変数のサンプル

README.md
```

## セットアップ手順

### 1. Google Cloud Console でAPIを有効化

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成（または既存のものを選択）
3. 以下のAPIを有効化：
   - **Maps JavaScript API** （フロント用）
   - **Geocoding API** （サーバ用）

### 2. APIキーを作成

#### サーバ側キー（Geocoding用）
1. 「認証情報」→「認証情報を作成」→「APIキー」
2. キーの制限を設定：
   - **アプリケーションの制限**: IPアドレス（開発環境のIPを追加）
   - **API の制限**: Geocoding API のみ
3. キーをコピーして保存

#### フロント側キー（Maps JavaScript API用）
1. 同様に新しいAPIキーを作成
2. キーの制限を設定：
   - **アプリケーションの制限**: HTTPリファラ
   - 許可するリファラ:
     - `http://localhost:5173/*`
     - `http://127.0.0.1:5173/*`
     - （本番環境のドメインも追加）
   - **API の制限**: Maps JavaScript API のみ
3. キーをコピーして保存

### 3. バックエンドのセットアップ

```bash
cd server

# 仮想環境を作成・有効化
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 依存関係をインストール
pip install -r requirements.txt

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してGOOGLE_GEOCODING_KEYを設定

# または直接エクスポート（Macの場合）
export GOOGLE_GEOCODING_KEY=your_geocoding_api_key_here

# サーバーを起動
uvicorn main:app --reload
```

サーバーは `http://localhost:8000` で起動します。

### 4. フロントエンドのセットアップ

```bash
cd frontend

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してVITE_GOOGLE_MAPS_JS_KEYを設定

# または直接作成
echo "VITE_GOOGLE_MAPS_JS_KEY=your_maps_js_api_key_here" > .env

# 開発サーバーを起動
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

### 5. 動作確認

1. ブラウザで `http://localhost:5173/create` を開く
2. 初期値の住所リスト（またはお好みの住所）を入力
3. 「マップを作成」をクリック
4. 共有URLが表示されるのでクリック
5. 地図上に複数のピンが表示されることを確認
6. ピンをクリックして吹き出しを開き、「地図」「経路」「ストリートビュー」のリンクをテスト

## API仕様

### POST /api/maps

マップを作成して短縮URLを返します。

**リクエスト例:**
```json
{
  "title": "本日のご案内",
  "pins": [
    {"name": "物件A", "address": "東京都千代田区大手町1-1-1"},
    {"name": "物件B", "address": "東京都中央区晴海5-1-1"}
  ]
}
```

**レスポンス例:**
```json
{
  "map_id": "abc123",
  "share_url": "http://localhost:5173/m/abc123"
}
```

### GET /api/maps/{map_id}

マップデータを取得します。

**レスポンス例:**
```json
{
  "map_id": "abc123",
  "title": "本日のご案内",
  "pins": [
    {
      "name": "物件A",
      "address": "東京都千代田区大手町1-1-1",
      "lat": 35.6859,
      "lng": 139.7648
    },
    {
      "name": "物件B",
      "address": "東京都中央区晴海5-1-1",
      "lat": 35.6400,
      "lng": 139.7800
    }
  ]
}
```

## データベーススキーマ

### maps テーブル
```sql
CREATE TABLE maps (
  id TEXT PRIMARY KEY,          -- 短縮ID (abc123)
  title TEXT NOT NULL,          -- マップタイトル
  created_at INTEGER NOT NULL,  -- 作成日時（Unix timestamp）
  expires_at INTEGER,           -- 有効期限（未実装）
  owner TEXT,                   -- 所有者（未実装）
  view_count INTEGER DEFAULT 0  -- 閲覧数
)
```

### pins テーブル
```sql
CREATE TABLE pins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  map_id TEXT NOT NULL,         -- maps.idへの外部キー
  name TEXT NOT NULL,           -- ピン名
  address TEXT NOT NULL,        -- 住所
  lat REAL NOT NULL,            -- 緯度
  lng REAL NOT NULL,            -- 経度
  note_json TEXT                -- メモ（JSON、未実装）
)
```

### geocode_cache テーブル
```sql
CREATE TABLE geocode_cache (
  address_norm TEXT PRIMARY KEY,  -- 正規化された住所
  lat REAL NOT NULL,              -- 緯度
  lng REAL NOT NULL,              -- 経度
  updated_at INTEGER NOT NULL     -- 更新日時
)
```

## セキュリティ

### APIキーの管理

- **サーバ側キー**: `.env`ファイルに保存、Gitにコミットしない
  - IP制限を設定してサーバーのIPからのみアクセス可能に
- **フロント側キー**: `.env`ファイルに保存、Gitにコミットしない
  - HTTPリファラ制限を設定して特定ドメインからのみ利用可能に
  - フロント側キーはブラウザに露出するため、必ずリファラ制限を設定すること

### .gitignore

以下のファイルは必ず`.gitignore`に追加してください：

```
# サーバ側
server/.env
server/.venv/
server/__pycache__/
server/*.db
server/*.db-journal

# フロント側
frontend/.env
frontend/node_modules/
frontend/dist/
```

## 受け入れ基準

以下の動作を確認してください：

- [ ] 住所を2〜3件入力してマップを作成できる
- [ ] 共有URL（`/m/:id`）でルート線なしの複数ピンが表示される
- [ ] 各ピンの吹き出しから「地図」「経路」「ストリートビュー」が正常に起動する
- [ ] サーバ側APIキーがフロントエンドに露出していない（開発者ツールで確認）
- [ ] 同じ住所を再度送信しても追加のGeocoding API呼び出しが発生しない（キャッシュ確認）

## 今後の拡張案

以下の機能は現在未実装ですが、コメントで触れられています：

- **有効期限**: `expires_at`を使った自動削除機能
- **OGP画像生成**: Google Static Maps APIで共有時のプレビュー画像
- **ID衝突回避**: 短縮IDの重複チェックとリトライ
- **バリデーション強化**: 住所フォーマットチェック、ピン数上限
- **住所正規化の高度化**: 丁目・番地の表記揺れ対応
- **認証**: マップの編集・削除機能
- **分析**: アクセスログ・閲覧数の可視化

## トラブルシューティング

### エラー: GOOGLE_GEOCODING_KEY が設定されていません

バックエンドの環境変数が設定されていません。

```bash
export GOOGLE_GEOCODING_KEY=your_key_here
```

### エラー: 住所のジオコーディングに失敗しました

- APIキーが正しいか確認
- Google Cloud Consoleで Geocoding API が有効になっているか確認
- APIキーの制限設定（IP制限など）が正しいか確認

### マップが表示されない

- フロントエンドの`.env`ファイルに`VITE_GOOGLE_MAPS_JS_KEY`が設定されているか確認
- ブラウザの開発者ツールでエラーがないか確認
- Google Cloud Consoleで Maps JavaScript API が有効になっているか確認

### CORSエラー

- バックエンドが`http://localhost:8000`で起動しているか確認
- フロントエンドが`http://localhost:5173`で起動しているか確認
- `server/main.py`のCORS設定を確認

## ライセンス

MIT

## 作者

住まいマップ開発チーム
