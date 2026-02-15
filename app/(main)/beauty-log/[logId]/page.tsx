"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DetailSkeleton } from "@/components/loading-skeleton";
import { BeautyLogForm } from "@/components/beauty-log-form";
import { Card, CardContent } from "@/components/ui/card";
import { useBeautyLogEntry } from "@/hooks/use-beauty-log";

const MOOD_EMOJI: Record<string, string> = {
  元気: "😊",
  落ち着き: "😌",
  ウキウキ: "🥰",
  疲れ: "😤",
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

  const dateLabel = log
    ? new Date(log.date + "T00:00:00").toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    : "";

  return (
    <div>
      <PageHeader
        title="Beauty Log"
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
        <div className="px-4 py-4 space-y-4">
          {/* Date & Rating */}
          <Card>
            <CardContent className="p-4">
              <h2 className="text-base font-medium text-alcheme-charcoal mb-2">
                {dateLabel}
              </h2>
              {log.self_rating && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-alcheme-muted">満足度</span>
                  <span className="text-lg text-alcheme-gold">
                    {"★".repeat(log.self_rating)}
                    {"☆".repeat(5 - log.self_rating)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipe */}
          {log.recipe_name && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-alcheme-gold" />
                  <span className="text-xs text-alcheme-muted">使用レシピ</span>
                </div>
                {log.recipe_id ? (
                  <Link
                    href={`/recipes/${log.recipe_id}`}
                    className="text-sm font-medium text-alcheme-rose hover:underline"
                  >
                    {log.recipe_name}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-alcheme-charcoal">
                    {log.recipe_name}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Context (mood, occasion, weather) */}
          {(log.mood || log.occasion || log.weather) && (
            <Card>
              <CardContent className="p-4 space-y-2">
                {log.mood && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{MOOD_EMOJI[log.mood] ?? "💄"}</span>
                    <span className="text-sm text-alcheme-charcoal">{log.mood}</span>
                  </div>
                )}
                {log.occasion && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏷️</span>
                    <span className="text-sm text-alcheme-charcoal">{log.occasion}</span>
                  </div>
                )}
                {log.weather && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🌤️</span>
                    <span className="text-sm text-alcheme-charcoal">{log.weather}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* User note */}
          {log.user_note && (
            <Card>
              <CardContent className="p-4">
                <span className="text-xs text-alcheme-muted block mb-1">メモ</span>
                <p className="text-sm text-alcheme-charcoal whitespace-pre-wrap">
                  {log.user_note}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <Card className="border-red-200">
              <CardContent className="p-4 text-center space-y-3">
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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
