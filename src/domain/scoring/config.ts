import type { ImpactScoreBreakdown } from "../types";

export interface ImpactScoreWeights {
  goalAlignment: number;
  blockingRadius: number;
  urgency: number;
  stakeholderTier: number;
  recencyOfRisk: number;
  staleness: number;
}

export interface ImpactScoreConfig {
  weights: ImpactScoreWeights;
  maxTraverseDepth: number;
  urgencyDecayExponent: number;
  attentionThresholds: {
    urgency: number;
    recencyOfRisk: number;
  };
  stalenessMultiplier: number;
  tierWeights: Record<string, number>;
}

export const DEFAULT_IMPACT_SCORE_CONFIG: ImpactScoreConfig = {
  weights: {
    goalAlignment: 0.3,
    blockingRadius: 0.25,
    urgency: 0.2,
    stakeholderTier: 0.1,
    recencyOfRisk: 0.1,
    staleness: 0.05,
  },
  maxTraverseDepth: 4,
  urgencyDecayExponent: 2,
  attentionThresholds: {
    urgency: 0.7,
    recencyOfRisk: 0.5,
  },
  stalenessMultiplier: 0.15,
  tierWeights: {
    ic: 0.2,
    manager: 0.4,
    director: 0.6,
    vp: 0.8,
    c_level: 1.0,
    customer: 0.9,
  },
};

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function computeWeightedScore(
  breakdown: ImpactScoreBreakdown,
  weights: ImpactScoreWeights,
): number {
  const raw =
    weights.goalAlignment * breakdown.goalAlignment +
    weights.blockingRadius * breakdown.blockingRadius +
    weights.urgency * breakdown.urgency +
    weights.stakeholderTier * breakdown.stakeholderTier +
    weights.recencyOfRisk * breakdown.recencyOfRisk -
    weights.staleness * breakdown.staleness;

  return clampScore(raw * 100);
}
