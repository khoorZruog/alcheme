"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_GROUPS,
  getItemTypesForGroup,
  getPaoMonths,
} from "@/lib/cosme-constants";
import type { CosmeCategory, CosmeTexture, CosmeStats } from "@/types/inventory";

const TEXTURES: CosmeTexture[] = [
  "マット", "ツヤ", "サテン", "シマー", "クリーム", "パウダー", "リキッド",
];
const REMAINING_OPTIONS = [
  "100%", "90%", "80%", "70%", "60%", "50%", "40%", "30%", "20%", "10%",
];
const STAT_SCORES = ["1", "2", "3", "4", "5"];
const STAT_LABELS: { key: keyof CosmeStats; label: string }[] = [
  { key: "pigment", label: "発色力" },
  { key: "longevity", label: "持続力" },
  { key: "shelf_life", label: "コスパ" },
  { key: "natural_finish", label: "ナチュラル" },
];

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
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, size, size);
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

export default function ManualAddPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    category: "" as CosmeCategory,
    item_type: "",
    brand: "",
    product_name: "",
    color_code: "",
    color_name: "",
    color_description: "",
    texture: "" as CosmeTexture,
    estimated_remaining: "100%",
  });

  const [stats, setStats] = useState<CosmeStats>({
    pigment: 3,
    longevity: 3,
    shelf_life: 3,
    natural_finish: 3,
  });

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

  const canSave =
    form.category && form.brand && form.product_name && form.texture;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);

    try {
      const item = {
        ...form,
        color_code: form.color_code || undefined,
        color_name: form.color_name || undefined,
        pao_months: paoMonths ?? undefined,
        stats,
        image_url: imageUrl || undefined,
        confidence: "high",
        source: "手動登録",
      };

      const res = await fetch("/api/inventory/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [item] }),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("コスメを登録しました！");
      router.push("/inventory");
    } catch {
      toast.error("登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="手動で登録" backHref="/inventory" />

      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Image */}
        <div className="space-y-1.5">
          <Label className="text-text-ink">画像</Label>
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                <img
                  src={imageUrl}
                  alt="プレビュー"
                  className="w-full h-full object-contain"
                />
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

        {/* Category + Item Type */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-text-ink">
              カテゴリ <span className="text-red-400">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => handleCategoryChange(v as CosmeCategory)}
            >
              <SelectTrigger className="rounded-input">
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_GROUPS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-text-ink">アイテム種別</Label>
            <Select
              value={form.item_type}
              onValueChange={(v) => setForm({ ...form, item_type: v })}
            >
              <SelectTrigger className="rounded-input">
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {paoMonths != null && (
              <p className="text-[10px] text-text-muted">
                使用期限目安: 約{paoMonths}ヶ月
              </p>
            )}
          </div>
        </div>

        {/* Brand + Product Name */}
        <div className="space-y-1.5">
          <Label className="text-text-ink">
            ブランド <span className="text-red-400">*</span>
          </Label>
          <Input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="例: KATE, Dior"
            className="rounded-input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-text-ink">
            商品名 <span className="text-red-400">*</span>
          </Label>
          <Input
            value={form.product_name}
            onChange={(e) =>
              setForm({ ...form, product_name: e.target.value })
            }
            placeholder="例: リップモンスター"
            className="rounded-input"
          />
        </div>

        {/* Color */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-text-ink">色番号</Label>
            <Input
              value={form.color_code}
              onChange={(e) =>
                setForm({ ...form, color_code: e.target.value })
              }
              placeholder="例: 03, N20"
              className="rounded-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-text-ink">色名</Label>
            <Input
              value={form.color_name}
              onChange={(e) =>
                setForm({ ...form, color_name: e.target.value })
              }
              placeholder="例: 陽炎"
              className="rounded-input"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-text-ink">色の説明</Label>
          <Input
            value={form.color_description}
            onChange={(e) =>
              setForm({ ...form, color_description: e.target.value })
            }
            placeholder="例: 深みのあるレッド"
            className="rounded-input"
          />
        </div>

        {/* Texture + Remaining */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-text-ink">
              質感 <span className="text-red-400">*</span>
            </Label>
            <Select
              value={form.texture}
              onValueChange={(v) =>
                setForm({ ...form, texture: v as CosmeTexture })
              }
            >
              <SelectTrigger className="rounded-input">
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent>
                {TEXTURES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-text-ink">残量</Label>
            <Select
              value={form.estimated_remaining}
              onValueChange={(v) =>
                setForm({ ...form, estimated_remaining: v })
              }
            >
              <SelectTrigger className="rounded-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMAINING_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <Label className="text-text-ink">スペック (1〜5)</Label>
          <div className="grid grid-cols-2 gap-3">
            {STAT_LABELS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-text-muted">{label}</p>
                <Select
                  value={String(stats[key])}
                  onValueChange={(v) =>
                    setStats({ ...stats, [key]: Number(v) })
                  }
                >
                  <SelectTrigger className="rounded-input h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAT_SCORES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="btn-squishy w-full h-14 rounded-2xl relative overflow-hidden shadow-neon-glow group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 text-white font-body font-bold tracking-wider text-lg">
              {saving ? "登録中..." : "登録する"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
