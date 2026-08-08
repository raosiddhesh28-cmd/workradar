import type { ImpactScoreBreakdown } from "@/domain/types";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "@/domain/scoring/config";

const LABELS: Record<keyof ImpactScoreBreakdown, string> = {
  goalAlignment: "Goal alignment",
  blockingRadius: "Blocking radius",
  urgency: "Urgency",
  stakeholderTier: "Stakeholder tier",
  recencyOfRisk: "Recency of risk",
  staleness: "Staleness penalty",
};

export function ImpactExplanation({
  breakdown,
  oneLineWhy,
  score,
}: {
  breakdown: ImpactScoreBreakdown;
  oneLineWhy: string;
  score: number;
}) {
  const weights = DEFAULT_IMPACT_SCORE_CONFIG.weights;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-2xl font-semibold font-mono">{Math.round(score)}</p>
        <p className="text-sm text-muted-foreground mt-1">{oneLineWhy}</p>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Why this matters</h3>
        {(Object.keys(breakdown) as (keyof ImpactScoreBreakdown)[]).map((key) => {
          const value = breakdown[key];
          const weight =
            key === "staleness"
              ? -weights.staleness
              : weights[key as keyof typeof weights];
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{LABELS[key]}</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {(value * 100).toFixed(0)}% × {weight}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(100, value * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
