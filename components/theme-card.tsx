"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import type { ThemeSuggestion } from "@/types/theme";

const THEME_GRADIENTS: Record<string, string> = {
  cute: "from-pink-200/80 via-rose-100/60 to-pink-50/40",
  cool: "from-slate-200/80 via-blue-100/60 to-slate-50/40",
  elegant: "from-amber-100/80 via-yellow-50/60 to-orange-50/40",
};

const THEME_LABELS: Record<string, string> = {
  cute: "Cute",
  cool: "Cool",
  elegant: "Elegant",
};

interface ThemeCardProps {
  theme: ThemeSuggestion;
  isImageLoading: boolean;
}

export function ThemeCard({ theme, isImageLoading }: ThemeCardProps) {
  const gradient =
    THEME_GRADIENTS[theme.character_theme] || THEME_GRADIENTS.cute;
  const label = THEME_LABELS[theme.character_theme] || "Cute";

  return (
    <div className="w-full rounded-3xl overflow-hidden shadow-xl bg-white border border-white/60">
      {/* Image area */}
      <div className={`relative aspect-4/5 bg-gradient-to-br ${gradient}`}>
        {theme.preview_image_url ? (
          <Image
            src={theme.preview_image_url}
            alt={theme.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
          />
        ) : isImageLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-text-muted/50" />
            <p className="text-xs text-text-muted/60">イメージ生成中...</p>
          </div>
        ) : null}

        {/* Theme badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/80 backdrop-blur-sm text-text-ink shadow-sm">
            {label}
          </span>
        </div>
      </div>

      {/* Text area */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-text-ink leading-tight">
          {theme.title}
        </h3>
        <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
          {theme.description}
        </p>
        {theme.style_keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {theme.style_keywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neon-accent/10 text-neon-accent"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
