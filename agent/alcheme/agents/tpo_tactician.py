from google.adk.agents import LlmAgent

from ..prompts.tpo_tactician import TPO_TACTICIAN_SYSTEM_PROMPT
from ..tools.weather_tools import get_weather
from ..tools.calendar_tools import get_today_schedule
from ..tools.inventory_tools import get_inventory_summary


def create_tpo_tactician_agent() -> LlmAgent:
    """Create the TPO Tactician agent.

    Combines weather, schedule, and inventory data to provide
    context-aware makeup strategy recommendations.
    """
    return LlmAgent(
        name="tpo_tactician_agent",
        model="gemini-2.5-flash",
        instruction=TPO_TACTICIAN_SYSTEM_PROMPT,
        description=(
            "天気API・予定情報からTPO（Time/Place/Occasion）に最適な"
            "メイク方針を提案する気象予報士＋スタイリスト。"
        ),
        tools=[get_weather, get_today_schedule, get_inventory_summary],
        output_key="session:last_tpo_advice",
    )
