import type { AiServiceResult } from "../contracts/shared";
import type { DigestNarrativeOutput } from "../contracts/digest-narrative.contract";
import type { BlockerRootCauseOutput } from "../contracts/blocker-root-cause.contract";
import type { NlInputParsingOutput } from "../contracts/nl-input-parsing.contract";
import type { AdvisoryScoringOutput } from "../contracts/advisory-scoring.contract";
import {
  buildDigestNarrativeContext,
  buildBlockerRootCauseContext,
  buildAdvisoryScoringContext,
} from "../context/build-ai-context";
import {
  getDigestNarrativeService,
  getBlockerRootCauseNarrativeService,
  getNaturalLanguageInputParsingService,
  getAdvisoryScoringAnalysisService,
  withAiFallback,
  buildDigestFallback,
  buildBlockerFallback,
  buildNlParsingFallback,
  buildAdvisoryScoringFallback,
} from "@/infrastructure/ai";
import { ORG_ID } from "@/infrastructure/seed/teams";

/**
 * Application-layer orchestration for AI assistive capabilities.
 * Builds read-only context, invokes AI ports, and applies fallback when needed.
 * Does not mutate graph state or authoritative scoring.
 */
export async function generateDigestNarrative(
  personId: string,
  now: Date,
): Promise<AiServiceResult<DigestNarrativeOutput>> {
  const context = buildDigestNarrativeContext(personId, now);
  const service = getDigestNarrativeService();

  return withAiFallback(
    () => service.generateNarrative(context),
    () => buildDigestFallback(context),
  );
}

export async function explainBlockerRootCause(
  dependencyId: string,
  personId: string,
  now: Date,
): Promise<AiServiceResult<BlockerRootCauseOutput>> {
  const context = buildBlockerRootCauseContext(dependencyId, personId, now);
  const service = getBlockerRootCauseNarrativeService();

  return withAiFallback(
    () => service.explainBlocker(context),
    () => buildBlockerFallback(context),
  );
}

export async function parseNaturalLanguageInput(
  rawInput: string,
  actorPersonId: string,
): Promise<AiServiceResult<NlInputParsingOutput>> {
  const context = { rawInput, actorPersonId, orgId: ORG_ID };
  const service = getNaturalLanguageInputParsingService();

  return withAiFallback(
    () => service.parseInput(context),
    () => buildNlParsingFallback(context),
  );
}

export async function analyzeScoringWeights(
  personId: string | undefined,
  now: Date,
): Promise<AiServiceResult<AdvisoryScoringOutput>> {
  const context = buildAdvisoryScoringContext(ORG_ID, personId, now);
  const service = getAdvisoryScoringAnalysisService();

  return withAiFallback(
    () => service.analyzeWeights(context),
    () => buildAdvisoryScoringFallback(context),
  );
}
