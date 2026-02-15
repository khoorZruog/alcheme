"""Simulator prompt builder for AI character preview images.

Constructs English prompts for Gemini image generation based on
makeup recipe steps and a selected character theme.
"""

# ---------------------------------------------------------------------------
# Character themes — each defines a distinct illustration style
# ---------------------------------------------------------------------------
CHARACTER_THEMES: dict[str, dict[str, str]] = {
    "cute": {
        "label": "キュート",
        "face_style": "a cute anime-inspired young woman with large expressive eyes, soft round face, and a sweet smile",
        "expression": "cheerful and approachable",
        "lighting": "warm soft natural light with gentle pink highlights",
        "background": "pastel pink and cream bokeh with subtle sparkles",
    },
    "cool": {
        "label": "クール",
        "face_style": "a stylish young woman with sharp features, confident gaze, and defined jawline",
        "expression": "composed and effortlessly chic",
        "lighting": "cool-toned studio lighting with subtle blue highlights",
        "background": "minimalist gray gradient with geometric shadows",
    },
    "elegant": {
        "label": "エレガント",
        "face_style": "an elegant young woman with graceful features, gentle eyes, and refined beauty",
        "expression": "serene and sophisticated",
        "lighting": "golden hour warm lighting with soft diffusion",
        "background": "champagne gold and ivory bokeh with soft floral motifs",
    },
}

DEFAULT_THEME = "cute"

# ---------------------------------------------------------------------------
# Makeup area mapping — Japanese step categories to English face regions
# ---------------------------------------------------------------------------
_AREA_MAP: dict[str, str] = {
    "ベース": "base_skin",
    "下地": "base_skin",
    "ファンデ": "base_skin",
    "パウダー": "base_skin",
    "アイシャドウ": "eyes",
    "アイライナー": "eyes",
    "マスカラ": "eyes",
    "アイブロウ": "eyebrows",
    "眉": "eyebrows",
    "チーク": "cheeks",
    "ハイライト": "cheeks",
    "シェーディング": "cheeks",
    "リップ": "lips",
    "グロス": "lips",
    "ティント": "lips",
}

# Default appearance for regions not covered by recipe steps
_REGION_DEFAULTS: dict[str, str] = {
    "base_skin": "natural-looking clear skin with a healthy glow",
    "eyes": "natural bare eyes with subtle definition",
    "eyebrows": "naturally shaped groomed eyebrows",
    "cheeks": "natural flush on cheeks",
    "lips": "naturally tinted lips",
}


def _classify_area(step: dict) -> str:
    """Map a recipe step to a face region based on area/category/instruction."""
    # Check 'area' first (Alchemist output format), then 'category'
    area = (step.get("area") or step.get("category") or "").strip()
    instruction = (step.get("instruction") or step.get("description") or step.get("action") or "").strip()
    item_name = (step.get("item_name") or step.get("product_name") or "").strip()
    combined = f"{area} {instruction} {item_name}"

    for keyword, region in _AREA_MAP.items():
        if keyword in combined:
            return region
    return "base_skin"  # fallback


def _describe_step_makeup(step: dict) -> str:
    """Build an English description of a single makeup step for the image prompt."""
    parts = []

    # Product and color info — support both Alchemist format and extended format
    product = step.get("item_name") or step.get("product_name") or ""
    brand = step.get("brand") or ""
    color = step.get("color_description") or step.get("color") or ""
    texture = step.get("texture") or ""
    technique = step.get("technique") or ""
    instruction = step.get("instruction") or step.get("action") or step.get("description") or ""
    substitution = step.get("substitution_note") or ""

    if color:
        parts.append(color)
    if texture:
        parts.append(f"{texture} finish")
    if technique and technique != "standard":
        parts.append(f"({technique})")
    if instruction:
        # Keep the Japanese instruction for Gemini's world knowledge
        parts.append(f"({instruction})")
    if substitution:
        parts.append(f"[note: {substitution}]")
    if brand and product:
        parts.append(f"[inspired by {brand} {product}]")
    elif product:
        parts.append(f"[inspired by {product}]")

    return " ".join(parts) if parts else ""


def build_image_prompt(
    steps: list[dict],
    theme: str = DEFAULT_THEME,
) -> str:
    """Build a Gemini image generation prompt from recipe steps and theme.

    Args:
        steps: List of recipe step dicts from the Alchemist agent.
        theme: One of 'cute', 'cool', 'elegant'.

    Returns:
        English prompt string (~200 words) for Gemini image generation.
    """
    theme_config = CHARACTER_THEMES.get(theme, CHARACTER_THEMES[DEFAULT_THEME])

    # Group steps by face region
    region_descriptions: dict[str, list[str]] = {}
    for step in steps:
        region = _classify_area(step)
        desc = _describe_step_makeup(step)
        if desc:
            region_descriptions.setdefault(region, []).append(desc)

    # Build per-region makeup description
    makeup_parts = []
    for region, default in _REGION_DEFAULTS.items():
        if region in region_descriptions:
            descriptions = ", ".join(region_descriptions[region])
            makeup_parts.append(f"- {region.replace('_', ' ')}: {descriptions}")
        else:
            makeup_parts.append(f"- {region.replace('_', ' ')}: {default}")

    makeup_description = "\n".join(makeup_parts)

    prompt = f"""Generate a single portrait illustration of {theme_config['face_style']}.

Expression: {theme_config['expression']}.
Lighting: {theme_config['lighting']}.
Background: {theme_config['background']}.

The character is wearing the following makeup:
{makeup_description}

Style requirements:
- Digital illustration, NOT a photograph of a real person
- High quality, detailed facial features with visible makeup
- Square aspect ratio (1:1)
- Face and upper shoulders visible, slightly angled 3/4 view
- No text, watermarks, logos, or UI elements in the image
- No multiple faces or figures
- Clean, professional beauty illustration style"""

    return prompt
