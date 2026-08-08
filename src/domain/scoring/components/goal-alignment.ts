import type { OrgGraph, Task } from "../../types";
import { findNearestStrategicGoal } from "../../graph/impact-graph";

export function computeGoalAlignment(graph: OrgGraph, task: Task): number {
  const nearest = findNearestStrategicGoal(graph, task);
  if (!nearest) return 0;
  if (nearest.goal.healthStatus === "breached") return 0.9;
  if (nearest.goal.healthStatus === "at_risk") return 0.75;
  return 1 / (1 + nearest.hops);
}
