import type { OrgGraph, PersonaRole, Task } from "@/domain/types";
import { getOrganizationTaskScope } from "@/domain/organization/scope";

export type TaskListScope = "mine" | "team" | "organization";

export function resolveTaskListScope(
  role: PersonaRole,
  requested?: TaskListScope | null,
): TaskListScope {
  if (role === "ic") return "mine";
  if (requested) return requested;
  return role === "executive" ? "organization" : "team";
}

export function filterTasksByScope(
  graph: OrgGraph,
  tasks: Task[],
  scope: TaskListScope,
  viewerId: string,
  teamId: string,
  getDirectReports: (managerId: string) => import("@/domain/types").Person[],
): Task[] {
  switch (scope) {
    case "mine":
      return tasks.filter((t) => t.ownerId === viewerId);
    case "team":
      return tasks.filter((t) => {
        const owner = graph.people.find((p) => p.id === t.ownerId);
        return owner?.teamId === teamId;
      });
    case "organization": {
      const orgTaskIds = getOrganizationTaskScope(
        graph,
        viewerId,
        getDirectReports,
      );
      if (!orgTaskIds) return [];
      return tasks.filter((t) => orgTaskIds.has(t.id));
    }
    default:
      return tasks;
  }
}
