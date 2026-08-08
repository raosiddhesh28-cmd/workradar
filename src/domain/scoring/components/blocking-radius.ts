import type { ImpactScoreConfig } from "../config";
import type { OrgGraph, Task } from "../../types";
import { getBlockedPartiesForTask } from "../../graph/impact-graph";

export function computeBlockingRadius(
  graph: OrgGraph,
  task: Task,
  config: ImpactScoreConfig,
): number {
  const { taskIds, personIds } = getBlockedPartiesForTask(
    graph,
    task.id,
    config.maxTraverseDepth,
  );

  if (taskIds.length === 0 && personIds.length === 0) return 0;

  let weighted = 0;
  for (const personId of personIds) {
    const person = graph.people.find((p) => p.id === personId);
    const tier = person?.tier ?? "ic";
    weighted += config.tierWeights[tier] ?? 0.2;
  }

  const raw = weighted + taskIds.length * 0.3;
  return Math.min(1, raw / 3);
}
