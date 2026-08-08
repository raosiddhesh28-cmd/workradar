import type { GoalHealth, OrgGraph } from "../types";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "../scoring/config";
import {
  findNearestStrategicGoal,
  getDownstreamBlockedTaskIds,
  getGoalPath,
} from "../graph/impact-graph";
import type { Task } from "../types";
import { getTeamForTask, type OrganizationalScope } from "./scope";

export interface CrossTeamChainNode {
  taskId: string;
  taskTitle: string;
  teamId: string;
  teamName: string;
  assigneeName: string;
  depth: number;
}

export interface CrossTeamDependencyView {
  id: string;
  dependencyIds: string[];
  chain: CrossTeamChainNode[];
  isCrossTeam: boolean;
  downstreamTaskCount: number;
  downstreamTeamIds: string[];
  downstreamTeamNames: string[];
  statusLabel: string;
  rootTaskId: string;
  rootTaskTitle: string;
  goalTitle: string | null;
  goalHealth: GoalHealth | null;
}

function taskNode(
  graph: OrgGraph,
  taskId: string,
  depth: number,
): CrossTeamChainNode | null {
  const task = graph.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const team = getTeamForTask(graph, taskId);
  const owner = graph.people.find((p) => p.id === task.ownerId);
  return {
    taskId,
    taskTitle: task.title,
    teamId: team?.teamId ?? "unknown",
    teamName: team?.teamName ?? "Unknown team",
    assigneeName: owner?.name ?? "Unassigned",
    depth,
  };
}

function buildChainFromRoot(
  graph: OrgGraph,
  rootTaskId: string,
  maxDepth: number,
): CrossTeamChainNode[] {
  const chain: CrossTeamChainNode[] = [];
  const visited = new Set<string>();
  let currentId: string | null = rootTaskId;
  let depth = 0;

  while (currentId && depth <= maxDepth) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const node = taskNode(graph, currentId, depth);
    if (!node) break;
    chain.push(node);

    const nextDep = graph.dependencies.find(
      (d) =>
        d.status === "unresolved" &&
        d.blockerTaskId === currentId &&
        d.blockedTaskId,
    );
    currentId = nextDep?.blockedTaskId ?? null;
    depth += 1;
  }

  return chain;
}

function chainHasCrossTeamEdge(chain: CrossTeamChainNode[]): boolean {
  for (let i = 1; i < chain.length; i += 1) {
    if (chain[i].teamId !== chain[i - 1].teamId) return true;
  }
  return false;
}

function chainDependencyIds(
  graph: OrgGraph,
  chain: CrossTeamChainNode[],
): string[] {
  const ids: string[] = [];
  for (let i = 0; i < chain.length - 1; i += 1) {
    const dep = graph.dependencies.find(
      (d) =>
        d.status === "unresolved" &&
        d.blockerTaskId === chain[i].taskId &&
        d.blockedTaskId === chain[i + 1].taskId,
    );
    if (dep) ids.push(dep.id);
  }
  return ids;
}

function statusLabelForChain(
  graph: OrgGraph,
  rootTaskId: string,
): { label: string; goalTitle: string | null; goalHealth: GoalHealth | null } {
  const task = graph.tasks.find((t) => t.id === rootTaskId);
  if (!task) {
    return { label: "Active", goalTitle: null, goalHealth: null };
  }

  const strategic = findNearestStrategicGoal(graph, task);
  const goal = task.linkedGoalId
    ? graph.goals.find((g) => g.id === task.linkedGoalId)
    : null;
  const healthGoal = strategic?.goal ?? goal ?? null;

  if (healthGoal?.healthStatus === "at_risk" || healthGoal?.healthStatus === "breached") {
    return {
      label: "At risk",
      goalTitle: healthGoal.title,
      goalHealth: healthGoal.healthStatus,
    };
  }

  if (goal?.healthStatus === "at_risk") {
    return {
      label: "At risk",
      goalTitle: goal.title,
      goalHealth: goal.healthStatus,
    };
  }

  return {
    label: "Active",
    goalTitle: goal?.title ?? strategic?.goal.title ?? null,
    goalHealth: goal?.healthStatus ?? strategic?.goal.healthStatus ?? null,
  };
}

/**
 * Surfaces cross-team dependency chains within organizational scope.
 */
export function getCrossTeamDependencies(
  graph: OrgGraph,
  scope: OrganizationalScope,
): CrossTeamDependencyView[] {
  const maxDepth = DEFAULT_IMPACT_SCORE_CONFIG.maxTraverseDepth;
  const candidateRoots = new Set<string>();

  for (const dep of graph.dependencies) {
    if (dep.status !== "unresolved" || !dep.blockerTaskId || !dep.blockedTaskId) {
      continue;
    }
    if (
      !scope.taskIds.has(dep.blockerTaskId) &&
      !scope.taskIds.has(dep.blockedTaskId)
    ) {
      continue;
    }

    const blockerTeam = getTeamForTask(graph, dep.blockerTaskId);
    const blockedTeam = getTeamForTask(graph, dep.blockedTaskId);
    if (
      blockerTeam &&
      blockedTeam &&
      blockerTeam.teamId !== blockedTeam.teamId
    ) {
      candidateRoots.add(dep.blockerTaskId);
    }
  }

  const chains: CrossTeamDependencyView[] = [];
  const seenChainKeys = new Set<string>();

  for (const rootId of candidateRoots) {
    const chain = buildChainFromRoot(graph, rootId, maxDepth);
    if (chain.length < 2) continue;
    if (!chainHasCrossTeamEdge(chain)) continue;

    const chainKey = chain.map((n) => n.taskId).join("→");
    if (seenChainKeys.has(chainKey)) continue;
    seenChainKeys.add(chainKey);

    const downstreamIds = getDownstreamBlockedTaskIds(graph, rootId, maxDepth);
    const downstreamTeamIds = new Set<string>();
    for (const id of [rootId, ...downstreamIds]) {
      const team = getTeamForTask(graph, id);
      if (team) downstreamTeamIds.add(team.teamId);
    }

    const status = statusLabelForChain(graph, rootId);

    chains.push({
      id: `chain-${rootId}`,
      dependencyIds: chainDependencyIds(graph, chain),
      chain,
      isCrossTeam: true,
      downstreamTaskCount: downstreamIds.length,
      downstreamTeamIds: [...downstreamTeamIds],
      downstreamTeamNames: [...downstreamTeamIds].map(
        (tid) => graph.teams.find((t) => t.id === tid)?.name ?? tid,
      ),
      statusLabel: status.label,
      rootTaskId: rootId,
      rootTaskTitle: chain[0]?.taskTitle ?? rootId,
      goalTitle: status.goalTitle,
      goalHealth: status.goalHealth,
    });
  }

  return chains.sort((a, b) => b.downstreamTaskCount - a.downstreamTaskCount);
}

export function getCrossTeamDependencyById(
  graph: OrgGraph,
  scope: OrganizationalScope,
  chainId: string,
): CrossTeamDependencyView | null {
  return (
    getCrossTeamDependencies(graph, scope).find((c) => c.id === chainId) ?? null
  );
}

export function buildOrganizationalWhyNarrative(
  graph: OrgGraph,
  task: Task,
): string {
  const maxDepth = DEFAULT_IMPACT_SCORE_CONFIG.maxTraverseDepth;
  const parts: string[] = [];

  const downstream = getDownstreamBlockedTaskIds(graph, task.id, maxDepth);
  if (downstream.length > 0) {
    const titles = downstream
      .map((id) => graph.tasks.find((t) => t.id === id)?.title)
      .filter((t): t is string => Boolean(t));
    if (titles.length === 1) {
      parts.push(`This task is blocking ${titles[0]}.`);
    } else if (titles.length > 1) {
      parts.push(
        `This task is blocking ${titles.slice(0, -1).join(", ")} and ${titles[titles.length - 1]}.`,
      );
    }
  }

  const path = getGoalPath(graph, task.linkedGoalId);
  const strategic = findNearestStrategicGoal(graph, task);
  const healthGoal = strategic?.goal ?? path[path.length - 1];

  if (healthGoal) {
    const healthLabel = healthGoal.healthStatus.replace("_", " ");
    parts.push(
      `The affected work contributes to ${healthGoal.title}, which is currently ${healthLabel}.`,
    );
  }

  if (parts.length === 0) {
    return "This work has systemic consequence within the organizational graph.";
  }

  return parts.join(" ");
}
