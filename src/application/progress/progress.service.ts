import type { Task } from "@/domain/types";
import {
  filterTasksByScope,
  resolveTaskListScope,
  type TaskListScope,
} from "@/domain/tasks/scope";
import { getGraphStore } from "@/infrastructure/store";
import { NOW } from "@/infrastructure/seed/teams";

export interface ProgressDataPoint {
  date: string;
  remaining: number;
  completed: number;
}

export interface ProgressSummaryDto {
  scope: TaskListScope;
  scopeLabel: string;
  viewerId: string;
  metricLabel: string;
  total: number;
  remaining: number;
  completed: number;
  deferred: number;
  hasHistory: boolean;
  history: ProgressDataPoint[];
  historyNote: string | null;
}

function scopeLabel(scope: TaskListScope, viewerName: string): string {
  switch (scope) {
    case "mine":
      return "My progress";
    case "team":
      return `${viewerName.split(" ")[0]}'s team progress`;
    case "organization":
      return "Organization progress";
  }
}

function startOfDayUtc(iso: string): string {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function countByStatus(tasks: Task[]) {
  return {
    remaining: tasks.filter(
      (t) => t.status === "open" || t.status === "in_progress",
    ).length,
    completed: tasks.filter((t) => t.status === "done").length,
    deferred: tasks.filter((t) => t.status === "deferred").length,
    total: tasks.length,
  };
}

export function buildProgressHistory(
  scopedTaskIds: Set<string>,
  scopedPersonIds: Set<string>,
  events: Array<{
    eventType: string;
    entityId: string;
    timestamp: string;
    relevantPersonIds: string[];
  }>,
  currentCounts: { remaining: number; completed: number },
  now: Date,
): { hasHistory: boolean; history: ProgressDataPoint[]; note: string | null } {
  const completionEvents = events
    .filter(
      (e) =>
        e.eventType === "task_completed" &&
        (scopedTaskIds.has(e.entityId) ||
          e.relevantPersonIds.some((id) => scopedPersonIds.has(id))),
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  if (completionEvents.length < 2) {
    return {
      hasHistory: false,
      history: [],
      note: "Not enough historical completion events to show a burndown yet.",
    };
  }

  const firstDay = startOfDayUtc(completionEvents[0].timestamp);
  const lastDay = startOfDayUtc(now.toISOString());
  const days: string[] = [];
  const cursor = new Date(`${firstDay}T00:00:00.000Z`);
  const end = new Date(`${lastDay}T00:00:00.000Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const totalAtStart =
    currentCounts.remaining +
    currentCounts.completed +
    completionEvents.length;

  const history: ProgressDataPoint[] = days.map((day) => {
    const dayEnd = new Date(`${day}T23:59:59.999Z`);
    const completedByDay = completionEvents.filter(
      (e) => new Date(e.timestamp) <= dayEnd,
    ).length;
    return {
      date: day,
      completed: completedByDay,
      remaining: Math.max(0, totalAtStart - completedByDay),
    };
  });

  return {
    hasHistory: true,
    history,
    note: "Remaining work derived from task completion events in scope.",
  };
}

export function getProgressSummary(
  viewerId: string,
  requestedScope?: TaskListScope | null,
  now: Date = NOW,
): ProgressSummaryDto | null {
  const store = getGraphStore();
  const graph = store.getGraph();
  const viewer = store.getPerson(viewerId);
  if (!viewer) return null;

  const scope = resolveTaskListScope(viewer.role, requestedScope);
  const scopedTasks = filterTasksByScope(
    graph,
    graph.tasks,
    scope,
    viewerId,
    viewer.teamId,
    (id) => store.getDirectReports(id),
  );

  const counts = countByStatus(scopedTasks);
  const scopedIds = new Set(scopedTasks.map((t) => t.id));
  const scopedPersonIds = new Set(scopedTasks.map((t) => t.ownerId));
  const { hasHistory, history, note } = buildProgressHistory(
    scopedIds,
    scopedPersonIds,
    graph.events,
    counts,
    now,
  );

  return {
    scope,
    scopeLabel: scopeLabel(scope, viewer.name),
    viewerId,
    metricLabel: "Tasks (count)",
    total: counts.total,
    remaining: counts.remaining,
    completed: counts.completed,
    deferred: counts.deferred,
    hasHistory,
    history,
    historyNote: note,
  };
}
