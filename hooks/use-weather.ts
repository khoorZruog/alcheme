"use client";

import { useState, useEffect } from "react";

export interface WeatherData {
  weather: string | null;
  temp: number | null;
  humidity: number | null;
}

const INITIAL: WeatherData = { weather: null, temp: null, humidity: null };
const CACHE_KEY = "alcheme:weather";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CachedWeather {
  data: WeatherData;
  ts: number;
}

function readCache(): WeatherData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedWeather = JSON.parse(raw);
    if (Date.now() - cached.ts > CACHE_TTL_MS) return null;
    if (!cached.data.weather) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(data: WeatherData): void {
  try {
    const entry: CachedWeather = { data, ts: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage unavailable
  }
}

export function useWeather(): { data: WeatherData; isLoading: boolean } {
  const [data, setData] = useState<WeatherData>(() => readCache() ?? INITIAL);
  const [isLoading, setIsLoading] = useState(() => readCache() === null);

  useEffect(() => {
    let ignore = false;

    // If cache hit, skip fetch
    const cached = readCache();
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (ignore) return;
        try {
          const res = await fetch(
            `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          if (ignore) return;
          if (!res.ok) throw new Error();
          const json = await res.json();
          const result: WeatherData = {
            weather: json.weather ?? null,
            temp: json.temp ?? null,
            humidity: json.humidity ?? null,
          };
          setData(result);
          writeCache(result);
        } catch {
          // Silently fail
        } finally {
          if (!ignore) setIsLoading(false);
        }
      },
      () => { if (!ignore) setIsLoading(false); },
      { timeout: 5000 },
    );

    return () => { ignore = true; };
  }, []);

  return { data, isLoading };
}
