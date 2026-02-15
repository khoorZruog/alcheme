import { cn } from "@/lib/utils";

type Rarity = "SSR" | "SR" | "R" | "N";

const RARITY_CONFIG: Record<Rarity, { bg: string; text: string; border: string }> = {
  SSR: { bg: "bg-amber-400", text: "text-white", border: "border-amber-300" },
  SR:  { bg: "bg-purple-400", text: "text-white", border: "border-purple-300" },
  R:   { bg: "bg-blue-400",  text: "text-white", border: "border-blue-300" },
  N:   { bg: "bg-gray-100",  text: "text-text-muted", border: "border-white" },
};

interface RarityBadgeProps {
  rarity: Rarity;
  showStars?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function RarityBadge({ rarity, size = "sm", className }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-black border backdrop-blur-md shadow-sm",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "px-2.5 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]",
        className
      )}
    >
      {rarity}
    </span>
  );
}
