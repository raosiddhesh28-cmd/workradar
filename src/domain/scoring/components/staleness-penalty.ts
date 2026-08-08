import type { ImpactScoreConfig } from "../config";
import type { Task } from "../../types";

export function computeStalenessPenalty(
  task: Task,
  config: ImpactScoreConfig,
): number {
  return Math.min(1, task.surfacedCount * config.stalenessMultiplier);
}
