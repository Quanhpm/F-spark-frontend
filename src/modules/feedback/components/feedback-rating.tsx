import { Star } from "lucide-react";

import { cn } from "@/shared/lib";

export function FeedbackRating({ value }: { value: number | null }) {
  if (!value) return <span className="text-sm text-muted">No rating</span>;

  return (
    <span className="flex items-center gap-1" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          className={cn(
            "text-border-warm",
            index < value && "fill-brand-secondary text-brand-secondary",
          )}
          key={index}
          size={16}
        />
      ))}
    </span>
  );
}
