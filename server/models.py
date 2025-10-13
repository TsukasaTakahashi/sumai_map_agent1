"""
リクエスト・レスポンスモデル定義
"""
from typing import List, Optional
from pydantic import BaseModel


class PinInput(BaseModel):
    name: str
    address: str
    note: Optional[str] = ""


class CreateMapRequest(BaseModel):
    title: str
    pins: List[PinInput]


class CreateMapResponse(BaseModel):
    map_id: str
    share_url: str


class PinOutput(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    note: Optional[str] = ""


class GetMapResponse(BaseModel):
    map_id: str
    title: str
    pins: List[PinOutput]
