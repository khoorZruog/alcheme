import { cn } from "@/lib/utils";
import type { CosmeCategory } from "@/types/inventory";

const CATEGORY_CONFIG: Record<CosmeCategory, { bg: string; text: string }> = {
  "ベースメイク": { bg: "bg-amber-100", text: "text-amber-700" },
  "アイメイク":   { bg: "bg-purple-100", text: "text-purple-700" },
  "リップ":       { bg: "bg-rose-100", text: "text-rose-700" },
  "スキンケア":   { bg: "bg-teal-100", text: "text-teal-700" },
  "その他":       { bg: "bg-gray-100", text: "text-gray-600" },
};

const CATEGORY_BORDER: Record<CosmeCategory, string> = {
  "ベースメイク": "border-l-amber-300",
  "アイメイク":   "border-l-purple-400",
  "リップ":       "border-l-rose-400",
  "スキンケア":   "border-l-teal-400",
  "その他":       "border-l-gray-300",
};

interface CategoryBadgeProps {
  category: CosmeCategory;
  size?: "sm" | "md";
  className?: string;
}

export function CategoryBadge({ category, size = "sm", className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["その他"];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold",
        config.bg,
        config.text,
        size === "sm" ? "px-2.5 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]",
        className
      )}
    >
      {category}
    </span>
  );
}

export function getCategoryBorderClass(category: CosmeCategory): string {
  return CATEGORY_BORDER[category] ?? CATEGORY_BORDER["その他"];
}
