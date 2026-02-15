"""Tests for simulator prompt builder — pure function tests, no mocking needed."""

import pytest

from alcheme.prompts.simulator import (
    _classify_area,
    _describe_step_makeup,
    build_image_prompt,
    CHARACTER_THEMES,
    DEFAULT_THEME,
    _REGION_DEFAULTS,
)


# ---------------------------------------------------------------------------
# _classify_area
# ---------------------------------------------------------------------------
class TestClassifyArea:
    def test_lip_category(self):
        assert _classify_area({"category": "リップ"}) == "lips"

    def test_gloss_category(self):
        assert _classify_area({"category": "グロス"}) == "lips"

    def test_eyeshadow_category(self):
        assert _classify_area({"category": "アイシャドウ"}) == "eyes"

    def test_mascara_category(self):
        assert _classify_area({"category": "マスカラ"}) == "eyes"

    def test_foundation_category(self):
        assert _classify_area({"category": "ファンデ"}) == "base_skin"

    def test_base_category(self):
        assert _classify_area({"category": "ベース"}) == "base_skin"

    def test_eyebrow_category(self):
        assert _classify_area({"category": "アイブロウ"}) == "eyebrows"

    def test_eyebrow_kanji(self):
        assert _classify_area({"category": "眉"}) == "eyebrows"

    def test_cheek_category(self):
        assert _classify_area({"category": "チーク"}) == "cheeks"

    def test_highlight_category(self):
        assert _classify_area({"category": "ハイライト"}) == "cheeks"

    def test_unknown_falls_back_to_base(self):
        assert _classify_area({"category": "ネイル"}) == "base_skin"

    def test_description_fallback(self):
        """When category is empty, falls back to description matching."""
        assert _classify_area({"category": "", "description": "リップを塗る"}) == "lips"

    def test_empty_step(self):
        assert _classify_area({}) == "base_skin"


# ---------------------------------------------------------------------------
# _describe_step_makeup
# ---------------------------------------------------------------------------
class TestDescribeStepMakeup:
    def test_full_step(self):
        step = {
            "color_description": "coral pink",
            "texture": "matte",
            "brand": "KATE",
            "product_name": "リップモンスター",
            "action": "唇に塗る",
        }
        desc = _describe_step_makeup(step)
        assert "coral pink" in desc
        assert "matte finish" in desc
        assert "KATE" in desc
        assert "リップモンスター" in desc
        assert "(唇に塗る)" in desc

    def test_minimal_step(self):
        """Only action field present."""
        step = {"action": "ベースを塗る"}
        desc = _describe_step_makeup(step)
        assert "(ベースを塗る)" in desc

    def test_empty_step(self):
        assert _describe_step_makeup({}) == ""

    def test_color_only(self):
        step = {"color": "ピンクベージュ"}
        desc = _describe_step_makeup(step)
        assert "ピンクベージュ" in desc

    def test_brand_without_product(self):
        """Brand without product_name is not included."""
        step = {"brand": "KATE"}
        desc = _describe_step_makeup(step)
        assert "KATE" not in desc  # brand alone is not rendered


# ---------------------------------------------------------------------------
# build_image_prompt
# ---------------------------------------------------------------------------
class TestBuildImagePrompt:
    def test_cute_theme(self):
        steps = [{"category": "リップ", "color_description": "red"}]
        prompt = build_image_prompt(steps, "cute")
        assert "cute anime-inspired" in prompt
        assert "pastel pink" in prompt

    def test_cool_theme(self):
        steps = [{"category": "リップ", "color_description": "red"}]
        prompt = build_image_prompt(steps, "cool")
        assert "sharp features" in prompt
        assert "cool-toned" in prompt

    def test_elegant_theme(self):
        steps = [{"category": "リップ", "color_description": "rose"}]
        prompt = build_image_prompt(steps, "elegant")
        assert "elegant" in prompt.lower()
        assert "golden hour" in prompt

    def test_invalid_theme_falls_back_to_default(self):
        steps = [{"category": "リップ", "color_description": "red"}]
        prompt = build_image_prompt(steps, "nonexistent")
        default_config = CHARACTER_THEMES[DEFAULT_THEME]
        assert default_config["face_style"] in prompt

    def test_missing_regions_get_defaults(self):
        """Steps only cover lips → other regions use defaults."""
        steps = [{"category": "リップ", "color_description": "red"}]
        prompt = build_image_prompt(steps, "cute")
        for region, default in _REGION_DEFAULTS.items():
            if region != "lips":
                assert default in prompt, f"Missing default for {region}"

    def test_steps_grouped_by_region(self):
        """Multiple steps for different regions appear in prompt."""
        steps = [
            {"category": "リップ", "color_description": "red"},
            {"category": "アイシャドウ", "color_description": "brown"},
        ]
        prompt = build_image_prompt(steps)
        assert "red" in prompt
        assert "brown" in prompt

    def test_contains_style_requirements(self):
        prompt = build_image_prompt([])
        assert "Digital illustration" in prompt
        assert "NOT a photograph" in prompt
        assert "Square aspect ratio" in prompt

    def test_empty_steps_all_defaults(self):
        """No steps → all regions use their defaults."""
        prompt = build_image_prompt([])
        for default in _REGION_DEFAULTS.values():
            assert default in prompt
