import { Sparkles, Droplets, Timer, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CosmeCategory } from "@/types/inventory";

export type StatKey = "pigment" | "longevity" | "shelf_life" | "natural_finish";

const STAT_STYLE: Record<StatKey, { icon: React.ElementType; color: string; bgColor: string }> = {
  pigment:        { icon: Sparkles, color: "bg-alcheme-rose",    bgColor: "bg-alcheme-rose/20" },
  longevity:      { icon: Droplets, color: "bg-blue-400",        bgColor: "bg-blue-400/20" },
  shelf_life:     { icon: Timer,    color: "bg-alcheme-success", bgColor: "bg-alcheme-success/20" },
  natural_finish: { icon: Eye,      color: "bg-purple-400",      bgColor: "bg-purple-400/20" },
};

/** LIPS準拠カテゴリ別スペックラベル */
const CATEGORY_STAT_LABELS: Record<StatKey, Record<CosmeCategory, string>> = {
  pigment:        { "リップ": "発色",    "アイメイク": "発色",    "ベースメイク": "カバー力",  "スキンケア": "保湿",   "その他": "仕上がり" },
  longevity:      { "リップ": "キープ力", "アイメイク": "キープ力", "ベースメイク": "崩れにくさ", "スキンケア": "肌なじみ", "その他": "キープ力" },
  shelf_life:     { "リップ": "コスパ",   "アイメイク": "コスパ",   "ベースメイク": "コスパ",   "スキンケア": "コスパ",  "その他": "コスパ" },
  natural_finish: { "リップ": "ツヤ",     "アイメイク": "肌なじみ", "ベースメイク": "仕上がり",  "スキンケア": "使用感",  "その他": "使いやすさ" },
};

const DEFAULT_CATEGORY: CosmeCategory = "リップ";

export function getStatLabel(statKey: StatKey, category?: CosmeCategory): string {
  return CATEGORY_STAT_LABELS[statKey][category || DEFAULT_CATEGORY];
}

export function getStatLabels(category?: CosmeCategory): { key: StatKey; label: string }[] {
  return (Object.keys(CATEGORY_STAT_LABELS) as StatKey[]).map((key) => ({
    key,
    label: getStatLabel(key, category),
  }));
}

interface StatBarProps {
  statKey: StatKey;
  value: number; // 1-5
  category?: CosmeCategory;
  className?: string;
}

export function StatBar({ statKey, value, category, className }: StatBarProps) {
  const style = STAT_STYLE[statKey];
  const Icon = style.icon;
  const label = getStatLabel(statKey, category);
  const percentage = (value / 5) * 100;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Icon className="h-4 w-4 text-alcheme-muted shrink-0" />
      <span className="w-16 text-alcheme-charcoal text-xs shrink-0">{label}</span>
      <div className={cn("h-2 flex-1 rounded-full", style.bgColor)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", style.color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs text-alcheme-muted">{value}/5</span>
    </div>
  );
}

interface StatBarGroupProps {
  stats: Record<StatKey, number>;
  category?: CosmeCategory;
  className?: string;
}

export function StatBarGroup({ stats, category, className }: StatBarGroupProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {(Object.keys(STAT_STYLE) as StatKey[]).map((key) => (
        <StatBar key={key} statKey={key} value={stats[key]} category={category} />
      ))}
    </div>
  );
}
