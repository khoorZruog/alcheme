"use client";

import { Sparkles } from "lucide-react";
import type { CatalogEntry } from "@/types/catalog";

interface CatalogMatchBannerProps {
  match: CatalogEntry | null;
  isChecking: boolean;
  onApply: (entry: CatalogEntry) => void;
}

/**
 * Banner shown when a catalog match is found during product registration.
 * Displays in all 4 registration flows (scan, Rakuten, web search, manual).
 */
export function CatalogMatchBanner({ match, isChecking, onApply }: CatalogMatchBannerProps) {
  if (isChecking) {
    return (
      <div className="glass-card rounded-2xl p-3 flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-neon-accent/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-neon-accent/50" />
        </div>
        <p className="text-xs text-text-muted">カタログを検索中...</p>
      </div>
    );
  }

  if (!match) return null;

  const colorInfo = [match.color_code, match.color_name].filter(Boolean).join(" ");
  const contributorLabel = match.contributor_count > 1
    ? `${match.contributor_count}人が登録`
    : "1人が登録";

  return (
    <button
      type="button"
      onClick={() => onApply(match)}
      className="w-full glass-card rounded-2xl p-3 flex items-center gap-3 text-left hover:bg-white/80 transition border border-neon-accent/20"
    >
      <div className="w-10 h-10 rounded-xl bg-neon-accent/10 flex items-center justify-center shrink-0">
        <Sparkles className="h-5 w-5 text-neon-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neon-accent">
          カタログに登録済みの商品です
        </p>
        <p className="text-sm font-medium text-text-ink truncate">
          {match.brand} {match.product_name}
          {colorInfo && <span className="text-text-muted"> {colorInfo}</span>}
        </p>
        <p className="text-xs text-text-muted">{contributorLabel} · タップで情報を補完</p>
      </div>
      {match.image_url && (
        <img
          src={match.image_url}
          alt=""
          className="w-10 h-10 rounded-lg object-cover shrink-0"
        />
      )}
    </button>
  );
}
