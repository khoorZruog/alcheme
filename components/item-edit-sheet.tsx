"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Pencil, X } from "lucide-react";
import { PhotoEditSheet } from "@/components/photo-edit-sheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_GROUPS, getItemTypesForGroup, getPaoMonths } from "@/lib/cosme-constants";
import type { InventoryItem, CosmeCategory, CosmeTexture, CosmeStats } from "@/types/inventory";
import type { CatalogEntry } from "@/types/catalog";
import { useCatalogMatch } from "@/hooks/use-catalog-match";
import { CatalogMatchBanner } from "@/components/catalog-match-banner";
import { useBrandSuggestions } from "@/hooks/use-brand-suggestions";
import { useProductSuggestions } from "@/hooks/use-product-suggestions";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { DuplicateWarning, useDuplicateCheck } from "@/components/duplicate-warning";
import { useInventory } from "@/hooks/use-inventory";
import { getStatLabels } from "@/components/stat-bar";

interface ItemEditSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<InventoryItem>) => void;
  /** Skip duplicate check (e.g. appraisal confirm context) */
  skipDuplicateCheck?: boolean;
}

const TEXTURES: CosmeTexture[] = ["マット", "ツヤ", "サテン", "シマー", "クリーム", "パウダー", "リキッド"];
const REMAINING_OPTIONS = ["100%", "90%", "80%", "70%", "60%", "50%", "40%", "30%", "20%", "10%"];
const STAT_SCORES = ["1", "2", "3", "4", "5"];

/** Resize image to fit within a square canvas (letterboxed, white bg) */
function resizeImage(file: File, size: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // White background
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, size, size);

      // Fit image inside square (maintain aspect ratio, centered)
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (size - w) / 2;
      const y = (size - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = url;
  });
}

export function ItemEditSheet({ item, open, onClose, onSave, skipDuplicateCheck }: ItemEditSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [photoEditOpen, setPhotoEditOpen] = useState(false);
  const [photoEditUrl, setPhotoEditUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    category: "" as CosmeCategory,
    item_type: "",
    brand: "",
    product_name: "",
    color_code: "",
    color_name: "",
    color_description: "",
    texture: "" as CosmeTexture,
    estimated_remaining: "",
  });

  const [stats, setStats] = useState<CosmeStats>({
    pigment: 3,
    longevity: 3,
    shelf_life: 3,
    natural_finish: 3,
  });

  useEffect(() => {
    if (item) {
      setForm({
        category: item.category,
        item_type: item.item_type ?? "",
        brand: item.brand,
        product_name: item.product_name,
        color_code: item.color_code ?? "",
        color_name: item.color_name ?? "",
        color_description: item.color_description,
        texture: item.texture,
        estimated_remaining: item.estimated_remaining,
      });
      setImageUrl(item.image_url || item.rakuten_image_url);
      if (item.stats) {
        setStats(item.stats);
      }
    }
  }, [item]);

  const itemTypes = getItemTypesForGroup(form.category);
  const paoMonths = getPaoMonths(form.item_type);

  // Brand & product autocomplete
  const { suggestions: brandSuggestions, isLoading: brandLoading } = useBrandSuggestions(form.brand);
  const { suggestions: productSuggestions, isLoading: productLoading } = useProductSuggestions(form.product_name, form.brand);
  const { items: inventoryItems } = useInventory();

  // Catalog match — auto-check when brand/product_name change
  const { match: catalogMatch, isChecking: catalogChecking } = useCatalogMatch(
    form.brand,
    form.product_name,
    form.color_code,
  );

  // Duplicate check for save button control (skipped during appraisal)
  const duplicateType = useDuplicateCheck(
    form.brand, form.product_name, form.color_code,
    skipDuplicateCheck ? [] : inventoryItems,
    item?.id,
  );
  const isNewItem = !item?.id;
  const isExactDuplicate = duplicateType === "exact";

  const handleCatalogApply = (entry: CatalogEntry) => {
    setForm((prev) => ({
      ...prev,
      category: entry.category ?? prev.category,
      item_type: entry.item_type ?? prev.item_type,
      color_code: entry.color_code ?? prev.color_code,
      color_name: entry.color_name ?? prev.color_name,
      color_description: entry.color_description ?? prev.color_description,
      texture: (entry.texture ?? prev.texture) as CosmeTexture,
    }));
    if (entry.image_url && !imageUrl) {
      setImageUrl(entry.image_url);
    }
  };

  const handleCategoryChange = (cat: CosmeCategory) => {
    const types = getItemTypesForGroup(cat);
    setForm({ ...form, category: cat, item_type: types[0] ?? "" });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 1024);
    setPhotoEditUrl(dataUrl);
    setPhotoEditOpen(true);
    e.target.value = "";
  };

  const handlePhotoEditConfirm = (confirmedUrl: string) => {
    setImageUrl(confirmedUrl);
    setPhotoEditOpen(false);
    setPhotoEditUrl(null);
  };

  const handleSave = () => {
    onSave({
      ...form,
      color_code: form.color_code || undefined,
      color_name: form.color_name || undefined,
      pao_months: paoMonths ?? undefined,
      stats,
      image_url: imageUrl || undefined,
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-card max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">{isNewItem ? "コスメを登録" : "コスメを編集"}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Catalog match banner */}
          <CatalogMatchBanner
            match={catalogMatch}
            isChecking={catalogChecking}
            onApply={handleCatalogApply}
          />

          {/* Duplicate warning — shown at top for visibility */}
          <DuplicateWarning
            brand={form.brand}
            productName={form.product_name}
            colorCode={form.color_code}
            items={inventoryItems}
            editingId={item?.id}
          />

          {/* Image editor */}
          <div className="space-y-1.5">
            <Label className="text-alcheme-charcoal">画像</Label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoEditUrl(imageUrl);
                    setPhotoEditOpen(true);
                  }}
                  className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 group"
                >
                  <img src={imageUrl} alt="プレビュー" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Pencil className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImageUrl(undefined); }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </button>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Camera className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="rounded-input"
              >
                画像を{imageUrl ? "変更" : "追加"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-alcheme-charcoal">カテゴリ</Label>
              <Select value={form.category} onValueChange={(v) => handleCategoryChange(v as CosmeCategory)}>
                <SelectTrigger className="rounded-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_GROUPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-alcheme-charcoal">アイテム種別</Label>
              <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v })}>
                <SelectTrigger className="rounded-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {itemTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {paoMonths != null && (
                <p className="text-[10px] text-text-muted">使用期限目安: 約{paoMonths}ヶ月</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-alcheme-charcoal">ブランド</Label>
            <AutocompleteInput
              value={form.brand}
              onChange={(v) => setForm({ ...form, brand: v })}
              suggestions={brandSuggestions}
              isLoading={brandLoading}
              placeholder="例: KATE, Dior"
              className="rounded-input flex h-9 w-full border border-input bg-transparent px-3 py-1 text-base shadow-sm"
              showSource
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-alcheme-charcoal">商品名</Label>
            <AutocompleteInput
              value={form.product_name}
              onChange={(v) => setForm({ ...form, product_name: v })}
              suggestions={productSuggestions}
              isLoading={productLoading}
              placeholder="例: リップモンスター"
              className="rounded-input flex h-9 w-full border border-input bg-transparent px-3 py-1 text-base shadow-sm"
              showSource
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-alcheme-charcoal">色番号</Label>
              <Input value={form.color_code} onChange={(e) => setForm({ ...form, color_code: e.target.value })} placeholder="例: 03, N20" className="rounded-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-alcheme-charcoal">色名</Label>
              <Input value={form.color_name} onChange={(e) => setForm({ ...form, color_name: e.target.value })} placeholder="例: 陽炎" className="rounded-input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-alcheme-charcoal">色の説明</Label>
            <Input value={form.color_description} onChange={(e) => setForm({ ...form, color_description: e.target.value })} className="rounded-input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-alcheme-charcoal">質感</Label>
              <Select value={form.texture} onValueChange={(v) => setForm({ ...form, texture: v as CosmeTexture })}>
                <SelectTrigger className="rounded-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEXTURES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-alcheme-charcoal">残量</Label>
              <Select value={form.estimated_remaining} onValueChange={(v) => setForm({ ...form, estimated_remaining: v })}>
                <SelectTrigger className="rounded-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REMAINING_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats editing */}
          <div className="space-y-2">
            <Label className="text-alcheme-charcoal">スペック (1〜5)</Label>
            <div className="grid grid-cols-2 gap-3">
              {getStatLabels(form.category).map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs text-alcheme-muted">{label}</p>
                  <Select
                    value={String(stats[key])}
                    onValueChange={(v) => setStats({ ...stats, [key]: Number(v) })}
                  >
                    <SelectTrigger className="rounded-input h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAT_SCORES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isNewItem && isExactDuplicate}
            className="w-full bg-alcheme-rose hover:bg-alcheme-rose/90 text-white rounded-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNewItem ? "My Cosmeに追加" : "変更を保存"}
          </Button>
        </div>
      </SheetContent>

      <PhotoEditSheet
        imageUrl={photoEditUrl}
        open={photoEditOpen}
        onClose={() => { setPhotoEditOpen(false); setPhotoEditUrl(null); }}
        onConfirm={handlePhotoEditConfirm}
      />
    </Sheet>
  );
}
