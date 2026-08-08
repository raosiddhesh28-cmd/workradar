import type { Goal, OrgGraph, Task } from "../types";

export function findGoalById(graph: OrgGraph, goalId: string): Goal | undefined {
  return graph.goals.find((g) => g.id === goalId);
}

export function getGoalPath(graph: OrgGraph, goalId: string | null): Goal[] {
  if (!goalId) return [];
  const path: Goal[] = [];
  let current = findGoalById(graph, goalId);
  while (current) {
    path.unshift(current);
    current = current.parentGoalId
      ? findGoalById(graph, current.parentGoalId)
      : undefined;
  }
  return path;
}

export function findNearestStrategicGoal(
  graph: OrgGraph,
  task: Task,
): { goal: Goal; hops: number } | null {
  if (!task.linkedGoalId) return null;

  const path = getGoalPath(graph, task.linkedGoalId);
  if (path.length === 0) return null;

  const strategic =
    path.find((g) => g.level === "company") ?? path[path.length - 1];
  const hops = path.indexOf(strategic);

  return { goal: strategic, hops: hops >= 0 ? hops : path.length - 1 };
}

export function getDownstreamBlockedTaskIds(
  graph: OrgGraph,
  taskId: string,
  maxDepth: number,
): string[] {
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: taskId, depth: 0 }];
  const blocked: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) continue;

    const deps = graph.dependencies.filter(
      (d) =>
        d.status === "unresolved" &&
        d.blockerTaskId === current.id &&
        d.blockedTaskId,
    );

    for (const dep of deps) {
      const blockedId = dep.blockedTaskId!;
      if (visited.has(blockedId)) continue;
      visited.add(blockedId);
      blocked.push(blockedId);
      queue.push({ id: blockedId, depth: current.depth + 1 });
    }
  }

  return blocked;
}

export function getBlockedPartiesForTask(
  graph: OrgGraph,
  taskId: string,
  maxDepth: number,
): { taskIds: string[]; personIds: string[] } {
  const taskIds = getDownstreamBlockedTaskIds(graph, taskId, maxDepth);
  const personIds = new Set<string>();

  for (const id of taskIds) {
    const task = graph.tasks.find((t) => t.id === id);
    if (task) personIds.add(task.ownerId);
  }

  const directPersonDeps = graph.dependencies.filter(
    (d) =>
      d.status === "unresolved" &&
      d.blockerTaskId === taskId &&
      d.blockedPersonId,
  );
  for (const dep of directPersonDeps) {
    if (dep.blockedPersonId) personIds.add(dep.blockedPersonId);
  }

  return { taskIds, personIds: [...personIds] };
}

export function getUnresolvedDependenciesForPerson(
  graph: OrgGraph,
  personId: string,
) {
  const blockingMe = graph.dependencies.filter(
    (d) =>
      d.status === "unresolved" &&
      (d.blockedPersonId === personId ||
        (d.blockedTaskId &&
          graph.tasks.find((t) => t.id === d.blockedTaskId)?.ownerId ===
            personId)),
  );

  const imBlocking = graph.dependencies.filter(
    (d) =>
      d.status === "unresolved" &&
      (d.blockerPersonId === personId ||
        (d.blockerTaskId &&
          graph.tasks.find((t) => t.id === d.blockerTaskId)?.ownerId ===
            personId)),
  );

  return { blockingMe, imBlocking };
}
