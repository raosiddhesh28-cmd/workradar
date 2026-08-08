import type { ImpactScoreConfig } from "../config";
import type { OrgGraph, Task } from "../../types";
import { getBlockedPartiesForTask } from "../../graph/impact-graph";

export function computeStakeholderTier(
  graph: OrgGraph,
  task: Task,
  config: ImpactScoreConfig,
): number {
  const { personIds } = getBlockedPartiesForTask(
    graph,
    task.id,
    config.maxTraverseDepth,
  );

  const owner = graph.people.find((p) => p.id === task.ownerId);
  const tiers = [
    owner?.tier ?? "ic",
    ...personIds.map(
      (id) => graph.people.find((p) => p.id === id)?.tier ?? "ic",
    ),
  ];

  const maxWeight = Math.max(
    ...tiers.map((t) => config.tierWeights[t] ?? 0.2),
  );
  return maxWeight;
}
