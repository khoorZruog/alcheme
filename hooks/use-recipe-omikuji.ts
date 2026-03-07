"use client";

import { useState, useCallback, useRef } from "react";
import type { ScoredRecipe } from "@/lib/recipe-recommendation";

export function useRecipeOmikuji() {
  const [result, setResult] = useState<ScoredRecipe | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasNoRecipes, setHasNoRecipes] = useState(false);
  const [allExhausted, setAllExhausted] = useState(false);
  const excludeRef = useRef<string[]>([]);
  const weatherRef = useRef<string | null>(null);

  const fetchWeather = useCallback(async (): Promise<string | null> => {
    if (weatherRef.current) return weatherRef.current;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
      );
      const res = await fetch(
        `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      weatherRef.current = data.weather ?? null;
      return weatherRef.current;
    } catch {
      return null;
    }
  }, []);

  const drawRecipe = useCallback(async () => {
    setIsDrawing(true);
    setAllExhausted(false);
    setHasNoRecipes(false);

    try {
      const weather = await fetchWeather();
      const params = new URLSearchParams();
      if (weather) params.set("weather", weather);
      if (excludeRef.current.length > 0) {
        params.set("exclude", excludeRef.current.join(","));
      }

      const res = await fetch(`/api/recipes/recommend?${params.toString()}`);
      if (!res.ok) throw new Error("recommend failed");
      const data = await res.json();

      if (!data.recipe) {
        if (excludeRef.current.length === 0) {
          setHasNoRecipes(true);
        } else {
          setAllExhausted(true);
        }
        setResult(null);
      } else {
        setResult({
          recipe: data.recipe,
          score: data.score,
          reasons: data.reasons,
        });
      }
    } catch {
      setHasNoRecipes(true);
      setResult(null);
    } finally {
      setIsDrawing(false);
    }
  }, [fetchWeather]);

  const excludeAndRedraw = useCallback(async () => {
    if (result) {
      excludeRef.current = [...excludeRef.current, result.recipe.id];
    }
    await drawRecipe();
  }, [result, drawRecipe]);

  const reset = useCallback(() => {
    setResult(null);
    setIsDrawing(false);
    setHasNoRecipes(false);
    setAllExhausted(false);
    excludeRef.current = [];
    weatherRef.current = null;
  }, []);

  return {
    result,
    isDrawing,
    hasNoRecipes,
    allExhausted,
    drawRecipe,
    excludeAndRedraw,
    reset,
  };
}
