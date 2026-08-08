import type {
  IBlockerRootCauseNarrativeService,
  BlockerRootCauseInput,
  BlockerRootCauseOutput,
} from "@/application/ai/contracts/blocker-root-cause.contract";
import { createAiResult } from "@/application/ai/contracts/shared";
import {
  buildDeterministicBlockerNarrative,
  buildRootBlockerSummary,
} from "@/domain/graph/blocker-chain";

const RECOMMENDATION_PATTERNS = [
  /contact\s+/i,
  /escalat/i,
  /schedule\s+a\s+meeting/i,
  /repriorit/i,
  /follow\s+up\s+with/i,
  /best\s+next\s+action/i,
];

function assertNoRecommendations(text: string): void {
  for (const pattern of RECOMMENDATION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`Narrative must not contain recommendations: ${text}`);
    }
  }
}

function buildNarrativeFromFacts(input: BlockerRootCauseInput): string {
  const chain = input.blockingChain;
  const parts: string[] = [];

  if (input.direction === "blocking_me") {
    const immediate = chain.nodes.find(
      (n) => n.taskId === chain.immediateBlockerTaskId,
    );
    if (immediate) {
      const ownerPart = immediate.ownerName ? `, owned by ${immediate.ownerName}` : "";
      parts.push(`You are blocked by ${immediate.taskTitle}${ownerPart}.`);
    } else {
      parts.push(`Your work is waiting on ${input.otherPartyName}.`);
    }
  } else {
    const blockedTitle = chain.blockedTaskTitle ?? input.taskTitle;
    if (blockedTitle) {
      parts.push(`${blockedTitle} is waiting on your work.`);
    }
  }

  if (
    chain.immediateBlockerTaskId &&
    chain.rootBlockerTaskId &&
    chain.immediateBlockerTaskId !== chain.rootBlockerTaskId
  ) {
    const immediate = chain.nodes.find((n) => n.taskId === chain.immediateBlockerTaskId);
    const root = chain.nodes.find((n) => n.taskId === chain.rootBlockerTaskId);
    if (immediate && root) {
      parts.push(
        `${immediate.taskTitle} is itself blocked by ${root.taskTitle}.`,
      );
    }
  }

  const contextNode = chain.nodes[0];
  if (contextNode?.goalTitle && contextNode.goalHealth) {
    const healthLabel = contextNode.goalHealth.replace("_", " ");
    parts.push(
      `${contextNode.taskTitle} is linked to ${contextNode.goalTitle}, which is currently ${healthLabel}.`,
    );
  }

  if (chain.hasDeeperUpstream && !chain.cycleDetected) {
    parts.push(
      "WorkRadar cannot identify a deeper upstream blocker from the available dependency data.",
    );
  }

  if (chain.cycleDetected) {
    parts.push("A cyclic dependency was detected in the blocker chain.");
  }

  return parts.join(" ");
}

export class MockBlockerRootCauseNarrativeService
  implements IBlockerRootCauseNarrativeService
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

  async explainBlocker(
    input: BlockerRootCauseInput,
  ): Promise<ReturnType<typeof createAiResult<BlockerRootCauseOutput>>> {
    const citations = input.relatedEvents.map((e, i) => ({
      eventId: e.eventId,
      sequence: i + 1,
      type: e.type,
      timestamp: e.timestamp,
    }));

    if (!this.available) {
      const narrative = buildDeterministicBlockerNarrative({
        ...input.blockingChain,
        cycleTaskIds: [],
        traceRefs: [],
      });
      return createAiResult({
        data: {
          narrative,
          rootBlockerSummary: buildRootBlockerSummary({
            ...input.blockingChain,
            cycleTaskIds: [],
            traceRefs: [],
          }),
          citations,
          dependencyPath: input.path,
        },
        status: "unavailable",
        source: "deterministic-fallback",
        fallbackReason: "Mock blocker narrative service unavailable",
      });
    }

    if (this.shouldThrow) {
      throw new Error("Mock blocker narrative service failure");
    }

    const narrative = buildNarrativeFromFacts(input);
    assertNoRecommendations(narrative);

    return createAiResult({
      data: {
        narrative,
        rootBlockerSummary: buildRootBlockerSummary({
          ...input.blockingChain,
          cycleTaskIds: [],
          traceRefs: [],
        }),
        citations,
        dependencyPath: input.path,
      },
      status: "success",
      source: "mock-ai",
    });
  }
}
