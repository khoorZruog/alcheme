"""Weather tools for the TPO Tactician agent.

Provides current weather data to help agents make context-aware makeup
recommendations (rain → waterproof, humidity → oil control, UV → sun protection).

Uses the Google Weather API (Maps Platform).
Docstrings are used as tool descriptions by ADK.
"""

import os
import logging
from typing import Any

import requests
from google.adk.tools import ToolContext

logger = logging.getLogger(__name__)

GOOGLE_WEATHER_API_KEY = os.environ.get("GOOGLE_WEATHER_API_KEY", "")
GOOGLE_WEATHER_BASE_URL = "https://weather.googleapis.com/v1/currentConditions:lookup"

# City name → (latitude, longitude) for common Japanese cities
_CITY_COORDS: dict[str, tuple[float, float]] = {
    "tokyo": (35.6762, 139.6503),
    "東京": (35.6762, 139.6503),
    "osaka": (34.6937, 135.5023),
    "大阪": (34.6937, 135.5023),
    "nagoya": (35.1815, 136.9066),
    "名古屋": (35.1815, 136.9066),
    "fukuoka": (33.5904, 130.4017),
    "福岡": (33.5904, 130.4017),
    "sapporo": (43.0618, 141.3545),
    "札幌": (43.0618, 141.3545),
    "yokohama": (35.4437, 139.6380),
    "横浜": (35.4437, 139.6380),
    "kobe": (34.6901, 135.1956),
    "神戸": (34.6901, 135.1956),
    "kyoto": (35.0116, 135.7681),
    "京都": (35.0116, 135.7681),
    "sendai": (38.2682, 140.8694),
    "仙台": (38.2682, 140.8694),
    "hiroshima": (34.3853, 132.4553),
    "広島": (34.3853, 132.4553),
    "naha": (26.2124, 127.6809),
    "那覇": (26.2124, 127.6809),
}

# Weather condition type → beauty advice mapping
_WEATHER_BEAUTY_TIPS: dict[str, str] = {
    "RAINY": "雨の日は崩れやすいので、ウォータープルーフアイテムやフィックスミストがおすすめ",
    "LIGHT_RAIN": "小雨でも湿気が多いので、崩れにくいベースメイクを心がけて",
    "HEAVY_RAIN": "激しい雨の日は最小限メイク＋ウォータープルーフが安心",
    "THUNDERSTORM": "激しい雨の日は最小限メイク＋ウォータープルーフが安心",
    "SNOWY": "乾燥しやすいので保湿重視のベースメイクがおすすめ。リップクリームも忘れずに",
    "LIGHT_SNOW": "乾燥しやすいので保湿重視のベースメイクがおすすめ。リップクリームも忘れずに",
    "CLEAR": "晴れの日は紫外線対策を忘れずに。日焼け止め下地がマスト",
    "MOSTLY_CLEAR": "晴れの日は紫外線対策を忘れずに。日焼け止め下地がマスト",
    "PARTLY_CLOUDY": "曇りでも紫外線は届くので、UV対策は必要",
    "MOSTLY_CLOUDY": "曇りでも紫外線は届くので、UV対策は必要",
    "CLOUDY": "曇りでも紫外線は届くので、UV対策は必要",
    "FOGGY": "霧の日は湿気が多いので、崩れにくいパウダー仕上げがおすすめ",
    "HAZY": "もやの日は肌がくすみやすいので、トーンアップ下地が効果的",
}


def _resolve_coords(location: str) -> tuple[float, float]:
    """Resolve a city name to latitude/longitude. Defaults to Tokyo."""
    key = location.strip().lower()
    return _CITY_COORDS.get(key, _CITY_COORDS["tokyo"])


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
        location: City name (e.g., "Tokyo", "東京", "Osaka"). Defaults to Tokyo if empty.

    Returns:
        dict with weather data and beauty advice.
    """
    if not location or location.strip() == "":
        location = tool_context.state.get("user:location", "Tokyo")

    if not GOOGLE_WEATHER_API_KEY:
        return {
            "status": "unavailable",
            "message": "天気情報は現在利用できません。手動で天気を教えてください。",
            "location": location,
        }

    lat, lng = _resolve_coords(location)

    try:
        resp = requests.get(
            GOOGLE_WEATHER_BASE_URL,
            params={
                "key": GOOGLE_WEATHER_API_KEY,
                "location.latitude": lat,
                "location.longitude": lng,
                "languageCode": "ja",
            },
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        # Extract fields from Google Weather API response
        condition = data.get("weatherCondition", {})
        weather_type = condition.get("type", "")
        weather_desc = condition.get("description", {}).get("text", "")

        temp_obj = data.get("temperature", {})
        temp = temp_obj.get("degrees")

        humidity = data.get("relativeHumidity", 50)
        uvi = data.get("uvIndex")

        precip = data.get("precipitation", {})
        rain_prob = precip.get("probability", {}).get("percent")

        # Build beauty advice
        beauty_tips: list[str] = []
        tip = _WEATHER_BEAUTY_TIPS.get(weather_type, "")
        if tip:
            beauty_tips.append(tip)
        humidity_tip = _humidity_advice(humidity)
        if humidity_tip:
            beauty_tips.append(humidity_tip)
        uv_tip = _uv_advice(uvi)
        if uv_tip:
            beauty_tips.append(uv_tip)

        # Temperature-based advice
        if temp is not None:
            if temp >= 30:
                beauty_tips.append("猛暑：汗崩れ対策が最重要。軽めのベースメイクがおすすめ")
            elif temp <= 5:
                beauty_tips.append("寒い日：血色感が出にくいので、チークやリップで色味をプラス")

        # Rain probability advice
        if rain_prob is not None and rain_prob >= 50:
            beauty_tips.append(f"降水確率{rain_prob}%：ウォータープルーフ推奨")

        return {
            "status": "success",
            "location": location,
            "weather": weather_desc,
            "weather_type": weather_type,
            "temperature": temp,
            "humidity": humidity,
            "uv_index": uvi,
            "rain_probability": rain_prob,
            "beauty_advice": beauty_tips,
        }
    except requests.RequestException as e:
        logger.warning("Google Weather API request failed for %s: %s", location, e)
        return {
            "status": "error",
            "message": f"天気情報の取得に失敗しました: {e}",
            "location": location,
        }
