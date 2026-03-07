"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickActionSheet } from "@/components/quick-action-sheet";

export function FabButton() {
  const [open, setOpen] = useState(false);

  const handleTap = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleTap}
        className="fixed bottom-24 right-6 z-50 flex items-center justify-center w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-neon-accent/90 to-magic-pink/90 text-white shadow-lg shadow-neon-glow btn-squishy transition-all active:scale-95 after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-b after:from-white/25 after:to-transparent after:pointer-events-none"
        aria-label="クイックアクション"
      >
        <Plus size={26} strokeWidth={2.5} className="relative z-10" />
      </button>

      <QuickActionSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
