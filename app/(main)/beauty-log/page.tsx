"use client";

import { useState, useCallback } from "react";
import { CalendarHeart, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BeautyLogSkeleton } from "@/components/loading-skeleton";
import { BeautyLogCalendar } from "@/components/beauty-log-calendar";
import { BeautyLogCard } from "@/components/beauty-log-card";
import { BeautyLogForm } from "@/components/beauty-log-form";
import { useBeautyLogs } from "@/hooks/use-beauty-log";

export default function BeautyLogPage() {
  const { logs, isLoading, error, mutate, selectedMonth, setSelectedMonth } =
    useBeautyLogs();
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
        <PageHeader title="メイクログを記録" backHref="/beauty-log" />
        <BeautyLogForm
          date={formDate}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Beauty Log"
        rightElement={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-full bg-alcheme-rose px-3 py-1.5 text-xs font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            記録
          </button>
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
      ) : isLoading ? (
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
      )}
    </div>
  );
}
