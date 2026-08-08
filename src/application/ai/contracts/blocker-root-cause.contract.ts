import type { AiServiceResult, EventCitation } from "./shared";
import type { GoalHealth, TaskStatus } from "@/domain/types";

export interface DependencyPathNode {
  type: "task" | "person" | "dependency";
  id: string;
  label: string;
}

export interface BlockerRelatedEventSnapshot {
  eventId: string;
  type: string;
  summary: string;
  timestamp: string;
}

export interface BlockerChainNodeSnapshot {
  taskId: string;
  taskTitle: string;
  taskStatus: TaskStatus;
  ownerId: string | null;
  ownerName: string | null;
  dueDate: string | null;
  daysOverdue: number | null;
  linkedGoalId: string | null;
  goalTitle: string | null;
  goalHealth: GoalHealth | null;
  depth: number;
  dependencyId: string | null;
}

export interface BlockerChainSnapshot {
  dependencyId: string;
  blockedTaskId: string | null;
  blockedTaskTitle: string | null;
  blockedPersonId: string | null;
  direction: "blocking_me" | "im_blocking";
  daysBlocked: number;
  nodes: ReadonlyArray<BlockerChainNodeSnapshot>;
  immediateBlockerTaskId: string | null;
  rootBlockerTaskId: string | null;
  rootBlockerTitle: string | null;
  hasDeeperUpstream: boolean;
  chainComplete: boolean;
  cycleDetected: boolean;
}

export interface BlockerRootCauseInput {
  dependencyId: string;
  description: string;
  direction: "blocking_me" | "im_blocking";
  path: ReadonlyArray<DependencyPathNode>;
  relatedEvents: ReadonlyArray<BlockerRelatedEventSnapshot>;
  daysBlocked: number;
  taskTitle: string | null;
  otherPartyName: string;
  blockingChain: BlockerChainSnapshot;
}

export interface BlockerRootCauseOutput {
  narrative: string;
  rootBlockerSummary: string;
  citations: EventCitation[];
  dependencyPath: ReadonlyArray<DependencyPathNode>;
  /** @deprecated Phase 4 is explanation-only; not populated */
  suggestedNextStep?: string;
  /** @deprecated Use rootBlockerSummary */
  rootCauseSummary?: string;
}

/**
 * Assistive plain-language explanation of a blocker chain.
 * Always links to underlying graph path and source events.
 */
export interface IBlockerRootCauseNarrativeService {
  isAvailable(): boolean;
  explainBlocker(
    input: BlockerRootCauseInput,
  ): Promise<AiServiceResult<BlockerRootCauseOutput>>;
}
