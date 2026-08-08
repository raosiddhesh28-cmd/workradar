import type { IDigestNarrativeService } from "@/application/ai/contracts/digest-narrative.contract";
import type { IBlockerRootCauseNarrativeService } from "@/application/ai/contracts/blocker-root-cause.contract";
import type { INaturalLanguageInputParsingService } from "@/application/ai/contracts/nl-input-parsing.contract";
import type { IAdvisoryScoringAnalysisService } from "@/application/ai/contracts/advisory-scoring.contract";
import type { IDigestProvider } from "@/application/ai/contracts/digest-provider.contract";
import { MockDigestNarrativeService } from "./mock/mock-digest-narrative.service";
import { MockBlockerRootCauseNarrativeService } from "./mock/mock-blocker-root-cause.service";
import { MockNaturalLanguageInputParsingService } from "./mock/mock-nl-input-parsing.service";
import { MockAdvisoryScoringAnalysisService } from "./mock/mock-advisory-scoring.service";
import { MockDigestProvider } from "./mock/mock-grounded-digest-provider";

let digestService: MockDigestNarrativeService | null = null;
let blockerService: MockBlockerRootCauseNarrativeService | null = null;
let nlParsingService: MockNaturalLanguageInputParsingService | null = null;
let advisoryService: MockAdvisoryScoringAnalysisService | null = null;
let digestProvider: MockDigestProvider | null = null;

export function getDigestNarrativeService(): IDigestNarrativeService {
  if (!digestService) digestService = new MockDigestNarrativeService();
  return digestService;
}

export function getBlockerRootCauseNarrativeService(): IBlockerRootCauseNarrativeService {
  if (!blockerService) blockerService = new MockBlockerRootCauseNarrativeService();
  return blockerService;
}

export function getNaturalLanguageInputParsingService(): INaturalLanguageInputParsingService {
  if (!nlParsingService) nlParsingService = new MockNaturalLanguageInputParsingService();
  return nlParsingService;
}

export function getAdvisoryScoringAnalysisService(): IAdvisoryScoringAnalysisService {
  if (!advisoryService) advisoryService = new MockAdvisoryScoringAnalysisService();
  return advisoryService;
}

export function getDigestProvider(): IDigestProvider {
  if (!digestProvider) digestProvider = new MockDigestProvider();
  return digestProvider;
}

/** Resets all mock service singletons — for tests. */
export function resetAiServices(): void {
  digestService = null;
  blockerService = null;
  nlParsingService = null;
  advisoryService = null;
  digestProvider = null;
}

export { MockDigestNarrativeService } from "./mock/mock-digest-narrative.service";
export { MockBlockerRootCauseNarrativeService } from "./mock/mock-blocker-root-cause.service";
export { MockNaturalLanguageInputParsingService } from "./mock/mock-nl-input-parsing.service";
export { MockAdvisoryScoringAnalysisService } from "./mock/mock-advisory-scoring.service";
export { MockDigestProvider } from "./mock/mock-grounded-digest-provider";
export { LlmDigestProviderStub } from "./providers/llm-digest-provider.stub";
export * from "./fallback/fallback-generators";
export * from "./resilient/with-ai-fallback";
