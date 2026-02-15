"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, BookOpen, CloudSun } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DetailSkeleton } from "@/components/loading-skeleton";
import { BeautyLogForm } from "@/components/beauty-log-form";
import { useBeautyLogEntry } from "@/hooks/use-beauty-log";

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

export default function BeautyLogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = use(params);
  const { log, isLoading, error, mutate, deleteLog } = useBeautyLogEntry(logId);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteLog();
    router.push("/beauty-log");
  };

  if (isEditing && log) {
    return (
      <div>
        <PageHeader title="ログを編集" backHref={`/beauty-log/${logId}`} />
        <BeautyLogForm
          initialData={log}
          onSave={() => {
            setIsEditing(false);
            mutate();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const dateObj = log ? new Date(log.date + "T00:00:00") : null;
  const dayNumber = dateObj?.getDate();
  const monthYear = dateObj?.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });
  const weekday = dateObj?.toLocaleDateString("ja-JP", { weekday: "long" });

  return (
    <div>
      <PageHeader
        title="メイク日記"
        backHref="/beauty-log"
        rightElement={
          log ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-alcheme-muted hover:text-alcheme-charcoal transition-colors"
                aria-label="編集"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-alcheme-muted hover:text-red-500 transition-colors"
                aria-label="削除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : undefined
        }
      />

      {error ? (
        <div className="p-8 text-center">
          <p className="text-sm text-alcheme-muted mb-3">
            {(error as { status?: number })?.status === 404
              ? "ログが見つかりません"
              : "ログの読み込みに失敗しました"}
          </p>
          <Link href="/beauty-log">
            <button className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors">
              ログ一覧に戻る
            </button>
          </Link>
        </div>
      ) : isLoading ? (
        <DetailSkeleton />
      ) : !log ? (
        <div className="p-8 text-center">
          <p className="text-sm text-alcheme-muted">ログが見つかりません</p>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-5">
          {/* Hero Header */}
          <div className="text-center space-y-1">
            <p className="text-xs text-alcheme-muted uppercase tracking-widest">{monthYear}</p>
            <p className="text-5xl font-display font-bold text-text-ink">{dayNumber}</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-text-muted">{weekday}</span>
              {log.weather && (
                <span className="text-lg">{WEATHER_EMOJI[log.weather] ?? ""}</span>
              )}
              {log.mood && (
                <span className="text-lg">{MOOD_EMOJI[log.mood] ?? "💄"}</span>
              )}
            </div>
            {/* Star rating */}
            {log.self_rating && (
              <div className="pt-1">
                <span className="text-2xl text-alcheme-gold tracking-wider">
                  {"★".repeat(log.self_rating)}
                  {"☆".repeat(5 - log.self_rating)}
                </span>
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          {log.photos && log.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {log.photos.map((photo, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-48 h-48 rounded-2xl overflow-hidden"
                >
                  <img
                    src={photo}
                    alt={`写真 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Recipe Card */}
          {log.recipe_name && (
            <Link
              href={log.recipe_id ? `/recipes/${log.recipe_id}` : "#"}
              className={log.recipe_id ? "" : "pointer-events-none"}
            >
              <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {log.preview_image_url && (
                  <img
                    src={log.preview_image_url}
                    alt=""
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-alcheme-gold flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-alcheme-muted uppercase tracking-widest">使用レシピ</p>
                    <p className="text-sm font-bold text-text-ink truncate">{log.recipe_name}</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Context Badges */}
          {(log.mood || log.occasion || log.weather) && (
            <div className="flex flex-wrap gap-2">
              {log.mood && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 text-sm text-alcheme-rose">
                  {MOOD_EMOJI[log.mood] ?? "💄"} {log.mood}
                </span>
              )}
              {log.occasion && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-sm text-purple-600">
                  🏷️ {log.occasion}
                </span>
              )}
              {log.weather && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-sm text-blue-600">
                  <CloudSun className="h-3.5 w-3.5" /> {log.weather}
                </span>
              )}
            </div>
          )}

          {/* User Note */}
          {log.user_note && (
            <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-4">
              <p className="text-sm text-text-ink whitespace-pre-wrap leading-relaxed">
                {log.user_note}
              </p>
            </div>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-center space-y-3">
              <p className="text-sm text-alcheme-charcoal">
                このログを削除しますか？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-button border border-gray-200 px-4 py-2 text-sm text-alcheme-charcoal hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-button bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                >
                  削除する
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
