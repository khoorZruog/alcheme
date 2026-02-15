"use client";

import Link from "next/link";
import { BookOpen, ExternalLink, Search, ShoppingCart, XCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { SuggestedItem } from "@/types/suggestion";

interface SuggestionHistorySheetProps {
  item: SuggestedItem | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: "候補" | "購入済み" | "見送り") => void;
}

export function SuggestionHistorySheet({ item, open, onClose, onUpdateStatus }: SuggestionHistorySheetProps) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-white rounded-t-3xl border-t border-gray-100 pb-10 max-h-[80dvh] overflow-y-auto shadow-xl"
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            {item.recommendation_count > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-neon-accent/10 text-neon-accent text-[10px] font-bold">
                x{item.recommendation_count} おすすめ
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.status === "候補" ? "bg-blue-100 text-blue-700" :
              item.status === "購入済み" ? "bg-green-100 text-green-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {item.status}
            </span>
          </div>
          <div className="mt-1">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              {item.brand}
            </p>
            <SheetTitle className="font-display italic text-xl text-text-ink">
              {item.product_name}
            </SheetTitle>
            {(item.color_code || item.color_name) && (
              <p className="text-sm mt-0.5">
                {item.color_code && <span className="font-bold text-neon-accent">#{item.color_code}</span>}
                {item.color_code && item.color_name && " "}
                {item.color_name && <span className="text-text-ink">{item.color_name}</span>}
              </p>
            )}
          </div>
        </SheetHeader>

        {/* Reason */}
        {item.reason && (
          <p className="mt-3 text-sm text-text-muted">{item.reason}</p>
        )}

        {/* Price */}
        {item.price_range && (
          <p className="mt-2 text-xs text-text-muted">価格帯: {item.price_range}</p>
        )}

        {/* History */}
        <div className="mt-4">
          <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            推薦履歴
          </p>
          <div className="space-y-2">
            {item.history?.map((h, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-gray-50">
                <BookOpen className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-text-ink">
                    {h.recipe_name ? (
                      <Link href={`/recipes/${h.recipe_id}`} onClick={onClose} className="text-neon-accent hover:underline">
                        {h.recipe_name}
                      </Link>
                    ) : (
                      h.context || "一般的な提案"
                    )}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {new Date(h.suggested_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2">
          {/* Rakuten search */}
          <a
            href={`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(`${item.brand} ${item.product_name}${item.color_name ? ` ${item.color_name}` : ''}`)}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white bg-neon-accent shadow-lg btn-squishy"
          >
            <Search className="h-4 w-4" />
            楽天で探す
          </a>

          {item.product_url && item.product_url.includes('rakuten.co.jp') && (
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-neon-accent border border-neon-accent btn-squishy"
            >
              <ExternalLink className="h-4 w-4" />
              楽天で見る
            </a>
          )}

          <div className="flex gap-2">
            {item.status !== "購入済み" && (
              <button
                onClick={() => onUpdateStatus(item.id, "購入済み")}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-bold text-green-700 border border-green-200 hover:bg-green-50 transition btn-squishy"
              >
                <ShoppingCart className="h-4 w-4" />
                購入済み
              </button>
            )}
            {item.status !== "見送り" && (
              <button
                onClick={() => onUpdateStatus(item.id, "見送り")}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-bold text-text-muted border border-gray-200 hover:bg-gray-50 transition btn-squishy"
              >
                <XCircle className="h-4 w-4" />
                見送り
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
