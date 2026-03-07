/**
 * Client-side weather × beauty advice mapping.
 * Mirrors agent/alcheme/tools/weather_tools.py tips for frontend use.
 */

const WEATHER_TIPS: Record<string, string> = {
  晴れ: '紫外線対策を忘れずに。UV カット下地がおすすめ',
  曇り: '曇りでも紫外線は届きます。UV 対策は必要',
  雨: '崩れやすいので、ウォータープルーフアイテムがおすすめ',
  雪: '乾燥しやすいので保湿重視のベースメイクを',
};

export function getWeatherTip(weather: string): string {
  return WEATHER_TIPS[weather] ?? '';
}

export function getHumidityTip(humidity: number | null | undefined): string {
  if (humidity == null) return '';
  if (humidity >= 80) return '高湿度：オイルコントロール下地でしっかりセット';
  if (humidity >= 60) return 'やや湿度高め：パウダーで仕上げると持ちアップ';
  if (humidity <= 30) return '乾燥注意：保湿ミストで潤いキープ';
  return '';
}

export function getTempTip(temp: number | null | undefined): string {
  if (temp == null) return '';
  if (temp >= 30) return '猛暑：軽めのベースメイクで汗崩れ対策';
  if (temp <= 5) return '寒い日：チークやリップで血色感をプラス';
  return '';
}

/**
 * Get the most relevant beauty tip for given conditions.
 */
export function getBeautyTip(
  weather: string | null | undefined,
  temp: number | null | undefined,
  humidity: number | null | undefined,
): string {
  if (weather) {
    const tip = getWeatherTip(weather);
    if (tip) return tip;
  }
  const humidTip = getHumidityTip(humidity);
  if (humidTip) return humidTip;
  const tempTip = getTempTip(temp);
  if (tempTip) return tempTip;
  return '';
}
