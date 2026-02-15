from google.adk.agents import LlmAgent

from ..prompts.alchemist import ALCHEMIST_SYSTEM_PROMPT
from ..tools.inventory_tools import (
    get_inventory,
    search_inventory,
    filter_inventory_by_category,
    validate_recipe_items,
)
from ..tools.recipe_tools import save_recipe
from ..tools.suggestion_tools import save_suggestion


def create_alchemist_agent() -> LlmAgent:
    """Create the Cosmetic Alchemist agent."""
    return LlmAgent(
        name="alchemist_agent",
        model="gemini-2.5-flash",
        instruction=ALCHEMIST_SYSTEM_PROMPT,
        description=(
            "ユーザーの手持ちコスメのみを使って、最適なメイクレシピを考案する錬金術師。"
            "在庫にないアイテムは絶対に使わない。"
        ),
        tools=[
            get_inventory,
            search_inventory,
            filter_inventory_by_category,
            validate_recipe_items,
            save_recipe,
            save_suggestion,
        ],
        output_key="session:last_recipe",
    )
