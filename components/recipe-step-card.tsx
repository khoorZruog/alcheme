import Link from "next/link";
import { RefreshCw, Check, ExternalLink, Lightbulb, Sparkles } from "lucide-react";
import type { RecipeStep } from "@/types/recipe";

interface RecipeStepCardProps {
  step: RecipeStep;
  stepNumber: number;
}

export function RecipeStepCard({ step, stepNumber }: RecipeStepCardProps) {
  const isOwned = !!step.item_id && !step.substitution_note;
  const isSubstitute = !!step.substitution_note;

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
          {isOwned && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
              <Check className="h-2.5 w-2.5" />
              手持ち
            </span>
          )}
          {isSubstitute && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-alcheme-warning/15 text-alcheme-warning text-[10px] font-bold">
              <RefreshCw className="h-2.5 w-2.5" />
              代用テク
            </span>
          )}
        </div>

        {step.item_id ? (
          <Link
            href={`/inventory/${step.item_id}`}
            className="inline-flex items-center gap-2 btn-squishy group"
          >
            {step.image_url && (
              <img
                src={step.image_url}
                alt={step.item_name}
                className="h-9 w-9 rounded-lg object-cover border border-alcheme-sand shrink-0"
              />
            )}
            <span className="inline-flex items-baseline gap-1.5">
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
            </span>
          </Link>
        ) : (
          <p className="text-sm font-medium text-alcheme-charcoal">
            {step.item_name}
          </p>
        )}

        <p className="mt-1 text-sm text-alcheme-muted leading-relaxed">
          {step.instruction}
        </p>

        {step.substitution ? (
          <div className="mt-2 rounded-2xl border border-alcheme-sand bg-gradient-to-br from-alcheme-sand/40 to-white p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-alcheme-warning uppercase tracking-wider">
              <RefreshCw className="h-3 w-3" />
              代用テク
            </div>
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-neon-accent shrink-0 mt-0.5" />
              <div className="text-xs text-text-ink leading-relaxed">
                <span className="font-bold">理想: </span>
                <span>{step.substitution.original_brand && step.substitution.original_brand !== "N/A" ? `${step.substitution.original_brand} ` : ""}{step.substitution.original_name && step.substitution.original_name !== "N/A" ? step.substitution.original_name : ""}</span>
                {step.substitution.search_url && (
                  <a
                    href={step.substitution.search_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 ml-1.5 text-neon-accent hover:underline font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    楽天で探す
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-alcheme-rose shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted leading-relaxed">{step.substitution.reason}</p>
            </div>
            {step.substitution.tips.length > 0 && (
              <ul className="ml-5 space-y-0.5">
                {step.substitution.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-text-muted leading-relaxed list-disc">{tip}</li>
                ))}
              </ul>
            )}
          </div>
        ) : step.substitution_note ? (
          <div className="mt-2 rounded-lg bg-alcheme-sand p-3 text-xs text-alcheme-muted leading-relaxed">
            {step.substitution_note}
          </div>
        ) : null}
      </div>
    </div>
  );
}
