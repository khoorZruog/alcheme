"use client";

import { useState } from "react";
import { Heart, Meh, Frown } from "lucide-react";
import { cn } from "@/lib/utils";

type Rating = "liked" | "neutral" | "disliked";

const OPTIONS: { value: Rating; icon: typeof Heart; label: string; activeColor: string }[] = [
  { value: "liked", icon: Heart, label: "良い", activeColor: "bg-alcheme-rose text-white" },
  { value: "neutral", icon: Meh, label: "微妙", activeColor: "bg-alcheme-warning text-white" },
  { value: "disliked", icon: Frown, label: "合わない", activeColor: "bg-alcheme-muted text-white" },
];

interface RecipeFeedbackProps {
  currentRating?: string;
  onSubmit: (rating: Rating) => void | Promise<void>;
}

export function RecipeFeedback({ currentRating, onSubmit }: RecipeFeedbackProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (rating: Rating) => {
    setIsSubmitting(true);
    try {
      await onSubmit(rating);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-alcheme-charcoal">このレシピはいかがでしたか？</p>
      <div className="flex gap-2">
        {OPTIONS.map(({ value, icon: Icon, label, activeColor }) => (
          <button
            key={value}
            onClick={() => handleSubmit(value)}
            disabled={isSubmitting}
            className={cn(
              "flex items-center gap-1.5 rounded-button px-4 py-2 text-sm font-medium transition-colors",
              isSubmitting && "opacity-50 cursor-not-allowed",
              currentRating === value
                ? activeColor
                : "bg-alcheme-sand text-alcheme-charcoal hover:bg-alcheme-blush"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
