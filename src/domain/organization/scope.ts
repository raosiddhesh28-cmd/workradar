import type { OrgGraph, Person, Task } from "../types";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "../scoring/config";
import {
  getDownstreamBlockedTaskIds,
} from "../graph/impact-graph";

export type OrganizationalScopeMode = "manager" | "executive";

export interface OrganizationalScope {
  mode: OrganizationalScopeMode;
  viewerId: string;
  teamIds: Set<string>;
  personIds: Set<string>;
  taskIds: Set<string>;
}

function isActiveTask(task: Task): boolean {
  return task.status === "open" || task.status === "in_progress";
}

function expandTaskScope(
  graph: OrgGraph,
  seedIds: Set<string>,
  maxDepth: number,
): Set<string> {
  const expanded = new Set(seedIds);
  const queue = [...seedIds];

  while (queue.length > 0) {
    const taskId = queue.shift()!;
    const downstream = getDownstreamBlockedTaskIds(graph, taskId, maxDepth);
    for (const id of downstream) {
      if (!expanded.has(id)) {
        expanded.add(id);
        queue.push(id);
      }
    }

    const upstreamDeps = graph.dependencies.filter(
      (d) =>
        d.status === "unresolved" &&
        d.blockedTaskId === taskId &&
        d.blockerTaskId,
    );
    for (const dep of upstreamDeps) {
      const blockerId = dep.blockerTaskId!;
      if (!expanded.has(blockerId)) {
        expanded.add(blockerId);
        queue.push(blockerId);
      }
    }
  }

  return expanded;
}

export function getTeamForPerson(
  graph: OrgGraph,
  personId: string,
): { teamId: string; teamName: string } | null {
  const person = graph.people.find((p) => p.id === personId);
  if (!person) return null;
  const team = graph.teams.find((t) => t.id === person.teamId);
  return {
    teamId: person.teamId,
    teamName: team?.name ?? "Unknown team",
  };
}

export function getTeamForTask(
  graph: OrgGraph,
  taskId: string,
): { teamId: string; teamName: string } | null {
  const task = graph.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  return getTeamForPerson(graph, task.ownerId);
}

/**
 * Resolves organizational scope for manager or executive viewers.
 * Returns null when the viewer is not authorized for organizational views.
 */
export function resolveOrganizationalScope(
  graph: OrgGraph,
  viewerId: string,
  getDirectReports: (managerId: string) => Person[],
): OrganizationalScope | null {
  const viewer = graph.people.find((p) => p.id === viewerId);
  if (!viewer) return null;
  if (viewer.role !== "manager" && viewer.role !== "executive") return null;

  const maxDepth = DEFAULT_IMPACT_SCORE_CONFIG.maxTraverseDepth;

  if (viewer.role === "executive") {
    const taskIds = new Set(
      graph.tasks.filter(isActiveTask).map((t) => t.id),
    );
    return {
      mode: "executive",
      viewerId,
      teamIds: new Set(graph.teams.map((t) => t.id)),
      personIds: new Set(graph.people.map((p) => p.id)),
      taskIds,
    };
  }

  const reports = getDirectReports(viewerId);
  const personIds = new Set([viewerId, ...reports.map((r) => r.id)]);
  const teamIds = new Set<string>();
  if (viewer.teamId) teamIds.add(viewer.teamId);
  for (const report of reports) {
    teamIds.add(report.teamId);
  }

  const seedTaskIds = new Set(
    graph.tasks
      .filter((t) => personIds.has(t.ownerId) && isActiveTask(t))
      .map((t) => t.id),
  );

  const taskIds = expandTaskScope(graph, seedTaskIds, maxDepth);

  return {
    mode: "manager",
    viewerId,
    teamIds,
    personIds,
    taskIds,
  };
}

export function isTaskInScope(scope: OrganizationalScope, taskId: string): boolean {
  return scope.taskIds.has(taskId);
}
