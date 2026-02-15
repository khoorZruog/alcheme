import { cn } from "@/lib/utils";

interface RemainingBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  className?: string;
}

export function RemainingBar({ value, showLabel = true, className }: RemainingBarProps) {
  const color =
    value > 60
      ? "bg-alcheme-success"
      : value > 30
        ? "bg-alcheme-warning"
        : "bg-alcheme-danger";

  const bgColor =
    value > 60
      ? "bg-alcheme-success/20"
      : value > 30
        ? "bg-alcheme-warning/20"
        : "bg-alcheme-danger/20";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("h-1.5 flex-1 rounded-full", bgColor)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-alcheme-muted tabular-nums w-8 text-right">{value}%</span>
      )}
    </div>
  );
}
