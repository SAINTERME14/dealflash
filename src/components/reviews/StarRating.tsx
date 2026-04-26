import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (v: number) => void;
  className?: string;
};

const SIZE_MAP = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-7 w-7" };

export function StarRating({ value, max = 5, size = "md", interactive = false, onChange, className }: Props) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} role={interactive ? "radiogroup" : "img"} aria-label={`Note : ${value} sur ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        const Icon = (
          <Star
            className={cn(
              SIZE_MAP[size],
              filled ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40",
              interactive && "cursor-pointer transition-transform hover:scale-110"
            )}
          />
        );
        return interactive ? (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i + 1)}
            aria-label={`${i + 1} étoile${i ? "s" : ""}`}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {Icon}
          </button>
        ) : (
          <span key={i}>{Icon}</span>
        );
      })}
    </div>
  );
}
