"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { ItemEditSheet } from "@/components/item-edit-sheet";
import type { InventoryItem } from "@/types/inventory";

interface WebSearchResult {
  brand?: string;
  product_name?: string;
  color_code?: string;
  color_name?: string;
  confidence?: string;
  price_range?: string;
  product_url?: string;
  search_evidence?: string;
  reason?: string;
}

export default function WebSearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<WebSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim() || searching) return;
    setSearching(true);
    setSearched(false);

    try {
      const res = await fetch("/api/inventory/search/web", {
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
      toast.error("通信エラーが発生しました。エージェントサーバーが起動しているか確認してください。");
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const handleSelect = async (result: WebSearchResult) => {
    const item: InventoryItem = {
      id: "",
      category: "" as InventoryItem["category"],
      item_type: "",
      brand: result.brand || "",
      product_name: result.product_name || "",
      color_code: result.color_code,
      color_name: result.color_name,
      color_description: "",
      texture: "" as InventoryItem["texture"],
      estimated_remaining: "100%",
      confidence: (result.confidence as InventoryItem["confidence"]) || "medium",
      source: "Web検索",
      product_url: result.product_url,
      created_at: "",
      updated_at: "",
    };

    // Try to complement with Rakuten image
    if (!item.image_url && !item.rakuten_image_url && (item.brand || item.product_name)) {
      try {
        const rakutenKeyword = [item.brand, item.product_name, item.color_name].filter(Boolean).join(" ");
        const res = await fetch("/api/inventory/search/rakuten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: rakutenKeyword }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.candidates?.[0]) {
            const candidate = data.candidates[0];
            item.rakuten_image_url = candidate.image_url;
            if (!item.product_url && candidate.url?.includes("rakuten.co.jp")) {
              item.product_url = candidate.url;
            }
            if (candidate.price) {
              item.price = candidate.price;
            }
          }
        }
      } catch {
        // Rakuten complement is best-effort
      }
    }

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
      <PageHeader title="Web検索" backHref="/inventory" />

      <div className="px-4 py-4 space-y-4">
        {/* Search form */}
        <div className="flex gap-2">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="商品名、ブランド名で検索..."
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
              <Globe className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Searching indicator */}
        {searching && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 text-neon-accent animate-spin mx-auto" />
              <p className="text-sm text-text-muted">
                AIがWeb検索中...
              </p>
              <p className="text-xs text-text-muted">
                少々お待ちください（10〜20秒程度）
              </p>
            </div>
          </div>
        )}

        {/* No results */}
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

        {/* Results */}
        {!searching && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              {results.length}件の結果 — タップして登録
            </p>
            {results.map((result, i) => (
              <button
                key={i}
                onClick={() => handleSelect(result)}
                className="w-full glass-card rounded-2xl p-4 text-left hover:bg-white/80 transition btn-squishy space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {result.brand && (
                      <p className="text-xs text-neon-accent font-medium">
                        {result.brand}
                      </p>
                    )}
                    <p className="text-sm font-medium text-text-ink">
                      {result.product_name || "不明な商品"}
                    </p>
                  </div>
                  {result.confidence && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                        result.confidence === "high"
                          ? "bg-green-100 text-green-700"
                          : result.confidence === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {result.confidence === "high"
                        ? "高確度"
                        : result.confidence === "medium"
                          ? "中確度"
                          : "低確度"}
                    </span>
                  )}
                </div>

                {(result.color_code || result.color_name) && (
                  <p className="text-xs text-text-muted">
                    色: {[result.color_code, result.color_name]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}

                {result.price_range && (
                  <p className="text-xs text-text-muted">
                    価格帯: {result.price_range}
                  </p>
                )}

                {(result.search_evidence || result.reason) && (
                  <p className="text-xs text-text-muted line-clamp-2">
                    {result.search_evidence || result.reason}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Sheet */}
      <ItemEditSheet
        item={editItem}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
