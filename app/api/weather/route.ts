// GET /api/weather — 天気自動取得 (Google Weather API → Open-Meteo fallback)
// Open-Meteo: Weather data by Open-Meteo.com (https://open-meteo.com/) under CC BY 4.0

import { NextRequest, NextResponse } from 'next/server';

// Google Weather API condition type → Japanese label
const GOOGLE_WEATHER_MAP: Record<string, string> = {
  CLEAR: '晴れ',
  MOSTLY_CLEAR: '晴れ',
  PARTLY_CLOUDY: '曇り',
  MOSTLY_CLOUDY: '曇り',
  CLOUDY: '曇り',
  FOGGY: '曇り',
  HAZY: '曇り',
  LIGHT_RAIN: '雨',
  RAINY: '雨',
  HEAVY_RAIN: '雨',
  THUNDERSTORM: '雨',
  LIGHT_SNOW: '雪',
  SNOWY: '雪',
};

// WMO weather code → Japanese label (Open-Meteo)
const WMO_WEATHER_MAP: Record<number, string> = {
  0: '晴れ', 1: '晴れ', 2: '曇り', 3: '曇り',
  45: '曇り', 48: '曇り',
  51: '雨', 53: '雨', 55: '雨',
  56: '雨', 57: '雨',
  61: '雨', 63: '雨', 65: '雨',
  66: '雨', 67: '雨',
  71: '雪', 73: '雪', 75: '雪',
  77: '雪', 80: '雨', 81: '雨', 82: '雨',
  85: '雪', 86: '雪',
  95: '雨', 96: '雨', 99: '雨',
};

async function fetchGoogleWeather(lat: string, lon: string, apiKey: string) {
  const url = new URL('https://weather.googleapis.com/v1/currentConditions:lookup');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('location.latitude', lat);
  url.searchParams.set('location.longitude', lon);
  url.searchParams.set('languageCode', 'ja');

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (res.status === 404) return null; // Location not supported
  if (!res.ok) throw new Error(`Google Weather API: ${res.status}`);

  const data = await res.json();
  const weatherType = data.weatherCondition?.type ?? '';
  const weather = GOOGLE_WEATHER_MAP[weatherType] ?? '曇り';
  const temp = data.temperature?.degrees != null
    ? Math.round(data.temperature.degrees)
    : null;
  const humidity = data.relativeHumidity != null
    ? Math.round(data.relativeHumidity)
    : null;

  return { weather, temp, humidity, source: 'google-weather' };
}

async function fetchOpenMeteo(lat: string, lon: string) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,weather_code,relative_humidity_2m');
  url.searchParams.set('timezone', 'Asia/Tokyo');

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Open-Meteo API: ${res.status}`);

  const data = await res.json();
  const current = data.current ?? {};
  const wmoCode = current.weather_code ?? 3;
  const weather = WMO_WEATHER_MAP[wmoCode] ?? '曇り';
  const temp = current.temperature_2m != null
    ? Math.round(current.temperature_2m)
    : null;

  const humidity = current.relative_humidity_2m != null
    ? Math.round(current.relative_humidity_2m)
    : null;

  return { weather, temp, humidity, source: 'open-meteo' };
}

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lon = request.nextUrl.searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  // Try Google Weather API first
  const apiKey = process.env.GOOGLE_WEATHER_API_KEY;
  if (apiKey) {
    try {
      const result = await fetchGoogleWeather(lat, lon, apiKey);
      if (result) {
        console.log(JSON.stringify({ severity: 'INFO', message: 'weather_api_call', source: 'google-weather', endpoint: '/api/weather' }));
        return NextResponse.json(result);
      }
      // null = location not supported, fall through to Open-Meteo
    } catch (error) {
      console.warn('Google Weather API failed, trying Open-Meteo:', error);
    }
  }

  // Fallback: Open-Meteo (free, no API key, Japan supported)
  try {
    const result = await fetchOpenMeteo(lat, lon);
    console.log(JSON.stringify({ severity: 'INFO', message: 'weather_api_call', source: 'open-meteo', endpoint: '/api/weather' }));
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/weather error (both APIs failed):', error);
    return NextResponse.json({ weather: null, temp: null });
  }
}
