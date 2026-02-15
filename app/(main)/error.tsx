"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Main layout error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-card bg-white/80 backdrop-blur-md p-8 text-center shadow-soft-float border border-white/50">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-alcheme-rose/10 flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-lg font-display font-bold text-alcheme-charcoal mb-2">
          エラーが発生しました
        </h2>
        <p className="text-sm text-alcheme-muted mb-6">
          予期しないエラーが発生しました。もう一度お試しください。
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full rounded-button bg-alcheme-rose px-6 py-3 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
          >
            再試行
          </button>
          <Link
            href="/chat"
            className="text-sm text-alcheme-muted hover:text-alcheme-charcoal transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
