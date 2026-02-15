"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { MoreVertical, Pencil, Trash2, Package, ExternalLink, Search, BookOpen, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { CategoryBadge } from "@/components/category-badge";
import { StatBarGroup } from "@/components/stat-bar";
import { RemainingBar } from "@/components/remaining-bar";
import { ItemEditSheet } from "@/components/item-edit-sheet";
import { DetailSkeleton } from "@/components/loading-skeleton";
import { fetcher } from "@/lib/api/fetcher";
import type { InventoryItem } from "@/types/inventory";
import type { Recipe } from "@/types/recipe";

export default function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params);
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<{ items: InventoryItem[] }>(
    `/api/inventory?_id=${itemId}`,
    fetcher
  );
  const { data: recipesData } = useSWR<{ recipes: Recipe[] }>(
    `/api/recipes?item_id=${itemId}`,
    fetcher
  );
  const relatedRecipes = recipesData?.recipes ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Find item from list (API returns all items, filter client-side for now)
  const allItems = data?.items ?? [];
  const item = allItems.find((i) => i.id === itemId) ?? null;

  const handleSave = async (updates: Partial<InventoryItem>) => {
    await fetch(`/api/inventory/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    mutate();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/inventory/${itemId}`, { method: "DELETE" });
    router.push("/inventory");
  };

  const parseRemaining = (str: string | null | undefined): number => {
    if (!str) return 50;
    const num = parseInt(str.replace("%", ""), 10);
    return isNaN(num) ? 50 : num;
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="アイテム詳細" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!item) {
    return (
      <div>
        <PageHeader title="アイテム詳細" />
        <p className="p-8 text-center text-alcheme-muted">アイテムが見つかりません</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="アイテム詳細"
        rightElement={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-alcheme-muted hover:text-alcheme-charcoal">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-alcheme-danger">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Image */}
      <div className="aspect-square bg-gray-50 relative">
        {(item.image_url || item.rakuten_image_url) ? (
          <Image
            src={item.image_url || item.rakuten_image_url!}
            alt={item.product_name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-16 w-16 text-alcheme-muted/30" />
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Basic Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CategoryBadge category={item.category} />
            {item.price != null && (
              <span className="ml-auto text-sm font-bold text-alcheme-charcoal">
                ¥{item.price.toLocaleString("ja-JP")}
              </span>
            )}
          </div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-2">{item.brand}</p>
          <p className="text-xl font-display italic font-bold text-text-ink">{item.product_name}</p>
          {(item.color_code || item.color_name) && (
            <p className="text-sm font-bold mt-1">
              {item.color_code && <span className="text-neon-accent">#{item.color_code}</span>}
              {item.color_code && item.color_name && " "}
              {item.color_name && <span className="text-text-ink">{item.color_name}</span>}
            </p>
          )}
          {item.color_description && (
            <p className="text-xs text-text-muted mt-0.5">{item.color_description}</p>
          )}
        </div>

        {/* Stats */}
        {item.stats && (
          <div>
            <p className="text-sm font-medium text-alcheme-charcoal mb-2">スペック</p>
            <StatBarGroup stats={item.stats} />
          </div>
        )}

        {/* Info Grid */}
        <div>
          <p className="text-sm font-medium text-alcheme-charcoal mb-2">情報</p>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {item.item_type && (
              <>
                <span className="text-alcheme-muted">種別</span>
                <span className="text-alcheme-charcoal">{item.item_type}</span>
              </>
            )}
            <span className="text-alcheme-muted">質感</span>
            <span className="text-alcheme-charcoal">{item.texture}</span>
            <span className="text-alcheme-muted">残量</span>
            <div><RemainingBar value={parseRemaining(item.estimated_remaining)} /></div>
            {item.pao_months != null && (
              <>
                <span className="text-alcheme-muted">使用期限目安</span>
                <span className="text-alcheme-charcoal">約{item.pao_months}ヶ月</span>
              </>
            )}
            <span className="text-alcheme-muted">登録日</span>
            <span className="text-alcheme-charcoal">{new Date(item.created_at).toLocaleDateString("ja-JP")}</span>
          </div>
        </div>

        {/* Rakuten links */}
        <div className="flex flex-col gap-2">
          {item.product_url && item.product_url.includes('rakuten.co.jp') && (
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neon-accent font-bold hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              楽天で見る
            </a>
          )}
          <a
            href={`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(`${item.brand} ${item.product_name}${item.color_name ? ` ${item.color_name}` : ''}`)}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-ink transition"
          >
            <Search className="h-4 w-4" />
            楽天で探す
          </a>
        </div>
        {/* Related Recipes */}
        <div>
          <p className="text-sm font-medium text-alcheme-charcoal mb-2">
            <BookOpen className="h-4 w-4 inline mr-1" />
            このアイテムを使ったレシピ
          </p>
          {relatedRecipes.length === 0 ? (
            <p className="text-xs text-text-muted py-2">まだレシピがありません</p>
          ) : (
            <div className="space-y-2">
              {relatedRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition btn-squishy"
                >
                  {recipe.preview_image_url ? (
                    <img src={recipe.preview_image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-text-muted" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-ink truncate">{recipe.recipe_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                      {recipe.match_score != null && <span>再現度 {recipe.match_score}%</span>}
                      <span>{new Date(recipe.created_at).toLocaleDateString("ja-JP")}</span>
                      {recipe.feedback?.user_rating === "liked" && (
                        <Heart className="h-3 w-3 text-red-400 fill-current" />
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Sheet */}
      <ItemEditSheet item={item} open={editOpen} onClose={() => setEditOpen(false)} onSave={handleSave} />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>アイテムを削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-alcheme-muted">
            「{item.product_name}」を在庫から削除します。この操作は取り消せません。
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-button">
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-button"
            >
              {deleting ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
