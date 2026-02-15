"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import { MoreVertical, Pencil, Trash2, Package, ExternalLink } from "lucide-react";
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

export default function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params);
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<{ items: InventoryItem[] }>(
    `/api/inventory?_id=${itemId}`,
    fetcher
  );
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
          <p className="text-xs text-alcheme-muted uppercase tracking-wider mt-2">{item.brand}</p>
          <p className="text-lg font-display font-bold text-alcheme-charcoal">{item.product_name}</p>
          {item.color_code && (
            <p className="text-sm text-alcheme-charcoal">
              {item.color_code}{item.color_name ? ` ${item.color_name}` : ""}
            </p>
          )}
          <p className="text-sm text-alcheme-muted">{item.color_description}</p>
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

        {/* Rakuten link */}
        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-alcheme-rose hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            楽天で見る
          </a>
        )}
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
