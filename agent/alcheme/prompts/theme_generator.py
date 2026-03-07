"""Theme suggestion prompt builder.

Constructs prompts for Gemini to generate makeup theme suggestions
and theme preview image prompts.
"""

from .simulator import CHARACTER_THEMES, DEFAULT_THEME, build_hair_description

# ---------------------------------------------------------------------------
# Theme generation prompt
# ---------------------------------------------------------------------------
THEME_GENERATION_PROMPT = """あなたはメイクテーマの提案スペシャリストです。
ユーザーの手持ちコスメ、天気、季節、好みを考慮して、
魅力的なメイクテーマを3つ提案してください。

## ユーザー情報
{user_context}

## 出力フォーマット（JSON のみ出力してください）
```json
[
  {{
    "title": "テーマ名（8-15文字）",
    "description": "テーマの説明（30-50文字）",
    "style_keywords": ["キーワード1", "キーワード2", "キーワード3"],
    "character_theme": "cute or cool or elegant"
  }},
  {{
    "title": "テーマ名（8-15文字）",
    "description": "テーマの説明（30-50文字）",
    "style_keywords": ["キーワード1", "キーワード2", "キーワード3"],
    "character_theme": "cute or cool or elegant"
  }},
  {{
    "title": "テーマ名（8-15文字）",
    "description": "テーマの説明（30-50文字）",
    "style_keywords": ["キーワード1", "キーワード2", "キーワード3"],
    "character_theme": "cute or cool or elegant"
  }}
]
```

## ルール
- 3つのテーマはそれぞれ異なる character_theme（cute, cool, elegant）を1つずつ割り当てる
- ユーザーの手持ちコスメで実現可能なテーマにする
- 季節感・天気を考慮する
- **パーソナルカラーに「似合わない」色も積極的に活用する**:
  - 塗り方・重ね方を変えることで似合わせるテクニックを提案
  - 他のコスメと組み合わせて色味を調整する方法を含める
  - ニュアンスチェンジャー（例: KATE リップモンスター カラーチューナー等）の活用も提案
  - 使われていないカラーコスメこそテーマに積極的に組み込む
- 直近のレシピと重複しないバリエーションを提供
- JSON 配列のみ出力し、他のテキストは含めないこと
"""


def build_theme_generation_prompt(user_context: dict) -> str:
    """Build the theme generation prompt with user context.

    Args:
        user_context: Dict containing inventory_summary, weather, profile,
                      season, recent_recipes, etc.

    Returns:
        Complete prompt string for Gemini text generation.
    """
    context_parts: list[str] = []

    # Inventory summary
    inv = user_context.get("inventory_summary")
    if inv:
        total = inv.get("total", 0)
        categories = inv.get("categories", {})
        items = inv.get("items", [])
        context_parts.append(f"手持ちコスメ: {total}個")
        if categories:
            cat_str = ", ".join(f"{k}: {v}個" for k, v in categories.items())
            context_parts.append(f"カテゴリ: {cat_str}")
        if items:
            context_parts.append("主なアイテム:")
            for item_str in items[:15]:  # Cap at 15 items
                context_parts.append(f"  - {item_str}")

    # Underused items
    underused = user_context.get("underused_items")
    if underused:
        context_parts.append("30日以上使っていないアイテム:")
        for item_str in underused[:5]:
            context_parts.append(f"  - {item_str}")

    # Weather / season
    weather = user_context.get("weather")
    if weather:
        context_parts.append(f"天気: {weather}")
    season = user_context.get("season")
    if season:
        context_parts.append(f"季節: {season}")

    # Profile
    profile = user_context.get("profile", {})
    if profile.get("personal_color"):
        context_parts.append(f"パーソナルカラー: {profile['personal_color']}")
    if profile.get("skin_type"):
        context_parts.append(f"肌質: {profile['skin_type']}")
    if profile.get("beauty_goals"):
        context_parts.append(f"美容目標: {profile['beauty_goals']}")

    # Recent recipes (to avoid repetition)
    recent = user_context.get("recent_recipes")
    if recent:
        context_parts.append("直近のレシピ（重複を避ける）:")
        for r in recent[:5]:
            context_parts.append(f"  - {r}")

    context_str = "\n".join(context_parts) if context_parts else "情報なし"
    return THEME_GENERATION_PROMPT.format(user_context=context_str)


# ---------------------------------------------------------------------------
# Theme image prompt builder
# ---------------------------------------------------------------------------
def build_theme_image_prompt(
    theme: dict,
    hair_style: str | None = None,
    hair_color: str | None = None,
) -> str:
    """Build an image generation prompt for a theme preview.

    Unlike build_image_prompt() in simulator.py (which uses recipe steps),
    this generates a mood/atmosphere image representing the theme concept.

    Args:
        theme: Dict with title, description, style_keywords, character_theme.
        hair_style: User's selected hair style value (e.g. 'long', 'bob').
        hair_color: User's selected hair color value (e.g. 'dark-brown').

    Returns:
        English prompt string for Gemini image generation.
    """
    char_theme = theme.get("character_theme", DEFAULT_THEME)
    theme_config = CHARACTER_THEMES.get(char_theme, CHARACTER_THEMES[DEFAULT_THEME])

    title = theme.get("title", "")
    description = theme.get("description", "")
    keywords = theme.get("style_keywords", [])
    keywords_str = ", ".join(keywords) if keywords else "natural beauty"

    hair_desc = build_hair_description(hair_style, hair_color)
    prompt = f"""Generate a single portrait illustration of {theme_config['face_style']}{hair_desc}.

Expression: {theme_config['expression']}.
Lighting: {theme_config['lighting']}.
Background: {theme_config['background']}.

This illustration represents the makeup theme: "{title}" — {description}.
The overall mood and style should evoke: {keywords_str}.

The character should appear to be wearing a cohesive, complete makeup look
that matches this theme concept. The makeup should be visible and detailed,
showing the theme's aesthetic through color choices and styling.

Style requirements:
- Digital illustration, NOT a photograph of a real person
- High quality, detailed facial features with visible makeup
- Square aspect ratio (1:1)
- Face and upper shoulders visible, slightly angled 3/4 view
- No text, watermarks, logos, or UI elements in the image
- No multiple faces or figures
- Clean, professional beauty illustration style
- The overall color palette and mood should match the theme concept"""

    return prompt
