// GET /api/weather — 天気自動取得 (Google Weather API)

import { NextRequest, NextResponse } from 'next/server';

// Google Weather API condition type → Japanese label
const WEATHER_MAP: Record<string, string> = {
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

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lon = request.nextUrl.searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_WEATHER_API_KEY;
  if (!apiKey) {
    // API key not configured — return empty result so the client falls back to manual selection
    return NextResponse.json({ weather: null, temp: null });
  }

  try {
    const url = new URL('https://weather.googleapis.com/v1/currentConditions:lookup');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('location.latitude', lat);
    url.searchParams.set('location.longitude', lon);
    url.searchParams.set('languageCode', 'ja');

    const res = await fetch(url.toString(), { next: { revalidate: 900 } }); // Cache 15 min
    if (!res.ok) throw new Error(`Google Weather API: ${res.status}`);

    const data = await res.json();

    const weatherType = data.weatherCondition?.type ?? '';
    const weather = WEATHER_MAP[weatherType] ?? '曇り';
    const temp = data.temperature?.degrees != null
      ? Math.round(data.temperature.degrees)
      : null;

    return NextResponse.json({ weather, temp });
  } catch (error) {
    console.error('GET /api/weather error:', error);
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 500 });
  }
}
