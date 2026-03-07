"use client";

import { useState, useMemo, useRef } from "react";
import { Check, X, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CATEGORY_GROUPS, type CategoryGroup } from "@/lib/cosme-constants";
import type { InventoryItem } from "@/types/inventory";
import type { MatchMode } from "@/types/chat";

const MODE_MAP: MatchMode[] = ["owned_only", "prefer_owned", "free"];
// Slider subtexts removed per UX feedback — labels alone are sufficient

interface CosmePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (items: InventoryItem[]) => void;
  items: InventoryItem[];
  initialSelected?: InventoryItem[];
  maxSelection?: number;
  matchMode?: MatchMode;
  onMatchModeChange?: (mode: MatchMode) => void;
  selectedBrands?: string[];
  onBrandsChange?: (brands: string[]) => void;
}

export function CosmePickerSheet({
  open,
  onOpenChange,
  onConfirm,
  items,
  initialSelected = [],
  maxSelection = 5,
  matchMode = "owned_only",
  onMatchModeChange,
  selectedBrands = [],
  onBrandsChange,
}: CosmePickerSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelected.map((i) => i.id))
  );
  const [activeTab, setActiveTab] = useState<CategoryGroup>("ベースメイク");
  const [brandInput, setBrandInput] = useState("");
  const brandInputRef = useRef<HTMLInputElement>(null);

  // Reset selection when sheet opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelected.map((i) => i.id)));
    }
    onOpenChange(isOpen);
  };

  // Extract top 5 brands by item count
  const topBrands = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((i) => {
      if (i.brand) counts.set(i.brand, (counts.get(i.brand) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand]) => brand);
  }, [items]);

  // All inventory brands for autocomplete
  const allBrands = useMemo(() => {
    const brandSet = new Set<string>();
    items.forEach((i) => {
      if (i.brand) brandSet.add(i.brand);
    });
    return Array.from(brandSet).sort();
  }, [items]);

  // Autocomplete suggestions filtered by input
  const brandSuggestions = useMemo(() => {
    if (!brandInput.trim()) return [];
    const query = brandInput.toLowerCase();
    return allBrands
      .filter((b) => b.toLowerCase().includes(query) && !selectedBrands.includes(b))
      .slice(0, 5);
  }, [brandInput, allBrands, selectedBrands]);

  // Filter items by category + brand
  const filtered = useMemo(() => {
    let result = items.filter((i) => i.category === activeTab);
    if (selectedBrands.length > 0) {
      result = result.filter((i) => selectedBrands.includes(i.brand));
    }
    return result;
  }, [items, activeTab, selectedBrands]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxSelection) {
        next.add(id);
      }
      return next;
    });
  };

  const toggleBrand = (brand: string) => {
    if (!onBrandsChange) return;
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    onBrandsChange(next);
  };

  const addBrandFromInput = (brand: string) => {
    const trimmed = brand.trim();
    if (!trimmed || !onBrandsChange) return;
    if (!selectedBrands.includes(trimmed)) {
      onBrandsChange([...selectedBrands, trimmed]);
    }
    setBrandInput("");
  };

  const sliderValue = MODE_MAP.indexOf(matchMode);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    onMatchModeChange?.(MODE_MAP[idx]);
  };

  const handleConfirm = () => {
    const selected = items.filter((i) => selectedIds.has(i.id));
    onConfirm(selected);
    onOpenChange(false);
  };

  // Allow confirm even with 0 items (mode/brand-only customization)
  const hasAnyCustomization =
    selectedIds.size > 0 || matchMode !== "owned_only" || selectedBrands.length > 0;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-6 pt-4 h-[85vh] flex flex-col">
        <SheetHeader className="px-6 mb-2">
          <div className="mx-auto w-10 h-1 rounded-full bg-gray-300 mb-3" />
          <SheetTitle className="text-center text-base font-bold text-text-ink">
            レシピカスタマイズ
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {/* Recipe style slider */}
          {onMatchModeChange && (
            <section className="px-2">
              <div className="flex justify-between text-[11px] font-bold text-text-muted mb-2">
                <span>手持ちコスメ活用</span>
                <span>新しい自分発見</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={sliderValue}
                onChange={handleSliderChange}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-neon-accent bg-gray-200
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-accent [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
              />
            </section>
          )}

          {/* Brand filter */}
          {onBrandsChange && (
            <section>
              <h3 className="text-xs font-bold text-text-muted px-2 mb-2">
                ブランド指定（任意）
              </h3>

              {/* Top brands quick chips */}
              {topBrands.length > 0 && (
                <div className="flex gap-1.5 flex-wrap px-2 mb-2">
                  {topBrands.map((brand) => {
                    const isActive = selectedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleBrand(brand)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border",
                          isActive
                            ? "bg-neon-accent/15 border-neon-accent/40 text-text-ink"
                            : "bg-white/60 border-gray-200 text-text-muted hover:border-neon-accent/30"
                        )}
                      >
                        {isActive && <span className="mr-0.5">✓ </span>}
                        {brand}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Brand text input */}
              <div className="relative px-2">
                <div className="flex items-center gap-2 bg-white/60 border border-gray-200 rounded-full px-3 py-1.5">
                  <Search size={14} className="text-text-muted shrink-0" />
                  <input
                    ref={brandInputRef}
                    type="text"
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (brandSuggestions.length > 0) {
                          addBrandFromInput(brandSuggestions[0]);
                        } else if (brandInput.trim()) {
                          addBrandFromInput(brandInput);
                        }
                      }
                    }}
                    placeholder="他のブランド名を入力..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-xs text-text-ink placeholder-text-muted"
                  />
                </div>

                {/* Autocomplete dropdown */}
                {brandSuggestions.length > 0 && (
                  <div className="absolute left-2 right-2 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                    {brandSuggestions.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => addBrandFromInput(brand)}
                        className="w-full text-left px-3 py-2 text-xs text-text-ink hover:bg-gray-50 transition-colors"
                      >
                        {brand}
                        {allBrands.includes(brand) && (
                          <span className="ml-1.5 text-[10px] text-text-muted">手持ち</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected brands display */}
              {selectedBrands.length > 0 && (
                <div className="flex gap-1.5 flex-wrap px-2 mt-2">
                  {selectedBrands.map((brand) => (
                    <span
                      key={`sel-${brand}`}
                      className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-700"
                    >
                      {brand}
                      <button
                        type="button"
                        onClick={() => toggleBrand(brand)}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Cosme selection section */}
          <section>
            <h3 className="text-xs font-bold text-text-muted px-2 mb-2">
              使いたいコスメ（最大{maxSelection}個・{selectedIds.size}/{maxSelection}）
            </h3>

            {/* Category tabs */}
            <div className="flex gap-1 px-2 overflow-x-auto hide-scrollbar mb-3">
              {CATEGORY_GROUPS.map((cat) => {
                const count = items.filter((i) => i.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                      activeTab === cat
                        ? "bg-neon-accent text-white"
                        : "bg-white/60 text-text-muted border border-white/80"
                    )}
                  >
                    {cat}
                    <span className="ml-1 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Item list */}
            <div className="space-y-1">
              {filtered.length === 0 && (
                <p className="text-sm text-text-muted text-center py-6">
                  {selectedBrands.length > 0
                    ? "選択ブランドのアイテムがありません"
                    : "このカテゴリにアイテムがありません"}
                </p>
              )}
              {filtered.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const isDisabled = !isSelected && selectedIds.size >= maxSelection;
                return (
                  <button
                    key={item.id}
                    onClick={() => !isDisabled && toggleItem(item.id)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      isSelected
                        ? "bg-neon-accent/10 border border-neon-accent/30"
                        : "bg-white/40 border border-transparent hover:bg-white/60",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {/* Image */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          {item.item_type.slice(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text-muted truncate">{item.brand}</div>
                      <div className="text-sm font-medium text-text-ink truncate">
                        {item.product_name}
                      </div>
                      {item.color_name && (
                        <div className="text-[10px] text-text-muted truncate">
                          {item.color_name}
                        </div>
                      )}
                    </div>

                    {/* Check */}
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                        isSelected
                          ? "bg-neon-accent text-white"
                          : "border-2 border-gray-200"
                      )}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Confirm button */}
        <div className="px-6 pt-3">
          <button
            onClick={handleConfirm}
            className={cn(
              "w-full py-3 rounded-full font-bold text-sm transition-all btn-squishy",
              hasAnyCustomization
                ? "bg-neon-accent text-white shadow-md"
                : "bg-neon-accent text-white shadow-md"
            )}
          >
            {selectedIds.size > 0
              ? `${selectedIds.size}個のコスメで決定`
              : "決定"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
