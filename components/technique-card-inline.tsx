"use client";

import { Wand2, ArrowRight, Lightbulb } from "lucide-react";
import type { TechniqueCardData } from "@/types/chat";

interface TechniqueCardInlineProps {
  data: TechniqueCardData;
  className?: string;
}

export function TechniqueCardInline({ data, className }: TechniqueCardInlineProps) {
  return (
    <div className={`glass-card bg-linear-to-br from-white/70 to-neon-accent/5 rounded-[20px] overflow-hidden border border-white shadow-soft-float p-4 ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="h-4 w-4 text-neon-accent" />
        <h4 className="text-sm font-bold text-text-ink">{data.title || "代用テクニック"}</h4>
      </div>

      {/* Item swap */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-white/50 border border-white">
        <span className="text-xs font-medium text-text-ink truncate">{data.original_item}</span>
        <ArrowRight className="h-3 w-3 text-neon-accent shrink-0" />
        <span className="text-xs font-bold text-neon-accent truncate">{data.substitute_item}</span>
      </div>

      {/* Technique steps */}
      {data.techniques.length > 0 && (
        <div className="space-y-2 mb-3">
          {data.techniques.map((tech, i) => (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-neon-accent/10 text-neon-accent text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-xs text-text-ink leading-relaxed">{tech}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {data.general_tips.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-white/50">
          {data.general_tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Lightbulb className="h-3 w-3 text-alcheme-gold shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-muted leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
