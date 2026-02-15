"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, backHref, rightElement, className }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 items-center justify-between px-4 bg-alcheme-cream/90 backdrop-blur-sm border-b border-alcheme-sand/50",
        className
      )}
    >
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-alcheme-charcoal hover:text-alcheme-rose transition-colors"
        aria-label="戻る"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <h1 className="font-display text-lg font-semibold text-alcheme-charcoal">
        {title}
      </h1>

      <div className="min-w-[28px] flex justify-end">
        {rightElement ?? <span />}
      </div>
    </header>
  );
}
