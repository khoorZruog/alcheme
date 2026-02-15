"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { BeautyLogEntry } from "@/types/beauty-log";

const MOOD_EMOJI: Record<string, string> = {
  元気: "😊",
  落ち着き: "😌",
  ウキウキ: "🥰",
  疲れ: "😤",
};

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <span className="text-xs text-alcheme-gold">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export function BeautyLogCard({ log }: { log: BeautyLogEntry }) {
  const dateLabel = new Date(log.date + "T00:00:00").toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Link href={`/beauty-log/${log.id}`}>
      <Card className="hover:shadow-card-hover transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-alcheme-charcoal">
                  {dateLabel}
                </span>
                {log.mood && (
                  <span className="text-sm">{MOOD_EMOJI[log.mood] ?? "💄"}</span>
                )}
                <StarRating rating={log.self_rating} />
              </div>

              {log.recipe_name && (
                <p className="text-xs text-alcheme-muted line-clamp-1">
                  {log.recipe_name}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1">
                {log.occasion && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-alcheme-rose/10 text-alcheme-rose">
                    {log.occasion}
                  </span>
                )}
                {log.weather && (
                  <span className="text-[10px] text-alcheme-muted">
                    {log.weather}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-alcheme-muted shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
