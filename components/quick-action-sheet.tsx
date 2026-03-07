"use client";

import { useRouter } from "next/navigation";
import { Camera, MessageCircle, Package, BookOpen, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AddMethodSheet } from "@/components/add-method-sheet";
import { useState } from "react";

interface QuickActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionSheet({ open, onOpenChange }: QuickActionSheetProps) {
  const router = useRouter();
  const [addMethodOpen, setAddMethodOpen] = useState(false);

  const handleAction = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleAddCosme = () => {
    onOpenChange(false);
    setAddMethodOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10 pt-4">
          <SheetHeader className="mb-4">
            <div className="mx-auto w-10 h-1 rounded-full bg-gray-300 mb-3" />
            <SheetTitle className="text-center text-base font-bold text-text-ink">
              今日を記録する
            </SheetTitle>
          </SheetHeader>

          {/* PRIMARY: Beauty Log */}
          <button
            onClick={() => handleAction("/beauty-log?action=new")}
            className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-neon-accent to-magic-pink text-white btn-squishy transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Camera size={22} />
              </div>
              <div className="text-left">
                <div className="font-bold text-[15px]">今日のメイクを記録</div>
                <div className="text-white/80 text-xs mt-0.5">写真 + 気分を10秒で</div>
              </div>
            </div>
          </button>

          {/* SECONDARY: 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            <ActionCard
              icon={MessageCircle}
              label="AIに相談"
              sub="チャット開始"
              onClick={() => handleAction("/chat")}
            />
            <ActionCard
              icon={Package}
              label="コスメ追加"
              sub="スキャン / 手動"
              onClick={handleAddCosme}
            />
            <ActionCard
              icon={BookOpen}
              label="レシピ作成"
              sub="新しいレシピ"
              onClick={() => handleAction("/recipes/create")}
            />
            <ActionCard
              icon={ShoppingBag}
              label="欲しい追加"
              sub="Next Cosme"
              onClick={() => handleAction("/suggestions/add")}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AddMethodSheet open={addMethodOpen} onClose={() => setAddMethodOpen(false)} />
    </>
  );
}

function ActionCard({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/60 border border-white/80 shadow-card btn-squishy transition-all hover:shadow-card-hover active:scale-[0.97]"
    >
      <div className="w-10 h-10 rounded-full bg-neon-accent/10 flex items-center justify-center">
        <Icon size={18} className="text-neon-accent" />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-text-ink">{label}</div>
        <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>
      </div>
    </button>
  );
}
