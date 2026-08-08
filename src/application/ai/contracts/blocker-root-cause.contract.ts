import type { AiServiceResult, EventCitation } from "./shared";

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

export interface BlockerRootCauseInput {
  dependencyId: string;
  description: string;
  direction: "blocking_me" | "im_blocking";
  path: ReadonlyArray<DependencyPathNode>;
  relatedEvents: ReadonlyArray<BlockerRelatedEventSnapshot>;
  daysBlocked: number;
  taskTitle: string | null;
  otherPartyName: string;
}

export interface BlockerRootCauseOutput {
  narrative: string;
  rootCauseSummary: string;
  suggestedNextStep: string;
  citations: EventCitation[];
  dependencyPath: ReadonlyArray<DependencyPathNode>;
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
