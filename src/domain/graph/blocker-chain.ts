import type { Dependency, Goal, GoalHealth, OrgGraph, Task, TaskStatus } from "../types";
import { DEFAULT_BLOCKER_CHAIN_CONFIG } from "../blocker/config";

export interface BlockerChainTraceRef {
  taskId?: string;
  personId?: string;
  dependencyId?: string;
  goalId?: string;
}

export interface BlockerChainNode {
  taskId: string;
  taskTitle: string;
  taskStatus: TaskStatus;
  ownerId: string | null;
  ownerName: string | null;
  dueDate: string | null;
  daysOverdue: number | null;
  linkedGoalId: string | null;
  goalTitle: string | null;
  goalHealth: GoalHealth | null;
  depth: number;
  dependencyId: string | null;
}

export interface BlockerChainFacts {
  dependencyId: string;
  blockedTaskId: string | null;
  blockedTaskTitle: string | null;
  blockedPersonId: string | null;
  direction: "blocking_me" | "im_blocking";
  daysBlocked: number;
  nodes: ReadonlyArray<BlockerChainNode>;
  immediateBlockerTaskId: string | null;
  rootBlockerTaskId: string | null;
  rootBlockerTitle: string | null;
  hasDeeperUpstream: boolean;
  chainComplete: boolean;
  cycleDetected: boolean;
  cycleTaskIds?: string[];
  traceRefs?: BlockerChainTraceRef[];
}

export interface BlockerChain extends BlockerChainFacts {
  cycleTaskIds: string[];
  traceRefs: BlockerChainTraceRef[];
}

function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function daysOverdue(dueDate: string | null, now: Date): number | null {
  if (!dueDate) return null;
  const diff = Math.floor(
    (now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff > 0 ? diff : null;
}

function taskNode(
  graph: OrgGraph,
  taskId: string,
  depth: number,
  dependencyId: string | null,
  now: Date,
): BlockerChainNode {
  const task = graph.tasks.find((t) => t.id === taskId);
  const owner = task?.ownerId
    ? graph.people.find((p) => p.id === task.ownerId)
    : null;
  const goal = task?.linkedGoalId
    ? graph.goals.find((g) => g.id === task.linkedGoalId)
    : null;

  return {
    taskId,
    taskTitle: task?.title ?? taskId,
    taskStatus: task?.status ?? "open",
    ownerId: task?.ownerId ?? null,
    ownerName: owner?.name ?? null,
    dueDate: task?.dueDate ?? null,
    daysOverdue: daysOverdue(task?.dueDate ?? null, now),
    linkedGoalId: task?.linkedGoalId ?? null,
    goalTitle: goal?.title ?? null,
    goalHealth: goal?.healthStatus ?? null,
    depth,
    dependencyId,
  };
}

/**
 * Traverses upstream over unresolved task→task dependencies.
 * When directBlockerTaskId is provided, the chain follows that specific blocker edge
 * (required when multiple blockers target the same blocked task).
 * Returns chain nodes from blocked task (depth 0) through upstream blockers.
 */
export function traverseUpstreamBlockerChain(
  graph: OrgGraph,
  blockedTaskId: string,
  maxDepth: number = DEFAULT_BLOCKER_CHAIN_CONFIG.maxBlockerChainDepth,
  now: Date = new Date(),
  directBlockerTaskId?: string | null,
  entryDependencyId?: string | null,
): Pick<
  BlockerChain,
  | "nodes"
  | "immediateBlockerTaskId"
  | "rootBlockerTaskId"
  | "rootBlockerTitle"
  | "hasDeeperUpstream"
  | "chainComplete"
  | "cycleDetected"
  | "cycleTaskIds"
  | "traceRefs"
> {
  const nodes: BlockerChainNode[] = [taskNode(graph, blockedTaskId, 0, null, now)];
  const traceRefs: BlockerChainTraceRef[] = [{ taskId: blockedTaskId }];
  const visited = new Set<string>([blockedTaskId]);
  const cycleTaskIds: string[] = [];

  let currentTaskId = blockedTaskId;
  let depth = 0;
  let cycleDetected = false;
  let hasDeeperUpstream = false;
  let immediateBlockerTaskId: string | null = null;
  let rootBlockerTaskId: string | null = null;

  if (directBlockerTaskId) {
    if (visited.has(directBlockerTaskId)) {
      cycleDetected = true;
      cycleTaskIds.push(directBlockerTaskId);
    } else {
      visited.add(directBlockerTaskId);
      depth = 1;
      immediateBlockerTaskId = directBlockerTaskId;
      rootBlockerTaskId = directBlockerTaskId;
      nodes.push(
        taskNode(graph, directBlockerTaskId, depth, entryDependencyId ?? null, now),
      );
      traceRefs.push({ taskId: directBlockerTaskId });
      if (entryDependencyId) traceRefs.push({ dependencyId: entryDependencyId });
      currentTaskId = directBlockerTaskId;
    }
  }

  while (depth < maxDepth && !cycleDetected) {
    const upstreamDep = graph.dependencies.find(
      (d) =>
        d.status === "unresolved" &&
        d.blockedTaskId === currentTaskId &&
        d.blockerTaskId,
    );

    if (!upstreamDep?.blockerTaskId) {
      break;
    }

    const blockerTaskId = upstreamDep.blockerTaskId;

    if (visited.has(blockerTaskId)) {
      cycleDetected = true;
      cycleTaskIds.push(blockerTaskId);
      break;
    }

    visited.add(blockerTaskId);
    depth += 1;

    if (!immediateBlockerTaskId) {
      immediateBlockerTaskId = blockerTaskId;
    }
    rootBlockerTaskId = blockerTaskId;

    nodes.push(taskNode(graph, blockerTaskId, depth, upstreamDep.id, now));
    traceRefs.push(
      { dependencyId: upstreamDep.id },
      { taskId: blockerTaskId },
    );

    const deeperExists = graph.dependencies.some(
      (d) =>
        d.status === "unresolved" &&
        d.blockedTaskId === blockerTaskId &&
        d.blockerTaskId,
    );

    if (deeperExists && depth >= maxDepth) {
      hasDeeperUpstream = true;
      break;
    }

    currentTaskId = blockerTaskId;
  }

  if (!cycleDetected && depth < maxDepth) {
    const lastId = nodes[nodes.length - 1]?.taskId;
    if (lastId) {
      hasDeeperUpstream = graph.dependencies.some(
        (d) =>
          d.status === "unresolved" &&
          d.blockedTaskId === lastId &&
          d.blockerTaskId,
      );
    }
  }

  const rootNode = rootBlockerTaskId
    ? nodes.find((n) => n.taskId === rootBlockerTaskId)
    : null;

  return {
    nodes,
    immediateBlockerTaskId,
    rootBlockerTaskId,
    rootBlockerTitle: rootNode?.taskTitle ?? null,
    hasDeeperUpstream,
    chainComplete: !hasDeeperUpstream && !cycleDetected,
    cycleDetected,
    cycleTaskIds,
    traceRefs,
  };
}

export function buildBlockerChainForDependency(
  graph: OrgGraph,
  dependency: Dependency,
  direction: "blocking_me" | "im_blocking",
  now: Date,
  maxDepth: number = DEFAULT_BLOCKER_CHAIN_CONFIG.maxBlockerChainDepth,
): BlockerChain {
  const blockedTaskId =
    direction === "blocking_me"
      ? dependency.blockedTaskId
      : dependency.blockedTaskId;
  const daysBlocked = daysSince(dependency.flaggedAt, now);

  const traceRefs: BlockerChainTraceRef[] = [{ dependencyId: dependency.id }];

  if (!blockedTaskId) {
    const blockedPersonId =
      direction === "blocking_me" ? dependency.blockedPersonId : dependency.blockedPersonId;
    const blockerTaskId = dependency.blockerTaskId;

    if (blockerTaskId) {
      traceRefs.push({ taskId: blockerTaskId });
      if (dependency.blockerPersonId) {
        traceRefs.push({ personId: dependency.blockerPersonId });
      }
      const blockerTask = graph.tasks.find((t) => t.id === blockerTaskId);
      const goal = blockerTask?.linkedGoalId
        ? graph.goals.find((g) => g.id === blockerTask.linkedGoalId)
        : null;
      if (goal) traceRefs.push({ goalId: goal.id });

      return {
        dependencyId: dependency.id,
        blockedTaskId: null,
        blockedTaskTitle: null,
        blockedPersonId,
        direction,
        daysBlocked,
        nodes: [
          {
            taskId: blockerTaskId,
            taskTitle: blockerTask?.title ?? blockerTaskId,
            taskStatus: blockerTask?.status ?? "open",
            ownerId: blockerTask?.ownerId ?? dependency.blockerPersonId,
            ownerName:
              (blockerTask?.ownerId
                ? graph.people.find((p) => p.id === blockerTask.ownerId)?.name
                : null) ??
              (dependency.blockerPersonId
                ? graph.people.find((p) => p.id === dependency.blockerPersonId)?.name
                : null) ??
              null,
            dueDate: blockerTask?.dueDate ?? null,
            daysOverdue: daysOverdue(blockerTask?.dueDate ?? null, now),
            linkedGoalId: blockerTask?.linkedGoalId ?? null,
            goalTitle: goal?.title ?? null,
            goalHealth: goal?.healthStatus ?? null,
            depth: 0,
            dependencyId: dependency.id,
          },
        ],
        immediateBlockerTaskId: blockerTaskId,
        rootBlockerTaskId: blockerTaskId,
        rootBlockerTitle: blockerTask?.title ?? blockerTaskId,
        hasDeeperUpstream: false,
        chainComplete: true,
        cycleDetected: false,
        cycleTaskIds: [],
        traceRefs,
      };
    }

    return {
      dependencyId: dependency.id,
      blockedTaskId: null,
      blockedTaskTitle: null,
      blockedPersonId,
      direction,
      daysBlocked,
      nodes: [],
      immediateBlockerTaskId: null,
      rootBlockerTaskId: null,
      rootBlockerTitle: null,
      hasDeeperUpstream: false,
      chainComplete: true,
      cycleDetected: false,
      cycleTaskIds: [],
      traceRefs,
    };
  }

  const blockedTask = graph.tasks.find((t) => t.id === blockedTaskId);
  const traversal = traverseUpstreamBlockerChain(
    graph,
    blockedTaskId,
    maxDepth,
    now,
    dependency.blockerTaskId,
    dependency.id,
  );
  const goal = blockedTask?.linkedGoalId
    ? graph.goals.find((g) => g.id === blockedTask.linkedGoalId)
    : null;
  if (goal) traceRefs.push({ goalId: goal.id });

  return {
    dependencyId: dependency.id,
    blockedTaskId,
    blockedTaskTitle: blockedTask?.title ?? null,
    blockedPersonId: dependency.blockedPersonId,
    direction,
    daysBlocked,
    ...traversal,
    traceRefs: [...traceRefs, ...traversal.traceRefs],
  };
}

export function buildBlockerChainsForPerson(
  graph: OrgGraph,
  dependencies: Dependency[],
  direction: "blocking_me" | "im_blocking",
  now: Date,
  maxDepth: number = DEFAULT_BLOCKER_CHAIN_CONFIG.maxBlockerChainDepth,
): BlockerChain[] {
  return dependencies.map((dep) =>
    buildBlockerChainForDependency(graph, dep, direction, now, maxDepth),
  );
}

/** Deterministic fallback narrative from structured chain facts. */
export function buildDeterministicBlockerNarrative(chain: BlockerChainFacts): string {
  const parts: string[] = [];

  if (chain.direction === "blocking_me") {
    const immediate = chain.nodes.find(
      (n) => n.taskId === chain.immediateBlockerTaskId,
    );
    if (immediate) {
      const ownerPart = immediate.ownerName ? `, owned by ${immediate.ownerName}` : "";
      parts.push(`Your work is waiting on ${immediate.taskTitle}${ownerPart}.`);
    } else if (chain.nodes.length > 0) {
      parts.push(`Your work is blocked by ${chain.nodes[chain.nodes.length - 1].taskTitle}.`);
    }
  } else {
    const blocked = chain.blockedTaskTitle;
    if (blocked) {
      parts.push(`${blocked} is waiting on your work.`);
    }
  }

  if (
    chain.immediateBlockerTaskId &&
    chain.rootBlockerTaskId &&
    chain.immediateBlockerTaskId !== chain.rootBlockerTaskId
  ) {
    const immediate = chain.nodes.find((n) => n.taskId === chain.immediateBlockerTaskId);
    const root = chain.nodes.find((n) => n.taskId === chain.rootBlockerTaskId);
    if (immediate && root) {
      parts.push(
        `${immediate.taskTitle} is itself blocked by ${root.taskTitle}.`,
      );
    }
  }

  const blockedNode = chain.nodes[0];
  if (blockedNode?.goalTitle && blockedNode.goalHealth) {
    const healthLabel = blockedNode.goalHealth.replace("_", " ");
    parts.push(
      `${blockedNode.taskTitle} is linked to ${blockedNode.goalTitle}, which is currently ${healthLabel}.`,
    );
  }

  if (chain.hasDeeperUpstream && !chain.cycleDetected) {
    parts.push(
      "WorkRadar cannot identify a deeper upstream blocker from the available dependency data.",
    );
  }

  if (chain.cycleDetected) {
    parts.push("A cyclic dependency was detected in the blocker chain.");
  }

  return (
    parts.join(" ") ||
    (chain.blockedTaskTitle
      ? `Blocked on ${chain.blockedTaskTitle}.`
      : "Blocked by an unresolved dependency.")
  );
}

export function buildRootBlockerSummary(chain: BlockerChainFacts): string {
  if (chain.rootBlockerTitle) {
    return chain.immediateBlockerTaskId === chain.rootBlockerTaskId
      ? `Direct blocker: ${chain.rootBlockerTitle}`
      : `Root blocker: ${chain.rootBlockerTitle}`;
  }
  return "No upstream blocker identified";
}
