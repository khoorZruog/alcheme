from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from ..prompts.trend_hunter import TREND_HUNTER_SYSTEM_PROMPT


def create_trend_hunter_agent() -> LlmAgent:
    """Create the Trend Hunter agent.

    Uses google_search as its only tool (ADK constraint:
    google_search cannot be combined with custom tools on the same agent).
    """
    return LlmAgent(
        name="trend_hunter_agent",
        model="gemini-2.5-flash",
        instruction=TREND_HUNTER_SYSTEM_PROMPT,
        description=(
            "SNS（Instagram/TikTok）や美容メディアから最新メイクトレンドを"
            "調査・分析するリサーチャー。色味・質感・テクニックを分解して報告。"
        ),
        tools=[google_search],
        output_key="session:last_trend_report",
    )
