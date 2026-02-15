"""Tests for Pydantic schemas — UT-P15~P18."""

import pytest
from pydantic import ValidationError

from alcheme.schemas.inventory import CosmeStats, InventoryItem, ScanOutput
from alcheme.schemas.recipe import RecipeStep, Recipe, RecipeOutput, RecipeValidation


# ---------------------------------------------------------------------------
# UT-P15: InventoryItem schema
# ---------------------------------------------------------------------------
class TestInventoryItem:
    def test_valid_item(self):
        """Valid InventoryItem passes validation."""
        item = InventoryItem(
            id="item_001",
            category="Lip",
            brand="KATE",
            product_name="リップモンスター",
            color_description="赤みブラウン",
            texture="matte",
            estimated_remaining="80%",
            confidence="high",
        )
        assert item.id == "item_001"
        assert item.category == "Lip"

    def test_invalid_category(self):
        """Invalid category raises ValidationError."""
        with pytest.raises(ValidationError):
            InventoryItem(
                id="item_002",
                category="InvalidCategory",
                brand="Test",
                product_name="Test",
                color_description="test",
                texture="matte",
                estimated_remaining="50%",
                confidence="high",
            )

    def test_invalid_texture(self):
        """Invalid texture raises ValidationError."""
        with pytest.raises(ValidationError):
            InventoryItem(
                id="item_003",
                category="Lip",
                brand="Test",
                product_name="Test",
                color_description="test",
                texture="invalid_texture",
                estimated_remaining="50%",
                confidence="high",
            )

    def test_invalid_confidence(self):
        """Invalid confidence raises ValidationError."""
        with pytest.raises(ValidationError):
            InventoryItem(
                id="item_004",
                category="Lip",
                brand="Test",
                product_name="Test",
                color_description="test",
                texture="matte",
                estimated_remaining="50%",
                confidence="invalid",
            )

    def test_optional_fields(self):
        """Optional fields default to None."""
        item = InventoryItem(
            id="item_005",
            category="Eye",
            brand="EXCEL",
            product_name="シャドウ",
            color_description="ゴールドブラウン",
            texture="shimmer",
            estimated_remaining="60%",
            confidence="medium",
        )
        assert item.stats is None
        assert item.rarity is None
        assert item.image_url is None


# ---------------------------------------------------------------------------
# UT-P16: CosmeStats schema
# ---------------------------------------------------------------------------
class TestCosmeStats:
    def test_valid_stats(self):
        """Valid stats within 1-5 range."""
        stats = CosmeStats(pigment=4, longevity=3, shelf_life=5, natural_finish=2)
        assert stats.pigment == 4

    def test_out_of_range(self):
        """Stats outside 1-5 range raise ValidationError."""
        with pytest.raises(ValidationError):
            CosmeStats(pigment=6, longevity=3, shelf_life=5, natural_finish=2)

        with pytest.raises(ValidationError):
            CosmeStats(pigment=0, longevity=3, shelf_life=5, natural_finish=2)


# ---------------------------------------------------------------------------
# UT-P17: Recipe schema
# ---------------------------------------------------------------------------
class TestRecipe:
    def test_valid_recipe(self):
        """Valid Recipe passes validation."""
        recipe = Recipe(
            title="韓国風メイク",
            match_score=85,
            thinking_process=["在庫確認", "色合わせ"],
            steps=[
                RecipeStep(
                    step=1,
                    area="Base",
                    item_id="item_004",
                    item_name="プライマー",
                    instruction="下地を塗る",
                )
            ],
        )
        assert recipe.title == "韓国風メイク"
        assert recipe.match_score == 85

    def test_match_score_out_of_range(self):
        """match_score outside 0-100 raises ValidationError."""
        with pytest.raises(ValidationError):
            Recipe(
                title="Test",
                match_score=101,
                thinking_process=["test"],
                steps=[
                    RecipeStep(
                        step=1, area="Lip", item_id="x", item_name="x", instruction="x"
                    )
                ],
            )

    def test_empty_steps(self):
        """Recipe with empty steps should be valid (no minimum enforced)."""
        recipe = Recipe(
            title="Empty",
            match_score=50,
            thinking_process=["test"],
            steps=[],
        )
        assert len(recipe.steps) == 0


# ---------------------------------------------------------------------------
# UT-P18: ScanOutput and RecipeOutput
# ---------------------------------------------------------------------------
class TestOutputSchemas:
    def test_scan_output(self):
        """ScanOutput with items and summary."""
        item = InventoryItem(
            id="item_001",
            category="Lip",
            brand="KATE",
            product_name="リップ",
            color_description="赤",
            texture="matte",
            estimated_remaining="80%",
            confidence="high",
        )
        output = ScanOutput(items=[item], summary="1 item found")
        assert len(output.items) == 1
        assert output.needs_search is False

    def test_recipe_output(self):
        """RecipeOutput with recipe and validation."""
        recipe = Recipe(
            title="Test",
            match_score=80,
            thinking_process=["step"],
            steps=[
                RecipeStep(
                    step=1, area="Lip", item_id="item_001",
                    item_name="Test", instruction="Apply"
                )
            ],
        )
        validation = RecipeValidation(
            all_items_in_inventory=True, missing_items=[]
        )
        output = RecipeOutput(
            recipe=recipe, used_items=["item_001"], validation=validation
        )
        assert output.validation.all_items_in_inventory is True
