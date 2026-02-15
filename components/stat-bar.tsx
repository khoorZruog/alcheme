import { Sparkles, Droplets, Timer, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type StatKey = "pigment" | "longevity" | "shelf_life" | "natural_finish";

const STAT_CONFIG: Record<StatKey, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  pigment:        { label: "発色力",      icon: Sparkles, color: "bg-alcheme-rose",   bgColor: "bg-alcheme-rose/20" },
  longevity:      { label: "持続力",      icon: Droplets, color: "bg-blue-400",       bgColor: "bg-blue-400/20" },
  shelf_life:     { label: "コスパ",      icon: Timer,    color: "bg-alcheme-success", bgColor: "bg-alcheme-success/20" },
  natural_finish: { label: "ナチュラル",  icon: Eye,      color: "bg-purple-400",     bgColor: "bg-purple-400/20" },
};

interface StatBarProps {
  statKey: StatKey;
  value: number; // 1-5
  className?: string;
}

export function StatBar({ statKey, value, className }: StatBarProps) {
  const config = STAT_CONFIG[statKey];
  const Icon = config.icon;
  const percentage = (value / 5) * 100;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Icon className="h-4 w-4 text-alcheme-muted shrink-0" />
      <span className="w-16 text-alcheme-charcoal text-xs shrink-0">{config.label}</span>
      <div className={cn("h-2 flex-1 rounded-full", config.bgColor)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", config.color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs text-alcheme-muted">{value}/5</span>
    </div>
  );
}

interface StatBarGroupProps {
  stats: Record<StatKey, number>;
  className?: string;
}

export function StatBarGroup({ stats, className }: StatBarGroupProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {(Object.keys(STAT_CONFIG) as StatKey[]).map((key) => (
        <StatBar key={key} statKey={key} value={stats[key]} />
      ))}
    </div>
  );
}
