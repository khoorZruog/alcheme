"use client";

import { ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import type { ProfilerCardData, DormantItemData } from "@/types/chat";

const COLOR_MAP: Record<string, string> = {
  "ピンク系": "bg-pink-400",
  "ブラウン系": "bg-amber-700",
  "オレンジ系": "bg-orange-400",
  "レッド系": "bg-red-500",
  "パープル系": "bg-purple-500",
  "ヌード系": "bg-stone-400",
};

const TEXTURE_LABEL: Record<string, string> = {
  "マット": "Matte",
  "ツヤ": "Glow",
  "ラメ/グリッター": "Glitter",
  "シアー": "Sheer",
};

interface ProfilerInsightCardProps {
  data: ProfilerCardData;
  onSelectItemForRecipe?: (itemId: string, itemName: string) => void;
}

function ColorBar({ label, count, maxCount }: { label: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  const bg = COLOR_MAP[label] || "bg-gray-400";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted w-16 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${bg} transition-all duration-500`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
      <span className="text-[10px] text-text-muted w-6 text-right">{count}</span>
    </div>
  );
}

function TextureChip({ label, count }: { label: string; count: number }) {
  const sub = TEXTURE_LABEL[label] || "";
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 border border-gray-100 text-xs font-medium text-text-ink">
      {label}
      {sub && <span className="text-[10px] text-text-muted">{sub}</span>}
      <span className="text-[10px] text-neon-accent font-bold">{count}</span>
    </span>
  );
}

function DormantItemCard({
  item,
  onSelect,
}: {
  item: DormantItemData;
  onSelect?: (itemId: string, itemName: string) => void;
}) {
  const displayName = [item.brand, item.product_name].filter(Boolean).join(" ");
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-gray-100">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-[10px] font-bold text-text-muted border border-gray-200 shrink-0">
        {item.category?.slice(0, 3) || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-ink truncate">{displayName}</p>
        <p className="text-[10px] text-text-muted">{item.item_type || item.category}</p>
      </div>
      {onSelect && (
        <button
          onClick={() => onSelect(item.id, displayName)}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold text-neon-accent bg-neon-accent/10 border border-neon-accent/20 hover:bg-neon-accent/20 transition-colors btn-squishy"
        >
          レシピ
          <ChevronRight size={10} />
        </button>
      )}
    </div>
  );
}

export function ProfilerInsightCard({ data, onSelectItemForRecipe }: ProfilerInsightCardProps) {
  const colorEntries = Object.entries(data.color_preferences)
    .sort(([, a], [, b]) => b - a);
  const maxColor = colorEntries.length > 0 ? colorEntries[0][1] : 0;

  const textureEntries = Object.entries(data.texture_preferences)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="glass-card bg-white/70 rounded-[24px] overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-neon-accent" />
          <h3 className="font-display font-bold text-lg text-text-ink">
            ビューティープロフィール
          </h3>
        </div>
      </div>

      {/* Color Preferences */}
      {colorEntries.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs font-bold text-text-muted mb-2">色の傾向</p>
          <div className="space-y-1.5">
            {colorEntries.map(([label, count]) => (
              <ColorBar key={label} label={label} count={count} maxCount={maxColor} />
            ))}
          </div>
        </div>
      )}

      {/* Texture Preferences */}
      {textureEntries.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs font-bold text-text-muted mb-2">テクスチャ</p>
          <div className="flex flex-wrap gap-2">
            {textureEntries.map(([label, count]) => (
              <TextureChip key={label} label={label} count={count} />
            ))}
          </div>
        </div>
      )}

      {/* Monotony Alert */}
      {data.monotony_alert && (
        <div className="mx-5 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-700">マンネリ注意</p>
              <p className="text-xs text-amber-600 mt-0.5">{data.monotony_alert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dormant Items */}
      {data.underused_items.length > 0 && (
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-text-muted">
              眠っているコスメ
            </p>
            <span className="text-[10px] font-bold text-neon-accent bg-neon-accent/10 px-2 py-0.5 rounded-full">
              {data.underused_items.length}個
            </span>
          </div>
          <div className="space-y-2">
            {data.underused_items.map((item) => (
              <DormantItemCard
                key={item.id}
                item={item}
                onSelect={onSelectItemForRecipe}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
