"use client";

import { Sparkles, Moon, Clock, Copy, BatteryLow } from "lucide-react";
import { motion } from "framer-motion";
import type { CosmeInsight, InsightType } from "@/lib/cosme-usage-insights";

const INSIGHT_CONFIG: Record<
  InsightType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  new_unused: { icon: Sparkles, color: "text-blue-500", bgColor: "bg-blue-50" },
  dormant: { icon: Moon, color: "text-purple-500", bgColor: "bg-purple-50" },
  expiring: { icon: Clock, color: "text-orange-500", bgColor: "bg-orange-50" },
  duplicate: { icon: Copy, color: "text-pink-500", bgColor: "bg-pink-50" },
  low_remaining: { icon: BatteryLow, color: "text-red-500", bgColor: "bg-red-50" },
};

interface CosmeInsightsCardProps {
  insights: CosmeInsight[];
  onTap: (insight: CosmeInsight) => void;
}

export function CosmeInsightsCard({ insights, onTap }: CosmeInsightsCardProps) {
  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mb-4"
    >
      <p className="text-xs font-bold text-text-muted mb-2 px-1">
        使ってみませんか？
      </p>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {insights.map((insight) => {
          const config = INSIGHT_CONFIG[insight.type];
          const Icon = config.icon;
          return (
            <button
              key={`${insight.type}-${insight.item.id}`}
              onClick={() => onTap(insight)}
              className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/70 border border-white/80 shadow-card hover:shadow-card-hover transition-all btn-squishy max-w-[200px]"
            >
              <div
                className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}
              >
                <Icon size={14} className={config.color} />
              </div>
              <div className="text-left min-w-0">
                <div className="text-[10px] font-bold text-text-muted truncate">
                  {insight.label}
                </div>
                <div className="text-xs font-medium text-text-ink truncate">
                  {insight.item.brand} {insight.item.product_name}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
