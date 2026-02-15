import { Database } from "lucide-react";

interface Props {
  inventoryCount: number;
  recipeCount: number;
}

export function DataStatsSection({ inventoryCount, recipeCount }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-text-ink">
        <Database className="h-4 w-4" /> データ
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-text-ink">{inventoryCount}</p>
          <p className="text-xs text-text-muted">登録コスメ</p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-text-ink">{recipeCount}</p>
          <p className="text-xs text-text-muted">レシピ数</p>
        </div>
      </div>
    </section>
  );
}
