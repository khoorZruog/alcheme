import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecipeStep } from "@/types/recipe";

interface RecipeStepCardProps {
  step: RecipeStep;
  stepNumber: number;
}

export function RecipeStepCard({ step, stepNumber }: RecipeStepCardProps) {
  return (
    <div className="flex gap-3">
      {/* Step number circle */}
      <div className="shrink-0 flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-alcheme-rose text-white text-sm font-bold">
          {stepNumber}
        </div>
        <div className="mt-1 flex-1 w-px bg-alcheme-sand" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-alcheme-muted uppercase tracking-wider">
            {step.area}
          </span>
          {step.substitution_note && (
            <Badge variant="outline" className="gap-1 text-[10px] border-alcheme-warning text-alcheme-warning">
              <RefreshCw className="h-2.5 w-2.5" />
              代用テク
            </Badge>
          )}
        </div>

        {step.item_id ? (
          <Link
            href={`/inventory/${step.item_id}`}
            className="inline-flex items-baseline gap-1.5 btn-squishy group"
          >
            <span className="text-sm font-bold text-text-ink group-hover:text-neon-accent transition">
              {step.item_name}
            </span>
            {(step.color_code || step.color_name) && (
              <span className="text-xs">
                {step.color_code && <span className="font-bold text-neon-accent">#{step.color_code}</span>}
                {step.color_code && step.color_name && " "}
                {step.color_name && <span className="text-text-muted">{step.color_name}</span>}
              </span>
            )}
          </Link>
        ) : (
          <p className="text-sm font-medium text-alcheme-charcoal">
            {step.item_name}
          </p>
        )}

        <p className="mt-1 text-sm text-alcheme-muted leading-relaxed">
          {step.instruction}
        </p>

        {step.substitution_note && (
          <div className="mt-2 rounded-lg bg-alcheme-sand p-3 text-xs text-alcheme-muted leading-relaxed">
            {step.substitution_note}
          </div>
        )}
      </div>
    </div>
  );
}
