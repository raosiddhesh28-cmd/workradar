import type { ImpactScoreBreakdown, OrgGraph, Task } from "../types";
import { findNearestStrategicGoal, getBlockedPartiesForTask } from "../graph/impact-graph";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "./config";

function daysUntilDue(task: Task, now: Date): number | null {
  if (!task.dueDate) return null;
  const due = new Date(task.dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildOneLineWhy(
  graph: OrgGraph,
  task: Task,
  breakdown: ImpactScoreBreakdown,
  now: Date = new Date(),
): string {
  const parts: string[] = [];
  const { personIds } = getBlockedPartiesForTask(
    graph,
    task.id,
    DEFAULT_IMPACT_SCORE_CONFIG.maxTraverseDepth,
  );

  if (personIds.length > 0) {
    parts.push(
      `Blocks ${personIds.length} ${personIds.length === 1 ? "person" : "people"}`,
    );
  }

  const strategic = findNearestStrategicGoal(graph, task);
  if (strategic) {
    const goalLabel =
      strategic.goal.healthStatus === "at_risk"
        ? `${strategic.goal.title} (at risk)`
        : strategic.goal.title;
    parts.push(`Tied to ${goalLabel}`);
  } else if (!task.linkedGoalId) {
    parts.push("No linked goal — data quality signal");
  }

  const days = daysUntilDue(task, now);
  if (days !== null) {
    if (days <= 0) parts.push("Overdue");
    else if (days === 1) parts.push("Due tomorrow");
    else if (days <= 7) parts.push(`Due in ${days} days`);
  }

  if (breakdown.recencyOfRisk >= 0.6) {
    parts.push("Recently escalated");
  }

  if (parts.length === 0) {
    parts.push("Moderate organizational impact");
  }

  return parts.join(" · ");
}
