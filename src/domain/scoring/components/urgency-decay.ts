import type { ImpactScoreConfig } from "../config";
import type { Task } from "../../types";

export function computeUrgencyDecay(
  task: Task,
  now: Date,
  config: ImpactScoreConfig,
): number {
  if (!task.dueDate) return 0.3;

  const due = new Date(task.dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.max(0, (due.getTime() - now.getTime()) / msPerDay);

  if (daysUntilDue <= 0) return 1;

  return 1 / Math.pow(1 + daysUntilDue, config.urgencyDecayExponent);
}
