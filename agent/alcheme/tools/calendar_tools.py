"""Calendar tools for the TPO Tactician agent.

MVP implementation: reads schedule from user session state.
Future: integrate with Google Calendar API / Apple Calendar.

Docstrings are used as tool descriptions by ADK.
"""

from google.adk.tools import ToolContext


# Occasion → formality mapping for beauty advice
_FORMALITY_HINTS: dict[str, str] = {
    "会議": "フォーマル寄り：落ち着いたカラー、マット仕上げ推奨",
    "プレゼン": "きちんと感：ベースメイクしっかり、リップは上品な色味",
    "面接": "清潔感重視：ナチュラルメイク、派手な色味は控えめに",
    "デート": "柔らかい印象：ピンク系やコーラル系がおすすめ、ツヤ肌仕上げ",
    "パーティー": "華やかに：ラメやグリッター、大胆なリップカラーも◎",
    "飲み会": "崩れにくさ重視：ティントリップ＋セッティングパウダー",
    "ランチ": "ナチュラル：軽めのベースにポイントメイクで十分",
    "ジム": "最小限メイク：眉＋リップ程度、ウォータープルーフ推奨",
    "在宅": "気分転換に軽めのメイク：リップだけでも気分アップ",
}


def get_today_schedule(tool_context: ToolContext) -> dict:
    """Get today's schedule for TPO-aware makeup recommendations.

    Returns the user's schedule for today. Currently reads from user state
    (manually set). Use this to understand what occasions the user has today
    and recommend appropriate makeup styles.

    Returns:
        dict with today's events and formality hints.
    """
    try:
        # Read schedule from user state (MVP: manually set by user or concierge)
        schedule = tool_context.state.get("user:today_schedule", None)

        if not schedule:
            return {
                "status": "success",
                "events": [],
                "note": "今日の予定は登録されていません。予定を教えていただければ、シーンに合ったメイクを提案できます！",
                "suggestion": "「今日は午後から会議がある」のように教えてください",
            }

        # If schedule is a string, parse it as a simple description
        if isinstance(schedule, str):
            events = [{"title": schedule, "time": "終日"}]
        elif isinstance(schedule, list):
            events = schedule
        else:
            events = [schedule] if isinstance(schedule, dict) else []

        # Add formality hints
        enriched_events = []
        for event in events:
            title = event.get("title", "") if isinstance(event, dict) else str(event)
            time = event.get("time", "") if isinstance(event, dict) else ""

            # Match formality
            hint = ""
            for keyword, advice in _FORMALITY_HINTS.items():
                if keyword in title:
                    hint = advice
                    break

            enriched_events.append({
                "title": title,
                "time": time,
                "formality_hint": hint,
            })

        return {
            "status": "success",
            "events": enriched_events,
            "event_count": len(enriched_events),
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"予定の取得に失敗しました: {e}",
        }
