"use client";

import { ChevronUp, ChevronDown, Trash2, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepData {
  area: string;
  item_id: string;
  item_name: string;
  brand: string;
  color_code?: string;
  color_name?: string;
  instruction: string;
}

interface RecipeStepEditorProps {
  step: StepData;
  index: number;
  total: number;
  onChange: (step: StepData) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onPickItem: () => void;
}

const AREAS = ["ベース", "アイ", "チーク", "リップ", "その他"] as const;

export function RecipeStepEditor({
  step,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  onPickItem,
}: RecipeStepEditorProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-ink uppercase tracking-widest">
          STEP {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
            aria-label="上に移動"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
            aria-label="下に移動"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
            aria-label="削除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Area selector */}
      <div>
        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
          部位
        </label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => onChange({ ...step, area })}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all border btn-squishy",
                step.area === area
                  ? "bg-text-ink text-white border-text-ink"
                  : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
              )}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Item selector */}
      <div>
        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
          使用アイテム
        </label>
        <button
          type="button"
          onClick={onPickItem}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left btn-squishy",
            step.item_id
              ? "border-neon-accent/30 bg-neon-accent/5"
              : "border-dashed border-gray-300 hover:border-neon-accent"
          )}
        >
          <Package className="h-5 w-5 text-text-muted flex-shrink-0" />
          {step.item_id ? (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-muted font-bold">{step.brand}</p>
              <p className="text-sm font-bold text-text-ink truncate">{step.item_name}</p>
              {(step.color_code || step.color_name) && (
                <p className="text-[10px] text-neon-accent">
                  {[step.color_code, step.color_name].filter(Boolean).join(" ")}
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-text-muted">タップしてアイテムを選択</span>
          )}
        </button>
      </div>

      {/* Instruction */}
      <div>
        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
          手順メモ
        </label>
        <textarea
          value={step.instruction}
          onChange={(e) => onChange({ ...step, instruction: e.target.value })}
          placeholder="例: まぶた全体に薄く伸ばす"
          rows={2}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}
