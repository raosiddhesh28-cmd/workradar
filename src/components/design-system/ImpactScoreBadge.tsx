import { cn } from "@/lib/utils";

interface ImpactScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function tier(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const tierStyles = {
  high: "bg-primary/10 text-primary border-primary/25",
  medium: "bg-info/10 text-info-foreground border-info/25",
  low: "bg-muted text-muted-foreground border-border",
};

export function ImpactScoreBadge({
  score,
  size = "md",
  className,
}: ImpactScoreBadgeProps) {
  const t = tier(score);
  const sizeClass =
    size === "lg"
      ? "text-2xl px-3 py-1.5"
      : size === "sm"
        ? "text-xs px-2 py-0.5"
        : "text-sm px-2.5 py-1";

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center rounded-md border font-mono tabular-nums",
        tierStyles[t],
        sizeClass,
        className,
      )}
      aria-label={`Impact score ${Math.round(score)}, ${t} impact`}
    >
      <span className="font-semibold leading-none">{Math.round(score)}</span>
      {size !== "sm" && (
        <span className="text-[10px] uppercase tracking-wide opacity-80 mt-0.5">
          Impact
        </span>
      )}
    </div>
  );
}
