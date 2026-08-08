import type { OrgGraph, Task, TaskStatus } from "@/domain/types";
import { isTaskBlocked } from "@/domain/graph/impact-graph";
import { getTeamForPerson } from "@/domain/organization/scope";
import {
  filterTasksByScope,
  resolveTaskListScope,
  type TaskListScope,
} from "@/domain/tasks/scope";
import { getGraphStore } from "@/infrastructure/store";
import { NOW } from "@/infrastructure/seed/teams";

export interface TimelineBar {
  taskId: string;
  title: string;
  assigneeName: string;
  teamName: string;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  dueDate: string | null;
  isBlocked: boolean;
  predecessorIds: string[];
  hasEstimatedDates: boolean;
}

export interface TimelineDto {
  scope: TaskListScope;
  scopeLabel: string;
  viewerId: string;
  rangeStart: string;
  rangeEnd: string;
  bars: TimelineBar[];
  excludedCount: number;
}

const DEFAULT_BAR_DAYS = 3;

function scopeLabel(scope: TaskListScope, viewerName: string): string {
  switch (scope) {
    case "mine":
      return "My timeline";
    case "team":
      return `${viewerName.split(" ")[0]}'s team timeline`;
    case "organization":
      return "Organization timeline";
  }
}

function resolveTimelineDates(task: Task): {
  start: string;
  end: string;
  estimated: boolean;
} | null {
  const start = task.startDate;
  const due = task.dueDate;

  if (start && due) {
    return { start, end: due, estimated: false };
  }
  if (due) {
    const endMs = new Date(due).getTime();
    const startMs = endMs - DEFAULT_BAR_DAYS * 24 * 60 * 60 * 1000;
    return {
      start: new Date(startMs).toISOString(),
      end: due,
      estimated: true,
    };
  }
  if (start) {
    const startMs = new Date(start).getTime();
    const endMs = startMs + DEFAULT_BAR_DAYS * 24 * 60 * 60 * 1000;
    return {
      start,
      end: new Date(endMs).toISOString(),
      estimated: true,
    };
  }
  return null;
}

function getPredecessors(graph: OrgGraph, taskId: string): string[] {
  return graph.dependencies
    .filter(
      (d) =>
        d.status === "unresolved" &&
        d.blockedTaskId === taskId &&
        d.blockerTaskId,
    )
    .map((d) => d.blockerTaskId!);
}

function buildTimelineBar(graph: OrgGraph, task: Task): TimelineBar | null {
  const dates = resolveTimelineDates(task);
  if (!dates) return null;

  const owner = graph.people.find((p) => p.id === task.ownerId);
  const team = owner ? getTeamForPerson(graph, owner.id) : null;

  return {
    taskId: task.id,
    title: task.title,
    assigneeName: owner?.name ?? "Unassigned",
    teamName: team?.teamName ?? "Unknown team",
    status: task.status,
    startDate: dates.start,
    endDate: dates.end,
    dueDate: task.dueDate,
    isBlocked: isTaskBlocked(graph, task.id),
    predecessorIds: getPredecessors(graph, task.id),
    hasEstimatedDates: dates.estimated,
  };
}

export function getTimeline(
  viewerId: string,
  requestedScope?: TaskListScope | null,
  now: Date = NOW,
): TimelineDto | null {
  const store = getGraphStore();
  const graph = store.getGraph();
  const viewer = store.getPerson(viewerId);
  if (!viewer) return null;

  const scope = resolveTaskListScope(viewer.role, requestedScope);
  const scopedTasks = filterTasksByScope(
    graph,
    graph.tasks.filter(
      (t) => t.status === "open" || t.status === "in_progress" || t.status === "done",
    ),
    scope,
    viewerId,
    viewer.teamId,
    (id) => store.getDirectReports(id),
  );

  const bars: TimelineBar[] = [];
  let excludedCount = 0;

  for (const task of scopedTasks) {
    const bar = buildTimelineBar(graph, task);
    if (bar) bars.push(bar);
    else excludedCount += 1;
  }

  bars.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  let rangeStart = now.toISOString();
  let rangeEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  if (bars.length > 0) {
    const starts = bars.map((b) => new Date(b.startDate).getTime());
    const ends = bars.map((b) => new Date(b.endDate).getTime());
    rangeStart = new Date(Math.min(...starts)).toISOString();
    rangeEnd = new Date(Math.max(...ends, now.getTime())).toISOString();
  }

  return {
    scope,
    scopeLabel: scopeLabel(scope, viewer.name),
    viewerId,
    rangeStart,
    rangeEnd,
    bars,
    excludedCount,
  };
}

export function timelinePositionPercent(
  iso: string,
  rangeStart: string,
  rangeEnd: string,
): number {
  const start = new Date(rangeStart).getTime();
  const end = new Date(rangeEnd).getTime();
  const value = new Date(iso).getTime();
  if (end <= start) return 0;
  return Math.min(100, Math.max(0, ((value - start) / (end - start)) * 100));
}

export function timelineBarStyle(
  bar: TimelineBar,
  rangeStart: string,
  rangeEnd: string,
): { left: string; width: string } {
  const left = timelinePositionPercent(bar.startDate, rangeStart, rangeEnd);
  const right = timelinePositionPercent(bar.endDate, rangeStart, rangeEnd);
  const width = Math.max(2, right - left);
  return { left: `${left}%`, width: `${width}%` };
}
