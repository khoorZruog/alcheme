"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { ItemEditSheet } from "@/components/item-edit-sheet";
import type { InventoryItem, RakutenCandidate } from "@/types/inventory";

export default function RakutenSearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<RakutenCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim() || searching) return;
    setSearching(true);
    setSearched(false);
    setSelectedIndex(null);

    try {
      const res = await fetch("/api/inventory/search/rakuten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results ?? []);
      } else {
        toast.error(data.error || "検索に失敗しました");
        setResults([]);
      }
    } catch {
      toast.error("通信エラーが発生しました");
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    const candidate = results[index];

    // Build partial InventoryItem from Rakuten data
    const item: InventoryItem = {
      id: "",
      category: "" as InventoryItem["category"],
      item_type: "",
      brand: "",
      product_name: candidate.name,
      color_code: candidate.color_code,
      color_name: candidate.color_name,
      color_description: "",
      texture: "" as InventoryItem["texture"],
      estimated_remaining: "100%",
      confidence: "high",
      source: "楽天API検索",
      price: candidate.price,
      product_url: candidate.url,
      rakuten_image_url: candidate.image_url,
      image_url: candidate.image_url,
      created_at: "",
      updated_at: "",
    };
    setEditItem(item);
    setEditOpen(true);
  };

  const handleSave = async (updates: Partial<InventoryItem>) => {
    if (!editItem) return;
    const item = { ...editItem, ...updates };

    try {
      const res = await fetch("/api/inventory/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [item] }),
      });
      if (!res.ok) throw new Error();
      toast.success("コスメを登録しました！");
      router.push("/inventory");
    } catch {
      toast.error("登録に失敗しました");
    }
  };

  return (
    <div>
      <PageHeader title="楽天で検索" backHref="/inventory" />

      <div className="px-4 py-4 space-y-4">
        {/* Search form */}
        <div className="flex gap-2">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="ブランド名、商品名で検索..."
            className="rounded-full bg-white/50 border-white/80 focus:border-neon-accent flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={!keyword.trim() || searching}
            className="w-12 h-10 rounded-full bg-neon-accent text-white flex items-center justify-center shadow-lg btn-squishy disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Results */}
        {searching && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 text-neon-accent animate-spin mx-auto" />
              <p className="text-sm text-text-muted">楽天で検索中...</p>
            </div>
          </div>
        )}

        {!searching && searched && results.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted">
              検索結果が見つかりませんでした
            </p>
            <p className="text-xs text-text-muted mt-1">
              キーワードを変えて再度お試しください
            </p>
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              {results.length}件の結果 — タップして登録
            </p>
            {results.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full glass-card rounded-2xl p-3 flex gap-3 text-left hover:bg-white/80 transition btn-squishy ${
                  selectedIndex === i
                    ? "ring-2 ring-neon-accent border-neon-accent"
                    : ""
                }`}
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                      No Image
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-text-ink line-clamp-2 leading-tight">
                    {item.name}
                  </p>
                  {(item.color_code || item.color_name) && (
                    <p className="text-xs text-text-muted">
                      {[item.color_code, item.color_name]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="font-medium text-text-ink">
                      ¥{item.price.toLocaleString()}
                    </span>
                    {(item.review_average ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {item.review_average}
                        {(item.review_count ?? 0) > 0 && (
                          <span className="text-text-muted">
                            ({item.review_count})
                          </span>
                        )}
                      </span>
                    )}
                    <span className="truncate">{item.shop}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Sheet for completing item details */}
      <ItemEditSheet
        item={editItem}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
