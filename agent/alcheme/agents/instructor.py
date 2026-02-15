from google.adk.agents import LlmAgent

from ..prompts.instructor import INSTRUCTOR_SYSTEM_PROMPT
from ..tools.instructor_tools import get_substitution_technique
from ..tools.inventory_tools import get_inventory, search_inventory


def create_instructor_agent() -> LlmAgent:
    """Create the Makeup Instructor agent.

    Provides detailed step-by-step makeup instructions with substitution
    technique guidance when alternative items are used.
    """
    return LlmAgent(
        name="instructor_agent",
        model="gemini-2.5-flash",
        instruction=INSTRUCTOR_SYSTEM_PROMPT,
        description=(
            "代用テクニックの詳細手順を提供するメイクアップ・アーティスト。"
            "アイテムの差分を埋める具体的な塗り方・重ね方を指導。"
        ),
        tools=[get_substitution_technique, get_inventory, search_inventory],
        output_key="session:last_instruction",
    )
