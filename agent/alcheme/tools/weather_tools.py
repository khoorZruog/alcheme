"""Weather tools for the TPO Tactician agent.

Provides current weather data to help agents make context-aware makeup
recommendations (rain → waterproof, humidity → oil control, UV → sun protection).

Uses the Google Weather API (Maps Platform).
Docstrings are used as tool descriptions by ADK.
"""

import json
import os
import logging
import time
from typing import Any

import requests
from google.adk.tools import ToolContext

logger = logging.getLogger(__name__)

GOOGLE_WEATHER_API_KEY = os.environ.get("GOOGLE_WEATHER_API_KEY", "")
GOOGLE_WEATHER_BASE_URL = "https://weather.googleapis.com/v1/currentConditions:lookup"
OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

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


# WMO weather code → internal weather type mapping (Open-Meteo)
_WMO_CODE_MAP: dict[int, str] = {
    0: "CLEAR", 1: "MOSTLY_CLEAR", 2: "PARTLY_CLOUDY", 3: "CLOUDY",
    45: "FOGGY", 48: "FOGGY",
    51: "LIGHT_RAIN", 53: "RAINY", 55: "HEAVY_RAIN",
    56: "LIGHT_RAIN", 57: "HEAVY_RAIN",
    61: "LIGHT_RAIN", 63: "RAINY", 65: "HEAVY_RAIN",
    66: "LIGHT_RAIN", 67: "HEAVY_RAIN",
    71: "LIGHT_SNOW", 73: "SNOWY", 75: "SNOWY",
    77: "SNOWY",
    80: "LIGHT_RAIN", 81: "RAINY", 82: "HEAVY_RAIN",
    85: "LIGHT_SNOW", 86: "SNOWY",
    95: "THUNDERSTORM", 96: "THUNDERSTORM", 99: "THUNDERSTORM",
}

# WMO weather code → Japanese description
_WMO_CODE_DESC: dict[int, str] = {
    0: "快晴", 1: "晴れ", 2: "くもり時々晴れ", 3: "くもり",
    45: "霧", 48: "霧",
    51: "小雨", 53: "雨", 55: "大雨",
    56: "凍雨", 57: "凍雨",
    61: "小雨", 63: "雨", 65: "大雨",
    66: "凍雨", 67: "凍雨",
    71: "小雪", 73: "雪", 75: "大雪",
    77: "雪", 80: "にわか雨", 81: "にわか雨", 82: "激しいにわか雨",
    85: "にわか雪", 86: "にわか雪",
    95: "雷雨", 96: "雷雨（雹を伴う）", 99: "雷雨（雹を伴う）",
}


# In-memory weather cache (TTL-based) to reduce Open-Meteo API calls
_weather_cache: dict[str, tuple[float, dict]] = {}
_CACHE_TTL = 900  # 15 minutes


def _get_cached(lat: float, lng: float) -> dict | None:
    """Return cached weather data if still fresh, else None."""
    key = f"{lat:.2f},{lng:.2f}"
    if key in _weather_cache:
        ts, data = _weather_cache[key]
        if time.time() - ts < _CACHE_TTL:
            return data
        del _weather_cache[key]
    return None


def _set_cache(lat: float, lng: float, data: dict) -> None:
    """Store weather data in cache."""
    key = f"{lat:.2f},{lng:.2f}"
    _weather_cache[key] = (time.time(), data)


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


def _fetch_open_meteo(lat: float, lng: float, location: str) -> dict | None:
    """Fetch weather from Open-Meteo API (free, no key required, Japan supported).

    Data by Open-Meteo.com (https://open-meteo.com/) under CC BY 4.0.
    """
    try:
        resp = requests.get(
            OPEN_METEO_BASE_URL,
            params={
                "latitude": lat,
                "longitude": lng,
                "current": "temperature_2m,relative_humidity_2m,weather_code,uv_index,precipitation",
                "timezone": "Asia/Tokyo",
            },
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        current = data.get("current", {})
        wmo_code = current.get("weather_code", 0)
        weather_type = _WMO_CODE_MAP.get(wmo_code, "CLOUDY")
        weather_desc = _WMO_CODE_DESC.get(wmo_code, "くもり")

        temp = current.get("temperature_2m")
        humidity = current.get("relative_humidity_2m", 50)
        uvi = current.get("uv_index")

        logger.info(json.dumps({
            "message": "weather_api_call",
            "source": "open-meteo",
            "endpoint": "agent/weather",
            "location": location,
        }))
        result = {
            "weather_type": weather_type,
            "weather_desc": weather_desc,
            "temp": temp,
            "humidity": humidity,
            "uvi": uvi,
            "source": "open-meteo",
        }
        _set_cache(lat, lng, result)
        return result
    except requests.RequestException as e:
        logger.warning("Open-Meteo API request failed for %s: %s", location, e)
        return None


def _build_beauty_advice(
    weather_type: str, humidity: int, uvi: float | None, temp: float | None,
    rain_prob: int | None = None,
) -> list[str]:
    """Build beauty advice tips from weather data."""
    tips: list[str] = []
    tip = _WEATHER_BEAUTY_TIPS.get(weather_type, "")
    if tip:
        tips.append(tip)
    humidity_tip = _humidity_advice(humidity)
    if humidity_tip:
        tips.append(humidity_tip)
    uv_tip = _uv_advice(uvi)
    if uv_tip:
        tips.append(uv_tip)
    if temp is not None:
        if temp >= 30:
            tips.append("猛暑：汗崩れ対策が最重要。軽めのベースメイクがおすすめ")
        elif temp <= 5:
            tips.append("寒い日：血色感が出にくいので、チークやリップで色味をプラス")
    if rain_prob is not None and rain_prob >= 50:
        tips.append(f"降水確率{rain_prob}%：ウォータープルーフ推奨")
    return tips


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

    lat, lng = _resolve_coords(location)

    # Check cache first
    cached = _get_cached(lat, lng)
    if cached:
        weather_type = cached["weather_type"]
        return {
            "status": "success",
            "location": location,
            "weather": cached.get("weather_desc", ""),
            "weather_type": weather_type,
            "temperature": cached.get("temp"),
            "humidity": cached.get("humidity", 50),
            "uv_index": cached.get("uvi"),
            "rain_probability": None,
            "beauty_advice": _build_beauty_advice(
                weather_type, cached.get("humidity", 50),
                cached.get("uvi"), cached.get("temp"),
            ),
            "source": f"{cached.get('source', 'open-meteo')} (cached)",
        }

    # Try Google Weather API first (if key is configured)
    if GOOGLE_WEATHER_API_KEY:
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
            if resp.status_code == 200:
                data = resp.json()
                condition = data.get("weatherCondition", {})
                weather_type = condition.get("type", "")
                weather_desc = condition.get("description", {}).get("text", "")
                temp_obj = data.get("temperature", {})
                temp = temp_obj.get("degrees")
                humidity = data.get("relativeHumidity", 50)
                uvi = data.get("uvIndex")
                precip = data.get("precipitation", {})
                rain_prob = precip.get("probability", {}).get("percent")

                logger.info(json.dumps({
                    "message": "weather_api_call",
                    "source": "google-weather",
                    "endpoint": "agent/weather",
                    "location": location,
                }))
                return {
                    "status": "success",
                    "location": location,
                    "weather": weather_desc,
                    "weather_type": weather_type,
                    "temperature": temp,
                    "humidity": humidity,
                    "uv_index": uvi,
                    "rain_probability": rain_prob,
                    "beauty_advice": _build_beauty_advice(weather_type, humidity, uvi, temp, rain_prob),
                    "source": "google-weather",
                }
            # 404 = location not supported by Google Weather API
            if resp.status_code == 404:
                logger.info("Google Weather API does not support %s, falling back to Open-Meteo", location)
            else:
                resp.raise_for_status()
        except requests.RequestException as e:
            logger.warning("Google Weather API failed for %s: %s, trying Open-Meteo", location, e)

    # Fallback: Open-Meteo (free, no API key, supports Japan)
    om = _fetch_open_meteo(lat, lng, location)
    if om:
        return {
            "status": "success",
            "location": location,
            "weather": om["weather_desc"],
            "weather_type": om["weather_type"],
            "temperature": om["temp"],
            "humidity": om["humidity"],
            "uv_index": om["uvi"],
            "rain_probability": None,
            "beauty_advice": _build_beauty_advice(om["weather_type"], om["humidity"], om["uvi"], om["temp"]),
            "source": "open-meteo",
            "attribution": "Weather data by Open-Meteo.com (CC BY 4.0)",
        }

    return {
        "status": "unavailable",
        "message": "天気情報は現在利用できません。手動で天気を教えてください。",
        "location": location,
    }
