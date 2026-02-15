"use client";

import { useState } from "react";
import { Trash2, Percent, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => Promise<void>;
  onUpdateRemaining: (value: string) => Promise<void>;
  onCancel: () => void;
}

const REMAINING_OPTIONS = ["100%", "80%", "60%", "40%", "20%", "0%"];

export function BulkActionBar({ selectedCount, onDelete, onUpdateRemaining, onCancel }: BulkActionBarProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [remainingOpen, setRemainingOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleDelete = async () => {
    setProcessing(true);
    await onDelete();
    setProcessing(false);
    setDeleteConfirmOpen(false);
  };

  const handleRemaining = async (value: string) => {
    setProcessing(true);
    await onUpdateRemaining(value);
    setProcessing(false);
    setRemainingOpen(false);
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
        <div className="mx-auto max-w-lg bg-text-ink rounded-2xl shadow-xl p-3 flex items-center gap-3">
          <span className="text-white text-sm font-bold ml-2 shrink-0">
            {selectedCount}件選択
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setRemainingOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition btn-squishy"
          >
            <Percent className="h-3.5 w-3.5" />
            残量更新
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/80 text-white text-xs font-bold hover:bg-red-500 transition btn-squishy"
          >
            <Trash2 className="h-3.5 w-3.5" />
            削除
          </button>
          <button onClick={onCancel} className="p-2 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCount}件のアイテムを削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-muted">
            選択した{selectedCount}件のアイテムを在庫から削除します。この操作は取り消せません。
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-2xl">
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={processing}
              className="rounded-2xl"
            >
              {processing ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remaining Update Sheet */}
      <Dialog open={remainingOpen} onOpenChange={setRemainingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>残量を一括更新</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {REMAINING_OPTIONS.map((val) => (
              <button
                key={val}
                onClick={() => handleRemaining(val)}
                disabled={processing}
                className="py-3 rounded-xl text-sm font-bold border border-gray-200 hover:border-neon-accent hover:text-neon-accent transition btn-squishy"
              >
                {val}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
