"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Save, CalendarDays, Unlink, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useCalendar } from "@/hooks/use-calendar";
import { useSettingsForm } from "../../use-settings-form";
import { CalendarEventsPreview } from "../../_components/calendar-section";

export default function EditCalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    connected,
    connecting,
    disconnecting,
    calendars,
    selectedCalendars,
    events,
    eventSource,
    connect,
    disconnect,
    selectCalendars,
  } = useCalendar();
  const { form, update, saving, saved, handleSave } = useSettingsForm();

  // Show toast on successful connection
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("Google カレンダーを連携しました");
    }
    const error = searchParams.get("error");
    if (error === "denied") {
      toast.error("カレンダーへのアクセスが拒否されました");
    } else if (error) {
      toast.error("連携に失敗しました。もう一度お試しください");
    }
  }, [searchParams]);

  const handleCalendarToggle = (calendarId: string) => {
    const next = selectedCalendars.includes(calendarId)
      ? selectedCalendars.filter((id) => id !== calendarId)
      : [...selectedCalendars, calendarId];
    selectCalendars(next);
  };

  const onSave = async () => {
    await handleSave();
    router.push("/settings");
  };

  return (
    <div>
      <PageHeader title="カレンダー連携" backHref="/settings" />
      <div className="px-4 py-4 space-y-6">
        {/* Google Calendar Connection */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-text-ink">
            <CalendarDays className="h-4 w-4" /> Google カレンダー
          </h2>
          <p className="text-xs text-text-muted">
            カレンダーと連携すると、今日の予定に合わせたメイクを提案できます
          </p>

          {connected ? (
            <div className="space-y-4">
              {/* Connected status */}
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                連携中
              </div>

              {/* Disconnect button */}
              <button
                type="button"
                onClick={disconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Unlink className="h-3.5 w-3.5" />
                {disconnecting ? "解除中..." : "連携を解除"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={connect}
              disabled={connecting}
              className="w-full h-11 rounded-2xl relative overflow-hidden shadow-sm btn-squishy disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/80 border border-white/60" />
              <div className="relative z-10 text-text-ink font-medium text-sm flex items-center justify-center gap-2">
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarDays className="h-4 w-4" />
                )}
                {connecting
                  ? "連携中..."
                  : "Google カレンダーを連携する"}
              </div>
            </button>
          )}
        </section>

        {/* Calendar Selection (when connected) */}
        {connected && calendars.length > 0 && (
          <>
            <Separator />
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-text-ink">
                取得するカレンダー
              </h3>
              <div className="space-y-2">
                {calendars.map((cal) => (
                  <label
                    key={cal.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/30 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCalendars.includes(cal.id)}
                      onChange={() => handleCalendarToggle(cal.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-neon-accent"
                    />
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cal.backgroundColor }}
                    />
                    <span className="text-sm text-text-ink truncate">
                      {cal.summary}
                      {cal.primary && (
                        <span className="ml-1.5 text-xs text-text-muted">
                          (メイン)
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Today's Events Preview */}
        {(events.length > 0 || connected) && (
          <>
            <Separator />
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-text-ink">
                今日の予定
              </h3>
              <CalendarEventsPreview events={events} eventSource={eventSource} />
            </section>
          </>
        )}

        <Separator />

        {/* Manual Schedule Input */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-text-ink">
            予定を手動入力
          </h3>
          <p className="text-xs text-text-muted">
            Google カレンダー未連携の場合、ここに今日の予定を入力できます
          </p>
          <div className="space-y-2">
            <Label htmlFor="manualSchedule" className="sr-only">
              今日の予定
            </Label>
            <textarea
              id="manualSchedule"
              value={form.manualSchedule}
              onChange={(e) => update("manualSchedule", e.target.value)}
              placeholder="例: 午後3時から会議、夜はディナー"
              rows={3}
              className="w-full rounded-xl bg-white/50 border border-white/80 focus:border-neon-accent px-4 py-3 text-sm text-text-ink outline-none transition-colors resize-none placeholder:text-text-muted/60"
            />
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full h-12 rounded-2xl relative overflow-hidden shadow-neon-glow btn-squishy disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="absolute inset-0 bg-linear-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90" />
          <div className="relative z-10 text-white font-body font-bold tracking-wider flex items-center justify-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : saved ? "保存しました！" : "保存する"}
          </div>
        </button>
      </div>
    </div>
  );
}
