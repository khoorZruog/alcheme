from pydantic import BaseModel, Field
from typing import Literal


class CosmeStats(BaseModel):
    pigment: int = Field(ge=1, le=5, description="Pigmentation intensity 1-5")
    longevity: int = Field(ge=1, le=5, description="Lasting power 1-5")
    shelf_life: int = Field(ge=1, le=5, description="Product shelf life 1-5 (PAO-based)")
    natural_finish: int = Field(ge=1, le=5, description="Natural finish level 1-5")


class InventoryItem(BaseModel):
    id: str
    category: Literal["ベースメイク", "アイメイク", "リップ", "スキンケア", "その他"]
    item_type: str = "その他"  # specific Appendix D type (e.g. "マスカラ")
    brand: str
    product_name: str
    color_code: str | None = None
    color_name: str | None = None
    color_description: str
    texture: Literal["マット", "ツヤ", "サテン", "シマー", "クリーム", "パウダー", "リキッド"]
    estimated_remaining: str
    pao_months: int | None = None  # auto-derived from item_type
    confidence: Literal["high", "medium", "low"]
    source: str = "画像認識"
    stats: CosmeStats | None = None
    rarity: Literal["SSR", "SR", "R", "N"] | None = None
    appraisal_comment: str | None = None
    image_url: str | None = None
    images: list[str] | None = None  # multiple image URLs
    created_at: str | None = None
    updated_at: str | None = None


class ScanOutput(BaseModel):
    items: list[InventoryItem]
    summary: str
    needs_search: bool = False
