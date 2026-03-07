"use client";

import { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";

export function ScoreInfoPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-0.5 text-alcheme-muted hover:text-alcheme-charcoal transition-colors"
        aria-label="再現度について"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 glass-card rounded-2xl p-4 shadow-soft-float border border-white/60 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-display font-bold text-text-ink">
              再現度って？
            </p>
            <button
              onClick={() => setOpen(false)}
              className="p-0.5 text-alcheme-muted hover:text-alcheme-charcoal"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2 text-xs text-text-muted leading-relaxed">
            <p>
              あなたのポーチの中のコスメで、理想のメイクルックをどれだけ忠実に再現できるかを表しています。
            </p>
            <p>
              100%じゃなくても大丈夫！
              AIがプロのテクニックを駆使して、手持ちコスメの新しい魅力を引き出します。
            </p>
            <p className="text-neon-accent font-medium">
              代用テクの詳細はレシピステップで確認できます。
            </p>
          </div>
        </div>
      )}
    </span>
  );
}
