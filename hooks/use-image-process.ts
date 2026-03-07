import { useState, useCallback } from 'react';

interface UseImageProcessResult {
  /** base64 data URL → 加工済み data URL を返す */
  processImage: (imageBase64: string) => Promise<string | null>;
  isProcessing: boolean;
  error: string | null;
  reset: () => void;
}

export function useImageProcess(): UseImageProcessResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (imageBase64: string): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/image/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64 }),
      });
      if (!res.ok) throw new Error('Processing failed');
      const data = await res.json();
      return `data:${data.mime_type};base64,${data.processed_base64}`;
    } catch {
      setError('画像の加工に失敗しました。もう一度お試しください。');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { processImage, isProcessing, error, reset };
}
