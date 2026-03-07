import { describe, it, expect } from 'vitest';
import { getBeautyTip, getWeatherTip, getHumidityTip, getTempTip } from '@/lib/beauty-weather-tips';

describe('beauty-weather-tips', () => {
  describe('getWeatherTip', () => {
    it('returns UV tip for sunny', () => {
      expect(getWeatherTip('晴れ')).toContain('紫外線');
    });

    it('returns waterproof tip for rain', () => {
      expect(getWeatherTip('雨')).toContain('ウォータープルーフ');
    });

    it('returns empty for unknown weather', () => {
      expect(getWeatherTip('竜巻')).toBe('');
    });
  });

  describe('getHumidityTip', () => {
    it('returns high humidity tip', () => {
      expect(getHumidityTip(85)).toContain('オイルコントロール');
    });

    it('returns dry tip for low humidity', () => {
      expect(getHumidityTip(25)).toContain('乾燥');
    });

    it('returns empty for moderate humidity', () => {
      expect(getHumidityTip(50)).toBe('');
    });

    it('returns empty for null', () => {
      expect(getHumidityTip(null)).toBe('');
    });
  });

  describe('getTempTip', () => {
    it('returns heat tip for 30+', () => {
      expect(getTempTip(32)).toContain('猛暑');
    });

    it('returns cold tip for 5 or below', () => {
      expect(getTempTip(3)).toContain('寒い');
    });

    it('returns empty for moderate temp', () => {
      expect(getTempTip(20)).toBe('');
    });
  });

  describe('getBeautyTip', () => {
    it('prioritizes weather tip', () => {
      expect(getBeautyTip('雨', 32, 85)).toContain('ウォータープルーフ');
    });

    it('falls back to humidity tip', () => {
      expect(getBeautyTip(null, null, 85)).toContain('オイルコントロール');
    });

    it('falls back to temp tip', () => {
      expect(getBeautyTip(null, 3, null)).toContain('寒い');
    });
  });
});
