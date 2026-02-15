"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_GROUPS, getItemTypesForGroup, getPaoMonths } from "@/lib/cosme-constants";
import type { InventoryItem, CosmeCategory, CosmeTexture, CosmeStats } from "@/types/inventory";

interface ItemEditSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<InventoryItem>) => void;
}

const TEXTURES: CosmeTexture[] = ["マット", "ツヤ", "サテン", "シマー", "クリーム", "パウダー", "リキッド"];
const REMAINING_OPTIONS = ["100%", "90%", "80%", "70%", "60%", "50%", "40%", "30%", "20%", "10%"];
const STAT_SCORES = ["1", "2", "3", "4", "5"];
const STAT_LABELS: { key: keyof CosmeStats; label: string }[] = [
  { key: "pigment", label: "発色力" },
  { key: "longevity", label: "持続力" },
  { key: "shelf_life", label: "コスパ" },
  { key: "natural_finish", label: "ナチュラル" },
];

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

export function ItemEditSheet({ item, open, onClose, onSave }: ItemEditSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

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

  const handleCategoryChange = (cat: CosmeCategory) => {
    const types = getItemTypesForGroup(cat);
    setForm({ ...form, category: cat, item_type: types[0] ?? "" });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 1024);
    setImageUrl(dataUrl);
    e.target.value = "";
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
          <SheetTitle className="font-display">アイテムを修正</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Image editor */}
          <div className="space-y-1.5">
            <Label className="text-alcheme-charcoal">画像</Label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img src={imageUrl} alt="プレビュー" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setImageUrl(undefined)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
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
            <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="rounded-input" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-alcheme-charcoal">商品名</Label>
            <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} className="rounded-input" />
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
              {STAT_LABELS.map(({ key, label }) => (
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

          <Button onClick={handleSave} className="w-full bg-alcheme-rose hover:bg-alcheme-rose/90 text-white rounded-button">
            保存
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
