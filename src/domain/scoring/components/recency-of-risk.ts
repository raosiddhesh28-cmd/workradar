import type { OrgGraph, Task } from "../../types";

const RECENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

export function computeRecencyOfRisk(
  graph: OrgGraph,
  task: Task,
  now: Date,
): number {
  let boost = 0;
  const cutoff = now.getTime() - RECENCY_WINDOW_MS;

  if (task.linkedGoalId) {
    const goal = graph.goals.find((g) => g.id === task.linkedGoalId);
    if (goal?.healthStatus === "at_risk" || goal?.healthStatus === "breached") {
      const recentGoalEvent = graph.events.some(
        (e) =>
          e.entityId === goal.id &&
          e.eventType === "goal_health_changed" &&
          new Date(e.timestamp).getTime() >= cutoff,
      );
      boost = Math.max(boost, recentGoalEvent ? 1 : 0.6);
    }
  }

  const recentBlocker = graph.events.some(
    (e) =>
      e.entityId === task.id &&
      (e.eventType === "blocker_created" || e.eventType === "dependency_unblocked") &&
      new Date(e.timestamp).getTime() >= cutoff,
  );
  if (recentBlocker) boost = Math.max(boost, 0.8);

  const unresolvedBlocker = graph.dependencies.some(
    (d) =>
      d.status === "unresolved" &&
      (d.blockerTaskId === task.id || d.blockedTaskId === task.id),
  );
  if (unresolvedBlocker && boost === 0) boost = 0.4;

  return boost;
}
