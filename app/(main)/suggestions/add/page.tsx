"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const CATEGORIES = ["ベースメイク", "アイメイク", "リップ", "スキンケア", "その他"] as const;

export default function SuggestionsAddPage() {
  const router = useRouter();

  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [colorName, setColorName] = useState("");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!brand.trim() || !productName.trim()) {
      toast.error("ブランド名と商品名は必須です");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        brand: brand.trim(),
        product_name: productName.trim(),
        source: "manual",
        reason: reason.trim() || "手動追加",
      };
      if (colorCode.trim()) body.color_code = colorCode.trim();
      if (colorName.trim()) body.color_name = colorName.trim();
      if (category) body.category = category;
      if (priceRange.trim()) body.price_range = priceRange.trim();
      if (imageUrl.trim()) body.image_url = imageUrl.trim();

      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success("買い足し候補に追加しました！");
      router.push("/suggestions");
    } catch {
      toast.error("追加に失敗しました");
      setSaving(false);
    }
  }, [brand, productName, colorCode, colorName, category, priceRange, imageUrl, reason, router]);

  return (
    <div className="min-h-full pb-32">
      <PageHeader title="候補を追加" backHref="/suggestions" />

      <div className="px-4 py-4 space-y-5">
        {/* Brand */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            ブランド名 *
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="例: ADDICTION"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none"
          />
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            商品名 *
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="例: ザ アイシャドウ"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none"
          />
        </div>

        {/* Color */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
              品番
            </label>
            <input
              type="text"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
              placeholder="例: 092"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
              色名
            </label>
            <input
              type="text"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              placeholder="例: マリアージュ"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? "" : cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all border btn-squishy",
                  category === cat
                    ? "bg-text-ink text-white border-text-ink"
                    : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            価格帯
          </label>
          <input
            type="text"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            placeholder="例: ¥2,000〜¥3,000"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            画像URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none"
          />
          {imageUrl && (
            <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden">
              <img src={imageUrl} alt="プレビュー" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            メモ / 理由
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例: SNSで話題のアイシャドウ。ブルベ冬に合いそう"
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
        <button
          onClick={handleSave}
          disabled={saving || !brand.trim() || !productName.trim()}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-neon-accent to-magic-pink text-sm font-bold text-white shadow-lg btn-squishy disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          追加する
        </button>
      </div>
    </div>
  );
}
