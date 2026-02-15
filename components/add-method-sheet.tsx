"use client";

import { useRouter } from "next/navigation";
import { ScanLine, Search, Globe, PenLine } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AddMethodSheetProps {
  open: boolean;
  onClose: () => void;
}

const METHODS = [
  {
    icon: ScanLine,
    title: "スキャン鑑定",
    description: "コスメの写真を撮ってAIが自動認識",
    href: "/scan",
  },
  {
    icon: Search,
    title: "楽天で検索",
    description: "ブランド名・商品名で楽天から検索",
    href: "/add/search",
  },
  {
    icon: Globe,
    title: "Web検索",
    description: "Google検索で海外ブランドなど幅広く検索",
    href: "/add/web-search",
  },
  {
    icon: PenLine,
    title: "手動で登録",
    description: "すべての情報を手入力で登録",
    href: "/add/manual",
  },
] as const;

export function AddMethodSheet({ open, onClose }: AddMethodSheetProps) {
  const router = useRouter();

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-card max-h-[70dvh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="font-display">コスメを追加</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3 pb-4">
          {METHODS.map(({ icon: Icon, title, description, href }) => (
            <button
              key={href}
              onClick={() => handleSelect(href)}
              className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-white/80 transition btn-squishy"
            >
              <div className="w-11 h-11 rounded-xl bg-neon-accent/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-neon-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-ink">{title}</p>
                <p className="text-xs text-text-muted">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
