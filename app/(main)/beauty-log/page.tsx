"use client";

import { useState, useCallback } from "react";
import { CalendarHeart, Plus, Calendar, List, Loader2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MainTabHeader } from "@/components/main-tab-header";
import { EmptyState } from "@/components/empty-state";
import { BeautyLogSkeleton } from "@/components/loading-skeleton";
import { BeautyLogCalendar } from "@/components/beauty-log-calendar";
import { BeautyLogCard } from "@/components/beauty-log-card";
import { BeautyLogForm } from "@/components/beauty-log-form";
import { useBeautyLogs } from "@/hooks/use-beauty-log";
import { cn } from "@/lib/utils";
import type { BeautyLogEntry } from "@/types/beauty-log";

const MOOD_EMOJI: Record<string, string> = {
  元気: "😊",
  落ち着き: "😌",
  ウキウキ: "🥰",
  疲れ: "😤",
};

const WEATHER_EMOJI: Record<string, string> = {
  晴れ: "☀️",
  曇り: "☁️",
  雨: "🌧️",
  雪: "❄️",
};

function TimelineCard({ log }: { log: BeautyLogEntry }) {
  const dateObj = new Date(log.date + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Link href={`/beauty-log/${log.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        {/* Image row */}
        {(log.preview_image_url || (log.photos && log.photos.length > 0)) && (
          <div className="flex h-32 overflow-hidden">
            {log.preview_image_url && (
              <img
                src={log.preview_image_url}
                alt=""
                className={cn(
                  "object-cover",
                  log.photos?.length ? "w-1/2" : "w-full"
                )}
              />
            )}
            {log.photos?.slice(0, log.preview_image_url ? 2 : 3).map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt=""
                className="flex-1 object-cover"
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-text-ink">{dateLabel}</span>
            <div className="flex items-center gap-2">
              {log.weather && (
                <span className="text-sm">{WEATHER_EMOJI[log.weather] ?? ""}</span>
              )}
              {log.mood && (
                <span className="text-sm">{MOOD_EMOJI[log.mood] ?? "💄"}</span>
              )}
              {log.self_rating && (
                <span className="text-xs text-alcheme-gold font-bold">
                  {"★".repeat(log.self_rating)}
                </span>
              )}
            </div>
          </div>

          {log.recipe_name && (
            <p className="text-sm font-medium text-text-ink truncate">{log.recipe_name}</p>
          )}
          {log.occasion && (
            <span className="text-[10px] text-alcheme-rose bg-alcheme-rose/10 px-2 py-0.5 rounded-full mt-1 inline-block">
              {log.occasion}
            </span>
          )}
          {log.user_note && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">{log.user_note}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function BeautyLogPage() {
  const {
    logs, isLoading, error, mutate, selectedMonth, setSelectedMonth,
    viewMode, setViewMode,
    timelineLogs, timelineLoading, hasMore, loadMore,
  } = useBeautyLogs();

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState<string | undefined>();

  const [year, month] = selectedMonth.split("-").map(Number);

  const handlePrevMonth = useCallback(() => {
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }, [year, month, setSelectedMonth]);

  const handleNextMonth = useCallback(() => {
    const d = new Date(year, month, 1);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }, [year, month, setSelectedMonth]);

  const handleDateClick = useCallback((date: string) => {
    setFormDate(date);
    setShowForm(true);
  }, []);

  const handleFormSave = useCallback(() => {
    setShowForm(false);
    setFormDate(undefined);
    mutate();
  }, [mutate]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setFormDate(undefined);
  }, []);

  if (showForm) {
    return (
      <div>
        <PageHeader title="メイク日記を記録" backHref="/beauty-log" />
        <BeautyLogForm
          date={formDate}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-8">
      <MainTabHeader
        title="メイク日記"
        rightElement={
          <>
            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-full p-0.5">
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  viewMode === "calendar" ? "bg-white shadow-sm text-text-ink" : "text-text-muted"
                )}
                aria-label="カレンダー表示"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  viewMode === "timeline" ? "bg-white shadow-sm text-text-ink" : "text-text-muted"
                )}
                aria-label="タイムライン表示"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 rounded-full bg-alcheme-rose px-3 py-1.5 text-xs font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              記録
            </button>
          </>
        }
      />

      {error ? (
        <div className="p-8 text-center">
          <p className="text-sm text-alcheme-muted mb-3">
            ログの読み込みに失敗しました
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
          >
            再読み込み
          </button>
        </div>
      ) : viewMode === "calendar" ? (
        /* Calendar View */
        isLoading ? (
          <BeautyLogSkeleton />
        ) : (
          <>
            <BeautyLogCalendar
              year={year}
              month={month}
              logs={logs}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onDateClick={handleDateClick}
            />

            {logs.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<CalendarHeart className="h-12 w-12" />}
                  title="まだログがありません"
                  description="日々のメイクを記録して、あなただけの美容データを蓄積しましょう"
                  action={
                    <button
                      onClick={() => setShowForm(true)}
                      className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
                    >
                      最初のログを記録
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3 px-4 py-4">
                {logs.map((log) => (
                  <BeautyLogCard key={log.id} log={log} />
                ))}
              </div>
            )}
          </>
        )
      ) : (
        /* Timeline View */
        <div className="px-4 pt-4">
          {timelineLoading && timelineLogs.length === 0 ? (
            <BeautyLogSkeleton />
          ) : timelineLogs.length === 0 ? (
            <EmptyState
              icon={<CalendarHeart className="h-12 w-12" />}
              title="まだログがありません"
              description="日々のメイクを記録して、あなただけの美容データを蓄積しましょう"
              action={
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
                >
                  最初のログを記録
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {timelineLogs.map((log) => (
                <TimelineCard key={log.id} log={log} />
              ))}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={timelineLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm text-text-muted hover:border-neon-accent hover:text-neon-accent transition-colors btn-squishy"
                >
                  {timelineLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "もっと見る"
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
