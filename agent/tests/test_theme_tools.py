"""Tests for theme generation prompts."""

import pytest
from alcheme.prompts.theme_generator import (
    build_theme_generation_prompt,
    build_theme_image_prompt,
)


class TestBuildThemeGenerationPrompt:
    """Tests for build_theme_generation_prompt()."""

    def test_empty_context(self):
        prompt = build_theme_generation_prompt({})
        assert "情報なし" in prompt
        assert "メイクテーマの提案スペシャリスト" in prompt

    def test_includes_inventory_summary(self):
        context = {
            "inventory_summary": {
                "total": 10,
                "categories": {"アイメイク": 5, "リップ": 3},
                "items": ["CANMAKE アイシャドウ 残量80%"],
            }
        }
        prompt = build_theme_generation_prompt(context)
        assert "手持ちコスメ: 10個" in prompt
        assert "アイメイク: 5個" in prompt
        assert "CANMAKE アイシャドウ 残量80%" in prompt

    def test_includes_profile(self):
        context = {
            "profile": {
                "personal_color": "イエベ春",
                "skin_type": "混合肌",
                "beauty_goals": "ナチュラルメイク",
            }
        }
        prompt = build_theme_generation_prompt(context)
        assert "イエベ春" in prompt
        assert "混合肌" in prompt
        assert "ナチュラルメイク" in prompt

    def test_includes_season_and_weather(self):
        context = {"season": "春", "weather": "晴れ 15℃"}
        prompt = build_theme_generation_prompt(context)
        assert "季節: 春" in prompt
        assert "天気: 晴れ 15℃" in prompt

    def test_includes_recent_recipes(self):
        context = {"recent_recipes": ["透明感メイク", "クールメイク"]}
        prompt = build_theme_generation_prompt(context)
        assert "透明感メイク" in prompt
        assert "クールメイク" in prompt

    def test_includes_underused_items(self):
        context = {"underused_items": ["MAC リップ ピンク"]}
        prompt = build_theme_generation_prompt(context)
        assert "30日以上使っていないアイテム" in prompt
        assert "MAC リップ ピンク" in prompt

    def test_includes_niawase_rules(self):
        """Verify the prompt includes rules about using non-matching colors."""
        prompt = build_theme_generation_prompt({})
        assert "似合わない" in prompt
        assert "ニュアンスチェンジャー" in prompt


class TestBuildThemeImagePrompt:
    """Tests for build_theme_image_prompt()."""

    def test_cute_theme(self):
        theme = {
            "title": "透明感ナチュラルメイク",
            "description": "春の陽射しに映える透明感メイク",
            "style_keywords": ["ナチュラル", "透明感", "ツヤ肌"],
            "character_theme": "cute",
        }
        prompt = build_theme_image_prompt(theme)
        assert "cute anime-inspired" in prompt
        assert "透明感ナチュラルメイク" in prompt
        assert "ナチュラル, 透明感, ツヤ肌" in prompt
        assert "Square aspect ratio" in prompt

    def test_cool_theme(self):
        theme = {
            "title": "クールビューティー",
            "description": "洗練されたクールメイク",
            "style_keywords": ["クール"],
            "character_theme": "cool",
        }
        prompt = build_theme_image_prompt(theme)
        assert "stylish young woman with sharp features" in prompt
        assert "cool-toned" in prompt

    def test_elegant_theme(self):
        theme = {
            "title": "エレガントメイク",
            "description": "上品で華やかなメイク",
            "style_keywords": ["エレガント"],
            "character_theme": "elegant",
        }
        prompt = build_theme_image_prompt(theme)
        assert "elegant young woman" in prompt
        assert "golden hour" in prompt

    def test_unknown_theme_falls_back_to_cute(self):
        theme = {
            "title": "テスト",
            "description": "テスト",
            "style_keywords": [],
            "character_theme": "unknown",
        }
        prompt = build_theme_image_prompt(theme)
        # Should fall back to cute theme
        assert "cute anime-inspired" in prompt

    def test_empty_keywords(self):
        theme = {
            "title": "テスト",
            "description": "テスト",
            "style_keywords": [],
            "character_theme": "cute",
        }
        prompt = build_theme_image_prompt(theme)
        assert "natural beauty" in prompt  # fallback keyword
