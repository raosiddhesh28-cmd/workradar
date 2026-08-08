import type { AiServiceResult } from "@/application/ai/contracts/shared";
import type { BlockerRootCauseOutput } from "@/application/ai/contracts/blocker-root-cause.contract";
import { buildBlockerRootCauseContext } from "@/application/ai/context/build-ai-context";
import {
  getBlockerRootCauseNarrativeService,
  withAiFallback,
  buildBlockerFallback,
} from "@/infrastructure/ai";
import type { BlockerChain } from "@/domain/graph/blocker-chain";
import {
  buildBlockerChainForDependency,
  buildDeterministicBlockerNarrative,
  buildRootBlockerSummary,
} from "@/domain/graph/blocker-chain";
import type { Dependency } from "@/domain/types";
import { getGraphStore } from "@/infrastructure/store";

export interface BlockerNarrativeResult {
  narrative: string;
  rootBlockerSummary: string;
  aiStatus: AiServiceResult<BlockerRootCauseOutput>["status"];
  aiSource: AiServiceResult<BlockerRootCauseOutput>["source"];
}

export async function explainBlockerChain(
  dependencyId: string,
  personId: string,
  now: Date,
): Promise<BlockerNarrativeResult> {
  const context = buildBlockerRootCauseContext(dependencyId, personId, now);
  const service = getBlockerRootCauseNarrativeService();

  const result = await withAiFallback(
    () => service.explainBlocker(context),
    () => buildBlockerFallback(context),
  );

  return {
    narrative: result.data.narrative,
    rootBlockerSummary: result.data.rootBlockerSummary,
    aiStatus: result.status,
    aiSource: result.source,
  };
}

export function buildBlockerChain(
  dependency: Dependency,
  direction: "blocking_me" | "im_blocking",
  now: Date,
): BlockerChain {
  const graph = getGraphStore().getGraph();
  return buildBlockerChainForDependency(graph, dependency, direction, now);
}

export function getDeterministicBlockerNarrative(chain: BlockerChain): BlockerNarrativeResult {
  return {
    narrative: buildDeterministicBlockerNarrative(chain),
    rootBlockerSummary: buildRootBlockerSummary(chain),
    aiStatus: "fallback",
    aiSource: "deterministic-fallback",
  };
}
