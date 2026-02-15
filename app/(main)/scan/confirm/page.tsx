"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { AppraisalEffect } from "@/components/appraisal-effect";
import { AppraisalCard } from "@/components/appraisal-card";
import { ProductCandidates } from "@/components/product-candidates";
import { ItemEditSheet } from "@/components/item-edit-sheet";
import type { InventoryItem } from "@/types/inventory";

export default function ScanConfirmPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [showEffect, setShowEffect] = useState(true);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [registering, setRegistering] = useState(false);
  // Track which candidate index is selected per item (-1 = 該当なし, null = none)
  const [candidateSelection, setCandidateSelection] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const stored = sessionStorage.getItem("scanResult");
    if (stored) {
      const parsed = JSON.parse(stored) as InventoryItem[];
      setItems(parsed);
      // Auto-confirm high confidence items (or those with auto-matched single candidate)
      const initial: Record<string, boolean> = {};
      parsed.forEach((item) => {
        if (item.confidence === "high") initial[item.id] = true;
      });
      setConfirmed(initial);
    } else {
      router.push("/scan");
    }
  }, [router]);

  const handleEffectComplete = useCallback(() => {
    setShowEffect(false);
  }, []);

  const toggleConfirm = (itemId: string) => {
    setConfirmed((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleEdit = (item: InventoryItem) => {
    setEditItem(item);
  };

  const handleSaveEdit = (updates: Partial<InventoryItem>) => {
    if (!editItem) return;
    setItems((prev) =>
      prev.map((item) => (item.id === editItem.id ? { ...item, ...updates } : item))
    );
    setConfirmed((prev) => ({ ...prev, [editItem.id]: true }));
    setEditItem(null);
  };

  const handleCandidateSelect = (itemId: string, candidateIndex: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item?.candidates?.[candidateIndex]) return;

    const candidate = item.candidates[candidateIndex];
    setCandidateSelection((prev) => ({ ...prev, [itemId]: candidateIndex }));

    // Apply candidate data to item
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          price: candidate.price,
          product_url: candidate.url,
          rakuten_image_url: candidate.image_url,
          color_code: candidate.color_code || i.color_code,
          color_name: candidate.color_name || i.color_name,
          confidence: "high",
          source: "画像認識 + 楽天API",
        };
      })
    );
    setConfirmed((prev) => ({ ...prev, [itemId]: true }));
  };

  const handleCandidateNone = (itemId: string) => {
    setCandidateSelection((prev) => ({ ...prev, [itemId]: -1 }));
    // Open edit sheet for manual correction
    const item = items.find((i) => i.id === itemId);
    if (item) setEditItem(item);
  };

  const handleBack = () => {
    // Keep sessionStorage intact so user can return later
    router.push("/scan");
  };

  const handleRegister = async () => {
    const confirmedItems = items.filter((item) => confirmed[item.id]);
    if (confirmedItems.length === 0) return;

    setRegistering(true);
    try {
      await fetch("/api/inventory/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: confirmedItems }),
      });

      // Keep unconfirmed items in sessionStorage for later
      const remainingItems = items.filter((item) => !confirmed[item.id]);
      if (remainingItems.length > 0) {
        sessionStorage.setItem("scanResult", JSON.stringify(remainingItems));
      } else {
        sessionStorage.removeItem("scanResult");
        sessionStorage.removeItem("scanImages");
      }

      toast.success(`${confirmedItems.length}件のコスメを登録しました`);
      router.push("/inventory");
    } catch (error) {
      console.error("Register error:", error);
      toast.error("登録に失敗しました。もう一度お試しください。");
    } finally {
      setRegistering(false);
    }
  };

  const confirmedCount = Object.values(confirmed).filter(Boolean).length;
  const unconfirmedCount = items.length - confirmedCount;

  if (showEffect && items.length > 0) {
    return <AppraisalEffect items={items} onComplete={handleEffectComplete} />;
  }

  return (
    <div>
      <PageHeader title={`鑑定結果 (${items.length}件)`} backHref="/scan" />

      <div className="px-4 py-4 space-y-3">
        {items.map((item) => (
          <div key={item.id}>
            <AppraisalCard
              item={item}
              confirmed={!!confirmed[item.id]}
              onConfirm={toggleConfirm}
              onEdit={handleEdit}
            />
            {item.candidates && item.candidates.length > 0 && (
              <ProductCandidates
                candidates={item.candidates}
                selectedIndex={candidateSelection[item.id] ?? null}
                onSelect={(idx) => handleCandidateSelect(item.id, idx)}
                onNone={() => handleCandidateNone(item.id)}
              />
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleBack}
            variant="outline"
            size="lg"
            className="flex-1 rounded-button"
          >
            保留して戻る
          </Button>
          <Button
            onClick={handleRegister}
            disabled={confirmedCount === 0 || registering}
            size="lg"
            className="flex-2 bg-alcheme-gold hover:bg-alcheme-gold/90 text-white rounded-button"
          >
            {registering
              ? "登録中..."
              : `${confirmedCount}件を登録する`}
          </Button>
        </div>

        <p className="text-center text-xs text-alcheme-muted">
          {unconfirmedCount > 0
            ? `「保留して戻る」で未確認の${items.length}件をスキャン画面に保存します`
            : "全てのアイテムが確認済みです"}
        </p>

        {/* Rakuten credit */}
        <p className="text-center text-[10px] text-alcheme-muted pt-2">
          Supported by Rakuten Developers
        </p>
      </div>

      <ItemEditSheet
        item={editItem}
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
