"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInventory } from "@/hooks/use-inventory";
import { CosmeCard } from "@/components/cosme-card";
import { CategoryFilter, type Category } from "@/components/category-filter";
import { EmptyState } from "@/components/empty-state";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";

export default function InventoryPage() {
  const { filteredItems, isLoading, error, filter, setFilter, searchQuery, setSearchQuery, count } = useInventory();
  const [searchOpen, setSearchOpen] = useState(false);

  const parseRemaining = (str: string | null | undefined): number => {
    if (!str) return 50;
    const num = parseInt(str.replace("%", ""), 10);
    return isNaN(num) ? 50 : num;
  };

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <div className="pt-14 px-6 pb-4 sticky top-0 bg-lum-base/90 backdrop-blur-lg z-20 border-b border-white/50">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="font-display italic font-bold text-5xl text-text-ink">
              コスメ
            </h1>
            <p className="text-xs text-text-muted mt-2 tracking-widest font-bold uppercase">
              {count} アイテム
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy"
              aria-label="検索"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link href="/scan">
              <button className="w-12 h-12 rounded-full bg-neon-accent text-white flex items-center justify-center shadow-lg btn-squishy">
                <Plus size={20} />
              </button>
            </Link>
          </div>
        </div>

        {/* Category Filter */}
        <CategoryFilter value={filter as Category} onChange={(c) => setFilter(c)} />
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-alcheme-muted mb-3">コスメの読み込みに失敗しました</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : isLoading ? (
          <InventoryGridSkeleton />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="コスメが登録されていません"
            description="コスメをスキャンして、在庫に登録しましょう"
            action={
              <Link href="/scan">
                <button className="btn-squishy h-12 px-8 rounded-2xl relative overflow-hidden shadow-neon-glow group">
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 text-white font-body font-bold tracking-wider">
                    スキャンする
                  </div>
                </button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <CosmeCard
                key={item.id}
                itemId={item.id}
                brand={item.brand}
                productName={item.product_name}
                imageUrl={item.image_url}
                rakutenImageUrl={item.rakuten_image_url}
                price={item.price}
                category={item.category}
                remainingPercent={parseRemaining(item.estimated_remaining)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-4 translate-y-0 glass-panel border-white/50 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display italic text-2xl">Search</DialogTitle>
          </DialogHeader>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ブランド名、商品名、色..."
            className="rounded-full bg-white/50 border-white/80 focus:border-neon-accent"
            autoFocus
          />
          {searchQuery && (
            <p className="text-xs text-text-muted">
              {filteredItems.length}件の結果
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
