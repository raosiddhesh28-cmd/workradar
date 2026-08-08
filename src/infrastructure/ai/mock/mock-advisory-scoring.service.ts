import type {
  IAdvisoryScoringAnalysisService,
  AdvisoryScoringInput,
  AdvisoryScoringOutput,
} from "@/application/ai/contracts/advisory-scoring.contract";
import type { ImpactScoreWeights } from "@/domain/scoring/config";
import { createAiResult } from "@/application/ai/contracts/shared";

function averageComponent(
  input: AdvisoryScoringInput,
  key: keyof AdvisoryScoringInput["taskScoreSamples"][0]["componentBreakdown"],
): number {
  if (input.taskScoreSamples.length === 0) return 0;
  const sum = input.taskScoreSamples.reduce(
    (acc, s) => acc + s.componentBreakdown[key],
    0,
  );
  return sum / input.taskScoreSamples.length;
}

export class MockAdvisoryScoringAnalysisService
  implements IAdvisoryScoringAnalysisService
{
  private available = true;
  private shouldThrow = false;

  isAvailable(): boolean {
    return this.available;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  async analyzeWeights(
    input: AdvisoryScoringInput,
  ): Promise<ReturnType<typeof createAiResult<AdvisoryScoringOutput>>> {
    if (!this.available) {
      return createAiResult({
        data: {
          suggestions: [],
          analysisSummary: "Advisory analysis unavailable.",
          disclaimers: ["Default weights unchanged."],
          authoritativeScoresPreserved: true,
        },
        status: "unavailable",
        source: "deterministic-fallback",
        fallbackReason: "Mock advisory scoring service unavailable",
      });
    }

    if (this.shouldThrow) {
      throw new Error("Mock advisory scoring service failure");
    }

    const avgBlocking = averageComponent(input, "blockingRadius");
    const avgUrgency = averageComponent(input, "urgency");
    const suggestions: AdvisoryScoringOutput["suggestions"] = [];

    if (avgBlocking > 0.5) {
      suggestions.push(
        makeSuggestion(
          input.currentWeights,
          "blockingRadius",
          0.28,
          "Sample tasks show high blocking-radius values — consider slightly increasing this weight (admin must accept).",
        ),
      );
    }

    if (avgUrgency > 0.6) {
      suggestions.push(
        makeSuggestion(
          input.currentWeights,
          "urgency",
          0.22,
          "Sample tasks show elevated urgency — consider a modest urgency weight increase (advisory only).",
        ),
      );
    }

    return createAiResult({
      data: {
        suggestions,
        analysisSummary:
          suggestions.length > 0
            ? `Reviewed ${input.taskScoreSamples.length} pre-computed score sample(s). ${suggestions.length} advisory weight adjustment(s) suggested.`
            : `Reviewed ${input.taskScoreSamples.length} pre-computed score sample(s). Current weights appear reasonable for the sample set.`,
        disclaimers: [
          "Suggestions are advisory only — admin must explicitly accept any weight change.",
          "Impact Score rankings remain computed by the deterministic engine.",
          "No authoritative scores were modified by this analysis.",
        ],
        authoritativeScoresPreserved: true,
      },
      status: "success",
      source: "mock-ai",
    });
  }
}

function makeSuggestion(
  weights: ImpactScoreWeights,
  component: keyof ImpactScoreWeights,
  suggestedWeight: number,
  rationale: string,
): AdvisoryScoringOutput["suggestions"][number] {
  return {
    component,
    currentWeight: weights[component],
    suggestedWeight,
    rationale,
    advisoryOnly: true,
  };
}
