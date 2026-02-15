from google.adk.agents import LlmAgent

from ..prompts.profiler import PROFILER_SYSTEM_PROMPT
from ..tools.profiler_tools import analyze_preference_history
from ..tools.beauty_log_tools import get_beauty_logs
from ..tools.inventory_tools import get_inventory


def create_profiler_agent() -> LlmAgent:
    """Create the Profiler agent.

    Analyzes user's makeup preferences, detects monotony patterns,
    and suggests new possibilities based on Beauty Log history.
    """
    return LlmAgent(
        name="profiler_agent",
        model="gemini-2.5-flash",
        instruction=PROFILER_SYSTEM_PROMPT,
        description=(
            "ユーザーの好み傾向を分析し、マンネリ検知や新しい挑戦を提案する"
            "ビューティープロファイラー。履歴データから「自分も知らない自分」を発見。"
        ),
        tools=[analyze_preference_history, get_beauty_logs, get_inventory],
        output_key="session:last_profile_analysis",
    )
