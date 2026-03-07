import useSWR from 'swr';
import type { BeautyLogEntry } from '@/types/beauty-log';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Fetch beauty logs for the past `days` days (default 7).
 * Shared by Stories Tray, Today's Forecast, and Weekly Report.
 */
export function useWeeklyLogs(days = 7) {
  const today = new Date();
  const end = formatDate(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));
  const start = formatDate(startDate);

  const { data, error, isLoading, mutate } = useSWR<{ logs: BeautyLogEntry[]; count: number }>(
    `/api/beauty-log?start=${start}&end=${end}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    logs: data?.logs ?? [],
    isLoading,
    error,
    mutate,
    start,
    end,
  };
}
