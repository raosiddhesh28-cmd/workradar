import type {
  DigestNarrativeInput,
  DigestNarrativeOutput,
} from "@/application/ai/contracts/digest-narrative.contract";
import type {
  BlockerRootCauseInput,
  BlockerRootCauseOutput,
} from "@/application/ai/contracts/blocker-root-cause.contract";
import type {
  NlInputParsingInput,
  NlInputParsingOutput,
} from "@/application/ai/contracts/nl-input-parsing.contract";
import type {
  AdvisoryScoringInput,
  AdvisoryScoringOutput,
} from "@/application/ai/contracts/advisory-scoring.contract";
import { createAiResult } from "@/application/ai/contracts/shared";

export function buildDigestFallback(
  input: DigestNarrativeInput,
): ReturnType<typeof createAiResult<DigestNarrativeOutput>> {
  if (input.events.length === 0) {
    return createAiResult({
      data: {
        headline: "No activity in this window",
        items: [
          {
            summary: "No events recorded for you in the selected time window.",
            citedEventIds: [],
          },
        ],
        allCitedEventIds: [],
      },
      status: "fallback",
      source: "deterministic-fallback",
      fallbackReason: "Showing raw event list (no AI narrative available)",
    });
  }

  const items = input.events.map((e) => ({
    summary: e.summary,
    citedEventIds: [e.eventId],
  }));

  return createAiResult({
    data: {
      headline: `${input.events.length} update(s) since ${input.timeWindow.since}`,
      items,
      allCitedEventIds: input.events.map((e) => e.eventId),
    },
    status: "fallback",
    source: "deterministic-fallback",
    fallbackReason: "Showing unsummarized event list",
  });
}

export function buildBlockerFallback(
  input: BlockerRootCauseInput,
): ReturnType<typeof createAiResult<BlockerRootCauseOutput>> {
  const pathLabels = input.path.map((n) => n.label).join(" → ");
  const narrative = [
    input.direction === "blocking_me"
      ? `You are blocked by: ${input.otherPartyName}.`
      : `You are blocking: ${input.otherPartyName}.`,
    input.description,
    `Open for ${input.daysBlocked} day(s).`,
    pathLabels ? `Dependency path: ${pathLabels}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return createAiResult({
    data: {
      narrative,
      rootCauseSummary: input.description,
      suggestedNextStep: "Review the dependency path and coordinate with the other party.",
      citations: input.relatedEvents.map((e, i) => ({
        eventId: e.eventId,
        sequence: i + 1,
        type: e.type,
        timestamp: e.timestamp,
      })),
      dependencyPath: input.path,
    },
    status: "fallback",
    source: "deterministic-fallback",
    fallbackReason: "Showing raw dependency path without AI narrative",
  });
}

export function buildNlParsingFallback(
  input: NlInputParsingInput,
): ReturnType<typeof createAiResult<NlInputParsingOutput>> {
  return createAiResult({
    data: {
      parsed: {
        intent: "unknown",
        reason: "Could not parse input — use the manual form instead.",
      },
      confidence: 0,
      requiresConfirmation: true,
      originalInput: input.rawInput,
    },
    status: "fallback",
    source: "deterministic-fallback",
    fallbackReason: "NL parsing unavailable — manual entry required",
  });
}

export function buildAdvisoryScoringFallback(
  input: AdvisoryScoringInput,
): ReturnType<typeof createAiResult<AdvisoryScoringOutput>> {
  return createAiResult({
    data: {
      suggestions: [],
      analysisSummary:
        "Advisory weight analysis is unavailable. Default weights remain in effect until an admin explicitly changes them.",
      disclaimers: [
        "Impact Score rankings are computed by the deterministic engine only.",
        "No weight changes have been applied.",
        `Analyzed ${input.taskScoreSamples.length} pre-computed score sample(s).`,
      ],
      authoritativeScoresPreserved: true,
    },
    status: "fallback",
    source: "deterministic-fallback",
    fallbackReason: "Advisory analysis unavailable — default weights unchanged",
  });
}
