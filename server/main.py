"""
FastAPI メインアプリケーション
"""
import os
import secrets
import string
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import jageocoder

from db import (
    init_db,
    normalize_address,
    get_geocode_from_cache,
    save_geocode_to_cache,
    create_map,
    get_map
)
from models import CreateMapRequest, CreateMapResponse, GetMapResponse

# 環境変数から設定を取得
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", FRONTEND_URL).split(",")

app = FastAPI(title="住まいマップ共有API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """起動時にDB初期化とjageocoder初期化"""
    init_db()

    # jageocoderをリモートAPI経由で初期化
    try:
        jageocoder.init(url='https://jageocoder.info-proto.com/jsonrpc')
        print("jageocoder initialized (remote API)")
    except Exception as e:
        print(f"警告: jageocoder初期化に失敗しました: {e}")


def generate_map_id(length: int = 6) -> str:
    """URLセーフな短縮IDを生成"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


async def geocode_address(address: str) -> Dict[str, float]:
    """
    jageocoderで住所を緯度経度に変換
    キャッシュを優先利用
    """
    # キャッシュチェック
    cached = get_geocode_from_cache(address)
    if cached:
        print(f"キャッシュヒット: {address}")
        return cached

    # jageocoderで検索
    try:
        result = jageocoder.search(address)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ジオコーディングエラー: {str(e)}"
        )

    if not result or not result.get("candidates"):
        raise HTTPException(
            status_code=422,
            detail=f"住所のジオコーディングに失敗しました: {address}"
        )

    # 最も確度の高い候補を使用
    candidate = result["candidates"][0]
    lat = candidate["y"]
    lng = candidate["x"]

    # キャッシュに保存
    save_geocode_to_cache(address, lat, lng)
    print(f"ジオコーディング成功: {address} -> ({lat}, {lng})")

    return {"lat": lat, "lng": lng}


@app.post("/api/maps", response_model=CreateMapResponse)
async def create_map_endpoint(request: CreateMapRequest):
    """
    マップ作成エンドポイント
    1. 住所を正規化
    2. ジオコーディング（キャッシュ優先）
    3. DB保存
    4. 短縮URLを返す
    """
    pins_with_coords = []

    # 各ピンをジオコーディング
    for pin in request.pins:
        normalized_address = normalize_address(pin.address)
        try:
            coords = await geocode_address(normalized_address)
            pins_with_coords.append({
                "name": pin.name,
                "address": normalized_address,
                "lat": coords["lat"],
                "lng": coords["lng"],
                "note": pin.note or ""
            })
        except HTTPException as e:
            raise HTTPException(
                status_code=422,
                detail=f"住所 '{pin.address}' のジオコーディングに失敗しました"
            )

    # マップIDを生成（衝突チェックは簡易版）
    map_id = generate_map_id()

    # DBに保存
    create_map(map_id, request.title, pins_with_coords)

    # 共有URL生成
    share_url = f"{FRONTEND_URL}/m/{map_id}"

    return CreateMapResponse(map_id=map_id, share_url=share_url)


@app.get("/api/maps/{map_id}", response_model=GetMapResponse)
async def get_map_endpoint(map_id: str):
    """
    マップ取得エンドポイント
    """
    map_data = get_map(map_id)
    if not map_data:
        raise HTTPException(status_code=404, detail="マップが見つかりません")

    return GetMapResponse(**map_data)


@app.get("/")
async def root():
    """ヘルスチェック"""
    return {"status": "ok", "message": "住まいマップ共有API"}


# 拡張用メモ:
# - expires_at の実装: 有効期限切れマップの自動削除バッチ
# - OGP生成: Google Static Maps APIで静的画像生成
# - ID衝突回避: リトライロジック追加
# - バリデーション強化: 住所形式チェック、ピン数上限
# - 住所正規化の高度化: 丁目/番地の表記揺れ吸収
