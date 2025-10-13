# クイックスタートガイド

## 現在の状況

環境のセットアップが完了しました。

- ✅ バックエンド（FastAPI）の依存関係インストール完了
- ✅ フロントエンド（React）の依存関係インストール完了

## 今すぐ使うための手順

### ステップ1: Google Maps APIキーを取得

このアプリケーションを動作させるには、Google Maps APIキーが2つ必要です。

#### 1.1 Google Cloud Consoleにアクセス
https://console.cloud.google.com/

#### 1.2 プロジェクトを作成（または選択）

#### 1.3 APIを有効化
- 左メニュー「APIとサービス」→「有効なAPIとサービス」
- 「+ APIとサービスを有効にする」をクリック
- 以下の2つのAPIを検索して有効化：
  - **Maps JavaScript API**
  - **Geocoding API**

#### 1.4 APIキーを作成（2つ）

**キー1: サーバー側（Geocoding用）**
1. 「認証情報」→「認証情報を作成」→「APIキー」
2. 作成されたキーの「編集」をクリック
3. 「アプリケーションの制限」：
   - 「IPアドレス」を選択
   - 「項目を追加」→ `127.0.0.1` を入力
4. 「API の制限」：
   - 「キーを制限」を選択
   - 「Geocoding API」のみチェック
5. 「保存」→ キーをコピー

**キー2: フロント側（Maps JavaScript API用）**
1. もう一度「認証情報を作成」→「APIキー」
2. 作成されたキーの「編集」をクリック
3. 「アプリケーションの制限」：
   - 「HTTPリファラー（ウェブサイト）」を選択
   - 「項目を追加」→ `http://localhost:5173/*` を入力
   - もう一度「項目を追加」→ `http://127.0.0.1:5173/*` を入力
4. 「API の制限」：
   - 「キーを制限」を選択
   - 「Maps JavaScript API」のみチェック
5. 「保存」→ キーをコピー

### ステップ2: 環境変数を設定

#### バックエンド
```bash
cd /Users/tsukasa/Arealinks/map1/sumai_map_agent1/server
export GOOGLE_GEOCODING_KEY="サーバー側のAPIキーをここに貼り付け"
```

#### フロントエンド
```bash
cd /Users/tsukasa/Arealinks/map1/sumai_map_agent1/frontend
echo "VITE_GOOGLE_MAPS_JS_KEY=フロント側のAPIキーをここに貼り付け" > .env
```

### ステップ3: サーバーを起動

#### ターミナル1: バックエンド
```bash
cd /Users/tsukasa/Arealinks/map1/sumai_map_agent1/server
source .venv/bin/activate
export GOOGLE_GEOCODING_KEY="あなたのキー"
uvicorn main:app --reload
```

サーバーが `http://localhost:8000` で起動します。

#### ターミナル2: フロントエンド
```bash
cd /Users/tsukasa/Arealinks/map1/sumai_map_agent1/frontend
npm run dev
```

フロントエンドが `http://localhost:5173` で起動します。

### ステップ4: 使ってみる

1. ブラウザで `http://localhost:5173/create` を開く

2. 以下のような住所が既に入力されています：
   ```
   東京都千代田区大手町1-1-1
   東京都中央区晴海5-1-1
   東京都新宿区西新宿2-8-1
   ```

3. 「マップを作成」ボタンをクリック

4. 共有URLが表示されるのでクリック

5. Google Maps上に3つのピンが表示されます

6. ピンをクリックすると吹き出しが開き、以下のリンクが表示されます：
   - 📍 地図で見る
   - 🚗 経路を表示
   - 👁️ ストリートビュー

## よくある質問

### Q1: APIキーがない状態で試せますか？
A: いいえ、Google Maps APIキーが必須です。ただし、Googleは毎月$200分の無料クレジットを提供しているため、個人利用なら実質無料で使えます。

### Q2: サーバーが起動しない
A: 以下を確認してください：
- Python仮想環境が有効化されているか（`source .venv/bin/activate`）
- `GOOGLE_GEOCODING_KEY` が設定されているか（`echo $GOOGLE_GEOCODING_KEY` で確認）
- ポート8000が他のプロセスで使われていないか

### Q3: フロントエンドでマップが表示されない
A: 以下を確認してください：
- `frontend/.env` ファイルが存在し、`VITE_GOOGLE_MAPS_JS_KEY` が設定されているか
- ブラウザの開発者ツール（F12）でエラーが出ていないか
- バックエンドサーバーが起動しているか（`http://localhost:8000` にアクセスして確認）

### Q4: ジオコーディングエラーが出る
A: 以下を確認してください：
- サーバー側APIキーが正しく設定されているか
- Google Cloud ConsoleでGeocoding APIが有効になっているか
- APIキーの制限設定が正しいか（IPアドレス `127.0.0.1` が許可されているか）

### Q5: キャッシュは動いていますか？
A: はい。同じ住所を2回目以降に送信すると、SQLiteのキャッシュから取得するため、Google APIは呼ばれません。`server/maps.db` ファイルにキャッシュが保存されています。

## 次のステップ

- 独自の住所リストを作成してテスト
- 本番環境へのデプロイ（Vercel、Heroku、AWS等）
- 機能拡張（README.mdの「今後の拡張案」を参照）

## トラブルシューティング

問題が発生した場合は、以下をチェックしてください：

1. バックエンドのログ（ターミナル1）
2. フロントエンドのログ（ターミナル2）
3. ブラウザの開発者ツール（F12 → Console）

詳細なドキュメントは `README.md` を参照してください。
