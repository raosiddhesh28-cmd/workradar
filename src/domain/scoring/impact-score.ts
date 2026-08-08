import type {
  ImpactScoreBreakdown,
  ImpactScoreSnapshot,
  OrgGraph,
  Task,
} from "../types";
import {
  DEFAULT_IMPACT_SCORE_CONFIG,
  type ImpactScoreConfig,
  computeWeightedScore,
} from "./config";
import { computeGoalAlignment } from "./components/goal-alignment";
import { computeBlockingRadius } from "./components/blocking-radius";
import { computeUrgencyDecay } from "./components/urgency-decay";
import { computeStakeholderTier } from "./components/stakeholder-tier";
import { computeRecencyOfRisk } from "./components/recency-of-risk";
import { computeStalenessPenalty } from "./components/staleness-penalty";
import { buildOneLineWhy } from "./explain";

export function computeImpactScore(
  graph: OrgGraph,
  task: Task,
  now: Date = new Date(),
  config: ImpactScoreConfig = DEFAULT_IMPACT_SCORE_CONFIG,
): ImpactScoreSnapshot {
  const componentBreakdown: ImpactScoreBreakdown = {
    goalAlignment: computeGoalAlignment(graph, task),
    blockingRadius: computeBlockingRadius(graph, task, config),
    urgency: computeUrgencyDecay(task, now, config),
    stakeholderTier: computeStakeholderTier(graph, task, config),
    recencyOfRisk: computeRecencyOfRisk(graph, task, now),
    staleness: computeStalenessPenalty(task, config),
  };

  const score = computeWeightedScore(componentBreakdown, config.weights);

  return {
    taskId: task.id,
    score,
    componentBreakdown,
    oneLineWhy: buildOneLineWhy(graph, task, componentBreakdown, now),
    computedAt: now.toISOString(),
  };
}

export function scoreOpenTasks(
  graph: OrgGraph,
  ownerId?: string,
  now: Date = new Date(),
  config: ImpactScoreConfig = DEFAULT_IMPACT_SCORE_CONFIG,
) {
  const openTasks = graph.tasks.filter(
    (t) =>
      (t.status === "open" || t.status === "in_progress") &&
      (!ownerId || t.ownerId === ownerId),
  );

  return openTasks
    .map((task) => ({
      ...task,
      impactScore: computeImpactScore(graph, task, now, config),
    }))
    .sort((a, b) => b.impactScore.score - a.impactScore.score);
}
