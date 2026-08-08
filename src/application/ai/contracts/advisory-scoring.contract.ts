import type { ImpactScoreBreakdown } from "@/domain/types";
import type { ImpactScoreWeights } from "@/domain/scoring/config";
import type { AiServiceResult } from "./shared";

export interface TaskScoreSample {
  taskId: string;
  taskTitle: string;
  /** Pre-computed by deterministic Impact Score engine — passed in, never overwritten. */
  authoritativeScore: number;
  componentBreakdown: ImpactScoreBreakdown;
}

export interface WeightSuggestion {
  component: keyof ImpactScoreWeights;
  currentWeight: number;
  suggestedWeight: number;
  rationale: string;
  /** Suggestions are advisory; admin must explicitly accept any change. */
  advisoryOnly: true;
}

export interface AdvisoryScoringInput {
  orgId: string;
  currentWeights: ImpactScoreWeights;
  taskScoreSamples: ReadonlyArray<TaskScoreSample>;
}

export interface AdvisoryScoringOutput {
  suggestions: WeightSuggestion[];
  analysisSummary: string;
  disclaimers: string[];
  /** Confirms no authoritative scores were produced or modified by this service. */
  authoritativeScoresPreserved: true;
}

/**
 * Advisory analysis of Impact Score weight configuration.
 * Reads pre-computed deterministic scores — never calculates authoritative rankings.
 */
export interface IAdvisoryScoringAnalysisService {
  isAvailable(): boolean;
  analyzeWeights(
    input: AdvisoryScoringInput,
  ): Promise<AiServiceResult<AdvisoryScoringOutput>>;
}
