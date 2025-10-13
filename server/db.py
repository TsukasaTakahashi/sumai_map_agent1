"""
データベース初期化とアクセス層
"""
import sqlite3
import time
from typing import Optional, List, Dict, Any

DB_PATH = "maps.db"


def get_connection():
    """SQLite接続を取得"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """テーブル初期化"""
    conn = get_connection()
    cursor = conn.cursor()

    # maps テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS maps (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER,
            owner TEXT,
            view_count INTEGER DEFAULT 0
        )
    """)

    # pins テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            map_id TEXT NOT NULL,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            note_json TEXT,
            FOREIGN KEY (map_id) REFERENCES maps(id)
        )
    """)

    # geocode_cache テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS geocode_cache (
            address_norm TEXT PRIMARY KEY,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            updated_at INTEGER NOT NULL
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully")


def normalize_address(address: str) -> str:
    """
    住所を正規化（全角/半角の統一、ハイフン統一など）
    """
    # 全角スペース→半角
    normalized = address.replace("\u3000", " ")
    # 全角数字→半角
    normalized = normalized.translate(str.maketrans("0123456789", "0123456789"))
    # ダッシュ類の統一
    normalized = normalized.replace("−", "-").replace("–", "-").replace("—", "-")
    # 前後の空白削除
    normalized = normalized.strip()
    return normalized


def get_geocode_from_cache(address: str) -> Optional[Dict[str, float]]:
    """キャッシュから geocode を取得"""
    normalized = normalize_address(address)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT lat, lng FROM geocode_cache WHERE address_norm = ?",
        (normalized,)
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return {"lat": row["lat"], "lng": row["lng"]}
    return None


def save_geocode_to_cache(address: str, lat: float, lng: float):
    """geocode をキャッシュに保存"""
    normalized = normalize_address(address)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO geocode_cache (address_norm, lat, lng, updated_at)
        VALUES (?, ?, ?, ?)
        """,
        (normalized, lat, lng, int(time.time()))
    )
    conn.commit()
    conn.close()


def create_map(map_id: str, title: str, pins: List[Dict[str, Any]]):
    """マップとピンをDBに保存"""
    conn = get_connection()
    cursor = conn.cursor()

    # maps テーブルに挿入
    cursor.execute(
        """
        INSERT INTO maps (id, title, created_at, expires_at, owner, view_count)
        VALUES (?, ?, ?, NULL, NULL, 0)
        """,
        (map_id, title, int(time.time()))
    )

    # pins テーブルに挿入
    for pin in pins:
        cursor.execute(
            """
            INSERT INTO pins (map_id, name, address, lat, lng, note_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (map_id, pin["name"], pin["address"], pin["lat"], pin["lng"], pin.get("note", ""))
        )

    conn.commit()
    conn.close()


def get_map(map_id: str) -> Optional[Dict[str, Any]]:
    """マップとピンを取得"""
    conn = get_connection()
    cursor = conn.cursor()

    # maps テーブルから取得
    cursor.execute("SELECT * FROM maps WHERE id = ?", (map_id,))
    map_row = cursor.fetchone()

    if not map_row:
        conn.close()
        return None

    # pins テーブルから取得
    cursor.execute(
        "SELECT name, address, lat, lng, note_json FROM pins WHERE map_id = ?",
        (map_id,)
    )
    pin_rows = cursor.fetchall()

    # view_count をインクリメント
    cursor.execute(
        "UPDATE maps SET view_count = view_count + 1 WHERE id = ?",
        (map_id,)
    )
    conn.commit()
    conn.close()

    pins = [
        {
            "name": row["name"],
            "address": row["address"],
            "lat": row["lat"],
            "lng": row["lng"],
            "note": row["note_json"] or ""
        }
        for row in pin_rows
    ]

    return {
        "map_id": map_row["id"],
        "title": map_row["title"],
        "pins": pins
    }
