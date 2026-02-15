from google.adk.agents import LlmAgent

from ..prompts.inventory import INVENTORY_SYSTEM_PROMPT
from ..tools.inventory_tools import add_items_to_inventory, generate_item_id
from ..tools.rakuten_api import search_rakuten_api


def create_inventory_agent() -> LlmAgent:
    """Create the Inventory Manager agent."""
    return LlmAgent(
        name="inventory_agent",
        model="gemini-2.5-flash",
        instruction=INVENTORY_SYSTEM_PROMPT,
        description=(
            "コスメの画像を解析し、ブランド・商品名・色・質感・残量を特定する鑑定士。"
            "新しいコスメを発見するワクワクを演出する。"
        ),
        tools=[
            add_items_to_inventory,
            generate_item_id,
            search_rakuten_api,
        ],
        output_key="session:last_scan_result",
    )
