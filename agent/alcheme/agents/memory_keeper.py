from google.adk.agents import LlmAgent

from ..prompts.memory_keeper import MEMORY_KEEPER_SYSTEM_PROMPT
from ..tools.beauty_log_tools import save_beauty_log, get_beauty_logs
from ..tools.context_tools import get_today_context


def create_memory_keeper_agent() -> LlmAgent:
    """Create the Memory Keeper agent for Beauty Log management."""
    return LlmAgent(
        name="memory_keeper_agent",
        model="gemini-2.5-flash",
        instruction=MEMORY_KEEPER_SYSTEM_PROMPT,
        description=(
            "Beauty Logの記録・振り返りを担当。"
            "日々のメイク記録の保存と過去ログの検索。"
        ),
        tools=[save_beauty_log, get_beauty_logs, get_today_context],
    )
