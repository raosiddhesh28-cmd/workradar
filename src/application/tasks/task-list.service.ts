import type { GoalHealth, OrgGraph, Task, TaskStatus } from "@/domain/types";
import { computeImpactScore } from "@/domain/scoring/impact-score";
import { isTaskBlocked } from "@/domain/graph/impact-graph";
import { findNearestStrategicGoal } from "@/domain/graph/impact-graph";
import { getTeamForPerson } from "@/domain/organization/scope";
import {
  filterTasksByScope,
  resolveTaskListScope,
  type TaskListScope,
} from "@/domain/tasks/scope";
import {
  classifyDueDate,
  type DueDateClassification,
  type DueDateStatus,
} from "@/domain/scheduling/due-date";
import { getGraphStore } from "@/infrastructure/store";
import { NOW } from "@/infrastructure/seed/teams";

export interface TaskListFilters {
  assigneeId?: string;
  status?: TaskStatus;
  teamId?: string;
  goalId?: string;
  blocked?: boolean;
  atRisk?: boolean;
  dueDateStatus?: DueDateStatus;
}

export interface TaskListItem {
  task: Task;
  assigneeName: string;
  teamName: string;
  goalTitle: string | null;
  goalHealth: GoalHealth | null;
  impactScore: number | null;
  impactLabel: string;
  isBlocked: boolean;
  dueDate: DueDateClassification;
}

export interface TaskListDto {
  scope: TaskListScope;
  scopeLabel: string;
  viewerId: string;
  viewerName: string;
  items: TaskListItem[];
  filters: TaskListFilters;
  availableAssignees: Array<{ id: string; name: string }>;
  availableTeams: Array<{ id: string; name: string }>;
  availableGoals: Array<{ id: string; title: string }>;
}

function impactLabel(score: number): string {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function scopeLabel(scope: TaskListScope, viewerName: string): string {
  switch (scope) {
    case "mine":
      return "My tasks";
    case "team":
      return `${viewerName.split(" ")[0]}'s team`;
    case "organization":
      return "Organization";
  }
}

function isTaskAtRisk(graph: OrgGraph, task: Task): boolean {
  const goal = task.linkedGoalId
    ? graph.goals.find((g) => g.id === task.linkedGoalId)
    : null;
  const strategic = findNearestStrategicGoal(graph, task);
  const health = strategic?.goal.healthStatus ?? goal?.healthStatus;
  return health === "at_risk" || health === "breached";
}

function applyFilters(
  graph: OrgGraph,
  items: TaskListItem[],
  filters: TaskListFilters,
): TaskListItem[] {
  return items.filter((item) => {
    if (filters.assigneeId && item.task.ownerId !== filters.assigneeId) {
      return false;
    }
    if (filters.status && item.task.status !== filters.status) return false;
    if (filters.teamId) {
      const owner = graph.people.find((p) => p.id === item.task.ownerId);
      if (owner?.teamId !== filters.teamId) return false;
    }
    if (filters.goalId) {
      const linked =
        item.task.linkedGoalId === filters.goalId ||
        findNearestStrategicGoal(graph, item.task)?.goal.id === filters.goalId;
      if (!linked) return false;
    }
    if (filters.blocked === true && !item.isBlocked) return false;
    if (filters.blocked === false && item.isBlocked) return false;
    if (filters.atRisk === true && !isTaskAtRisk(graph, item.task)) return false;
    if (filters.atRisk === false && isTaskAtRisk(graph, item.task)) return false;
    if (
      filters.dueDateStatus &&
      item.dueDate.status !== filters.dueDateStatus
    ) {
      return false;
    }
    return true;
  });
}

function buildTaskListItem(
  graph: OrgGraph,
  task: Task,
  now: Date,
): TaskListItem {
  const owner = graph.people.find((p) => p.id === task.ownerId);
  const team = owner ? getTeamForPerson(graph, owner.id) : null;
  const strategic = findNearestStrategicGoal(graph, task);
  const goal = task.linkedGoalId
    ? graph.goals.find((g) => g.id === task.linkedGoalId)
    : null;
  const impact =
    task.status === "open" || task.status === "in_progress"
      ? computeImpactScore(graph, task, now)
      : null;

  return {
    task,
    assigneeName: owner?.name ?? "Unassigned",
    teamName: team?.teamName ?? "Unknown team",
    goalTitle: strategic?.goal.title ?? goal?.title ?? null,
    goalHealth: strategic?.goal.healthStatus ?? goal?.healthStatus ?? null,
    impactScore: impact?.score ?? null,
    impactLabel: impact ? impactLabel(impact.score) : "—",
    isBlocked: isTaskBlocked(graph, task.id),
    dueDate: classifyDueDate(task.dueDate, task.completedAt, task.status, now),
  };
}

export function getTaskList(
  viewerId: string,
  requestedScope?: TaskListScope | null,
  filters: TaskListFilters = {},
  now: Date = NOW,
): TaskListDto | null {
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

  const items = scopedTasks
    .map((task) => buildTaskListItem(graph, task, now))
    .sort((a, b) => {
      const scoreA = a.impactScore ?? -1;
      const scoreB = b.impactScore ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const dueA = a.dueDate.dueDate
        ? new Date(a.dueDate.dueDate).getTime()
        : Infinity;
      const dueB = b.dueDate.dueDate
        ? new Date(b.dueDate.dueDate).getTime()
        : Infinity;
      return dueA - dueB;
    });

  const filtered = applyFilters(graph, items, filters);

  const personIds = new Set(scopedTasks.map((t) => t.ownerId));
  const availableAssignees = [...personIds]
    .map((id) => {
      const p = graph.people.find((person) => person.id === id);
      return p ? { id: p.id, name: p.name } : null;
    })
    .filter((p): p is { id: string; name: string } => Boolean(p))
    .sort((a, b) => a.name.localeCompare(b.name));

  const teamIds = new Set(
    scopedTasks
      .map((t) => graph.people.find((p) => p.id === t.ownerId)?.teamId)
      .filter((id): id is string => Boolean(id)),
  );
  const availableTeams = [...teamIds]
    .map((id) => {
      const team = graph.teams.find((t) => t.id === id);
      return team ? { id: team.id, name: team.name } : null;
    })
    .filter((t): t is { id: string; name: string } => Boolean(t))
    .sort((a, b) => a.name.localeCompare(b.name));

  const goalIds = new Set<string>();
  for (const task of scopedTasks) {
    if (task.linkedGoalId) goalIds.add(task.linkedGoalId);
    const strategic = findNearestStrategicGoal(graph, task);
    if (strategic) goalIds.add(strategic.goal.id);
  }
  const availableGoals = [...goalIds]
    .map((id) => {
      const goal = graph.goals.find((g) => g.id === id);
      return goal ? { id: goal.id, title: goal.title } : null;
    })
    .filter((g): g is { id: string; title: string } => Boolean(g))
    .sort((a, b) => a.title.localeCompare(b.title));

  return {
    scope,
    scopeLabel: scopeLabel(scope, viewer.name),
    viewerId,
    viewerName: viewer.name,
    items: filtered,
    filters,
    availableAssignees,
    availableTeams,
    availableGoals,
  };
}

export function parseTaskListFilters(
  params: Record<string, string | string[] | undefined>,
): TaskListFilters {
  const get = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };

  const filters: TaskListFilters = {};
  const assigneeId = get("assignee");
  if (assigneeId) filters.assigneeId = assigneeId;
  const status = get("status") as TaskStatus | undefined;
  if (status) filters.status = status;
  const teamId = get("team");
  if (teamId) filters.teamId = teamId;
  const goalId = get("goal");
  if (goalId) filters.goalId = goalId;
  if (get("blocked") === "true") filters.blocked = true;
  if (get("blocked") === "false") filters.blocked = false;
  if (get("atRisk") === "true") filters.atRisk = true;
  const due = get("due") as DueDateStatus | undefined;
  if (due) filters.dueDateStatus = due;
  return filters;
}
