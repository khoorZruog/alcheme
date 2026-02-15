"""Weather tools for the TPO Tactician agent.

Provides current weather data to help agents make context-aware makeup
recommendations (rain → waterproof, humidity → oil control, UV → sun protection).

Docstrings are used as tool descriptions by ADK.
"""

import os
import logging
from typing import Any

import requests
from google.adk.tools import ToolContext

logger = logging.getLogger(__name__)

OPENWEATHERMAP_API_KEY = os.environ.get("OPENWEATHERMAP_API_KEY", "")
OPENWEATHERMAP_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# Weather → beauty advice mapping
_WEATHER_BEAUTY_TIPS: dict[str, str] = {
    "Rain": "雨の日は崩れやすいので、ウォータープルーフアイテムやフィックスミストがおすすめ",
    "Drizzle": "小雨でも湿気が多いので、崩れにくいベースメイクを心がけて",
    "Thunderstorm": "激しい雨の日は最小限メイク＋ウォータープルーフが安心",
    "Snow": "乾燥しやすいので保湿重視のベースメイクがおすすめ。リップクリームも忘れずに",
    "Clear": "晴れの日は紫外線対策を忘れずに。日焼け止め下地がマスト",
    "Clouds": "曇りでも紫外線は届くので、UV対策は必要",
    "Mist": "霧の日は湿気が多いので、崩れにくいパウダー仕上げがおすすめ",
    "Haze": "もやの日は肌がくすみやすいので、トーンアップ下地が効果的",
}


def _humidity_advice(humidity: int) -> str:
    """Generate beauty advice based on humidity level."""
    if humidity >= 80:
        return "高湿度：皮脂崩れに注意。オイルコントロール下地やパウダーでしっかりセット"
    elif humidity >= 60:
        return "やや湿度高め：ティッシュオフしてからパウダーをのせると持ちアップ"
    elif humidity <= 30:
        return "乾燥注意：保湿ミストやクリーム系ファンデで潤いキープ"
    return ""


def _uv_advice(uvi: float | None) -> str:
    """Generate UV protection advice."""
    if uvi is None:
        return ""
    if uvi >= 8:
        return "紫外線非常に強い：SPF50+/PA++++の日焼け止めを。こまめな塗り直しも"
    elif uvi >= 6:
        return "紫外線強め：SPF30以上の日焼け止め下地がおすすめ"
    elif uvi >= 3:
        return "紫外線やや強い：UV対策付きの下地で十分"
    return ""


def get_weather(location: str, tool_context: ToolContext) -> dict:
    """Get current weather information for makeup recommendations.

    Returns weather data including temperature, humidity, and beauty-specific
    advice for the specified location. Use this to provide TPO-aware
    (Time, Place, Occasion) makeup recommendations.

    Args:
        location: City name (e.g., "Tokyo", "Osaka"). Defaults to Tokyo if empty.

    Returns:
        dict with weather data and beauty advice.
    """
    if not location or location.strip() == "":
        # Try user state, fallback to Tokyo
        location = tool_context.state.get("user:location", "Tokyo")

    if not OPENWEATHERMAP_API_KEY:
        return {
            "status": "unavailable",
            "message": "天気情報は現在利用できません。手動で天気を教えてください。",
            "location": location,
        }

    try:
        resp = requests.get(
            OPENWEATHERMAP_BASE_URL,
            params={
                "q": location,
                "appid": OPENWEATHERMAP_API_KEY,
                "units": "metric",
                "lang": "ja",
            },
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        weather_main = data.get("weather", [{}])[0].get("main", "")
        weather_desc = data.get("weather", [{}])[0].get("description", "")
        temp = data.get("main", {}).get("temp")
        humidity = data.get("main", {}).get("humidity", 50)

        # Build beauty advice
        beauty_tips: list[str] = []
        tip = _WEATHER_BEAUTY_TIPS.get(weather_main, "")
        if tip:
            beauty_tips.append(tip)
        humidity_tip = _humidity_advice(humidity)
        if humidity_tip:
            beauty_tips.append(humidity_tip)

        # Temperature-based advice
        if temp is not None:
            if temp >= 30:
                beauty_tips.append("猛暑：汗崩れ対策が最重要。軽めのベースメイクがおすすめ")
            elif temp <= 5:
                beauty_tips.append("寒い日：血色感が出にくいので、チークやリップで色味をプラス")

        return {
            "status": "success",
            "location": location,
            "weather": weather_desc,
            "weather_main": weather_main,
            "temperature": temp,
            "humidity": humidity,
            "beauty_advice": beauty_tips,
        }
    except requests.RequestException as e:
        logger.warning("Weather API request failed for %s: %s", location, e)
        return {
            "status": "error",
            "message": f"天気情報の取得に失敗しました: {e}",
            "location": location,
        }
