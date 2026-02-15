from google.adk.agents import LlmAgent

from ..prompts.concierge import CONCIERGE_SYSTEM_PROMPT
from ..tools.inventory_tools import (
    get_inventory_summary,
    search_inventory,
    filter_inventory_by_category,
)
from ..tools.context_tools import get_today_context
from ..tools.shopping_tools import (
    analyze_product_compatibility,
    compare_products_against_inventory,
)
from ..tools.rakuten_api import search_rakuten_api


def create_concierge_agent(sub_agents: list) -> LlmAgent:
    """Create the Concierge (root) agent."""
    return LlmAgent(
        name="concierge",
        model="gemini-2.5-flash",
        instruction=CONCIERGE_SYSTEM_PROMPT,
        description=(
            "ユーザーとの唯一の対話窓口。意図判定とサブエージェントへのルーティングを担当する"
            "コンシェルジュ。"
        ),
        tools=[
            get_inventory_summary,
            search_inventory,
            filter_inventory_by_category,
            get_today_context,
            search_rakuten_api,
            analyze_product_compatibility,
            compare_products_against_inventory,
        ],
        sub_agents=sub_agents,
    )
