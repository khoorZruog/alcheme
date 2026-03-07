"use client";

import { X, Plus } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";
import type { MatchMode } from "@/types/chat";

const MODE_LABELS: Record<MatchMode, string | null> = {
  owned_only: null, // default — no chip shown
  prefer_owned: "もっと理想に近づける",
  free: "新しい自分発見",
};

interface CosmePickerChipProps {
  items: InventoryItem[];
  onRemove: (itemId: string) => void;
  onAdd: () => void;
  matchMode?: MatchMode;
  selectedBrands?: string[];
  onRemoveBrand?: (brand: string) => void;
  onResetMode?: () => void;
}

export function CosmePickerChip({
  items,
  onRemove,
  onAdd,
  matchMode = "owned_only",
  selectedBrands = [],
  onRemoveBrand,
  onResetMode,
}: CosmePickerChipProps) {
  const modeLabel = MODE_LABELS[matchMode];
  const hasAnything = items.length > 0 || modeLabel || selectedBrands.length > 0;

  if (!hasAnything) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-1">
      {/* Mode chip (non-default only) */}
      {modeLabel && (
        <span className="shrink-0 inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-purple-100 border border-purple-200 text-xs font-medium text-purple-700">
          <span className="truncate max-w-[140px]">{modeLabel}</span>
          {onResetMode && (
            <button
              type="button"
              onClick={onResetMode}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-purple-200 transition-colors"
              aria-label="モードをリセット"
            >
              <X size={10} />
            </button>
          )}
        </span>
      )}

      {/* Brand chips */}
      {selectedBrands.map((brand) => (
        <span
          key={`brand-${brand}`}
          className="shrink-0 inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700"
        >
          <span className="truncate max-w-[100px]">{brand}</span>
          {onRemoveBrand && (
            <button
              type="button"
              onClick={() => onRemoveBrand(brand)}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors"
              aria-label={`${brand}を削除`}
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}

      {/* Cosme item chips */}
      {items.map((item) => (
        <span
          key={item.id}
          className="shrink-0 inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-neon-accent/10 border border-neon-accent/20 text-xs font-medium text-text-ink"
        >
          <span className="truncate max-w-[120px]">
            {item.brand} {item.product_name}
          </span>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-neon-accent/20 transition-colors"
            aria-label={`${item.product_name}を削除`}
          >
            <X size={10} />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white/60 border border-white/80 text-text-muted hover:text-neon-accent hover:border-neon-accent/30 transition-all"
        aria-label="コスメを追加"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
