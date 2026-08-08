import type { ImpactScoreBreakdown } from "@/domain/types";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "@/domain/scoring/config";
import { ImpactScoreBadge } from "@/components/design-system/ImpactScoreBadge";

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
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <ImpactScoreBadge score={score} size="lg" />
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Why this matters
          </h2>
          <p className="text-base mt-1 leading-relaxed">{oneLineWhy}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="wr-section-title">Score breakdown</h3>
        <p className="wr-metadata">
          Deterministic factors from the impact graph — not AI-generated
        </p>
        <dl className="space-y-4">
          {(Object.keys(breakdown) as (keyof ImpactScoreBreakdown)[]).map(
            (key) => {
              const value = breakdown[key];
              const weight =
                key === "staleness"
                  ? -weights.staleness
                  : weights[key as keyof typeof weights];
              return (
                <div key={key}>
                  <dt className="flex justify-between text-sm mb-1.5">
                    <span>{LABELS[key]}</span>
                    <span className="wr-metadata font-mono">
                      {(value * 100).toFixed(0)}% × {weight}
                    </span>
                  </dt>
                  <dd>
                    <div
                      className="h-2 rounded-full bg-muted overflow-hidden"
                      role="presentation"
                    >
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, value * 100)}%` }}
                      />
                    </div>
                  </dd>
                </div>
              );
            },
          )}
        </dl>
      </div>
    </div>
  );
}
