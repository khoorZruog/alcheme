"use client";

import { Package, CheckSquare, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuggestedItem } from "@/types/suggestion";

interface SuggestionListItemProps {
  item: SuggestedItem;
  onClick: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function SuggestionListItem({
  item,
  onClick,
  selectionMode,
  selected,
  onToggleSelect,
}: SuggestionListItemProps) {
  return (
    <button
      onClick={selectionMode ? onToggleSelect : onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow text-left",
        selected && "ring-2 ring-neon-accent"
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="flex-shrink-0">
          <div className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            selected ? "bg-neon-accent border-neon-accent" : "border-gray-300 bg-white"
          )}>
            {selected && <CheckSquare className="h-3 w-3 text-white" />}
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-5 w-5 text-black/10" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider truncate">
          {item.brand}
        </p>
        <p className="text-sm font-medium text-text-ink truncate">
          {item.product_name}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
          {(item.color_code || item.color_name) && (
            <span className="truncate">
              {item.color_code && <span className="font-bold text-neon-accent">#{item.color_code}</span>}
              {item.color_code && item.color_name && " "}
              {item.color_name}
            </span>
          )}
          {item.price_range && <span>{item.price_range}</span>}
          {item.source === "manual" && (
            <span className="flex items-center gap-0.5 text-neon-accent">
              <PenLine className="h-2.5 w-2.5" />手動
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold",
          item.status === "候補" && "bg-blue-100 text-blue-700",
          item.status === "購入済み" && "bg-green-100 text-green-700",
          item.status === "見送り" && "bg-gray-100 text-gray-600",
        )}>
          {item.status}
        </span>
        {item.recommendation_count > 1 && (
          <span className="text-[10px] font-bold text-neon-accent">
            x{item.recommendation_count}
          </span>
        )}
      </div>
    </button>
  );
}
