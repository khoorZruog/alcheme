"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Package } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { SuggestedItem } from "@/types/suggestion";

interface SuggestionCompareSheetProps {
  items: SuggestedItem[];
  open: boolean;
  onClose: () => void;
}

export function SuggestionCompareSheet({ items, open, onClose }: SuggestionCompareSheetProps) {
  const router = useRouter();

  const handleAskAI = () => {
    const names = items.map((item) => `${item.brand} ${item.product_name}`).join(" vs ");
    const message = `以下の${items.length}つのアイテムを比較して、どちらがおすすめか教えてください: ${names}`;
    onClose();
    router.push(`/chat?message=${encodeURIComponent(message)}`);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="bg-white rounded-t-3xl border-t border-gray-100 pb-10 shadow-xl">
        <SheetHeader>
          <SheetTitle className="font-display italic text-2xl text-text-ink">
            アイテム比較
          </SheetTitle>
        </SheetHeader>

        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-40 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden"
            >
              <div className="w-full aspect-square bg-white">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-8 w-8 text-black/10" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-[10px] text-text-muted font-bold uppercase truncate">{item.brand}</p>
                <p className="text-xs font-bold text-text-ink line-clamp-2">{item.product_name}</p>
                {item.price_range && (
                  <p className="text-[10px] text-text-muted">{item.price_range}</p>
                )}
                {item.reason && (
                  <p className="text-[10px] text-text-muted line-clamp-2">{item.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAskAI}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-neon-accent to-magic-pink text-sm font-bold text-white shadow-lg btn-squishy"
        >
          <Sparkles className="h-4 w-4" />
          AIに聞く
        </button>
      </SheetContent>
    </Sheet>
  );
}
