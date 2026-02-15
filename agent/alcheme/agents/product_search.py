from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from ..prompts.product_search import PRODUCT_SEARCH_SYSTEM_PROMPT


def create_product_search_agent() -> LlmAgent:
    """Create the Product Search agent.

    This agent uses google_search as its only tool (ADK constraint:
    google_search cannot be combined with custom tools on the same agent).
    """
    return LlmAgent(
        name="product_search_agent",
        model="gemini-2.5-flash",
        instruction=PRODUCT_SEARCH_SYSTEM_PROMPT,
        description=(
            "画像認識で特定できなかったコスメの商品名・ブランド名・色番号を"
            "Web検索で補完するリサーチャー。"
        ),
        tools=[google_search],
        output_key="session:last_search_result",
    )
