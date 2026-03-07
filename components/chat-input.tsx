"use client";

import { useRef } from "react";
import { ArrowUp, ImagePlus, Square, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { CosmePickerChip } from "@/components/cosme-picker-chip";
import type { InventoryItem } from "@/types/inventory";
import type { MatchMode } from "@/types/chat";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string, imageBase64?: string, imageMimeType?: string, selectedItemIds?: string[], matchMode?: MatchMode, brands?: string[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  selectedItems?: InventoryItem[];
  onOpenPicker?: () => void;
  onRemoveItem?: (itemId: string) => void;
  matchMode?: MatchMode;
  selectedBrands?: string[];
  onRemoveBrand?: (brand: string) => void;
  onResetMode?: () => void;
}

export function ChatInput({ value, onChange, onSend, onStop, disabled, isLoading, className, selectedItems, onOpenPicker, onRemoveItem, matchMode = "owned_only", selectedBrands = [], onRemoveBrand, onResetMode }: ChatInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    const itemIds = selectedItems?.length ? selectedItems.map((i) => i.id) : undefined;
    onSend(value.trim(), undefined, undefined, itemIds, matchMode, selectedBrands.length > 0 ? selectedBrands : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      const mimeType = file.type || "image/jpeg";
      onSend(value.trim() || "この画像のコスメを鑑定してください", base64, mimeType);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className={cn("fixed bottom-24 left-4 right-4 z-40", className)}>
      <div className="mx-auto max-w-2xl">
        {/* Summary chips: mode + brands + cosme items */}
        {(selectedItems?.length || matchMode !== "owned_only" || selectedBrands.length > 0) && onRemoveItem && onOpenPicker && (
          <div className="mb-2 px-2">
            <CosmePickerChip
              items={selectedItems || []}
              onRemove={onRemoveItem}
              onAdd={onOpenPicker}
              matchMode={matchMode}
              selectedBrands={selectedBrands}
              onRemoveBrand={onRemoveBrand}
              onResetMode={onResetMode}
            />
          </div>
        )}
        <div className="glass-panel rounded-full p-2 pl-5 flex items-center gap-3 shadow-xl ring-1 ring-white/50">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 text-text-muted hover:text-neon-accent transition-colors"
            aria-label="画像を添付"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          {onOpenPicker && (
            <button
              type="button"
              onClick={onOpenPicker}
              className={cn(
                "shrink-0 transition-colors",
                selectedItems?.length || matchMode !== "owned_only" || selectedBrands.length > 0
                  ? "text-neon-accent"
                  : "text-text-muted hover:text-neon-accent"
              )}
              aria-label="レシピカスタマイズ"
            >
              <Package className="h-5 w-5" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="今日はどんな気分？"
            className="flex-1 bg-transparent border-none focus:outline-none text-text-ink placeholder-text-muted text-base font-body font-medium"
          />

          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-md btn-squishy transition-all bg-red-500 text-white"
              aria-label="生成を停止"
            >
              <Square className="h-4 w-4" fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center shadow-md btn-squishy transition-all",
                value.trim() && !disabled
                  ? "bg-text-ink text-white"
                  : "bg-gray-200 text-gray-400"
              )}
              aria-label="送信"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
