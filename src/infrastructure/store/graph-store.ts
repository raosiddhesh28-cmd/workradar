import type {
  Dependency,
  Goal,
  OrgEvent,
  OrgGraph,
  Person,
  Task,
  Team,
} from "@/domain/types";

export interface GraphStore {
  getGraph(): OrgGraph;
  getPerson(id: string): Person | undefined;
  getTask(id: string): Task | undefined;
  getGoal(id: string): Goal | undefined;
  updateTask(id: string, patch: Partial<Task>): Task;
  updateDependency(id: string, patch: Partial<Dependency>): Dependency;
  addEvent(event: OrgEvent): void;
  getTeams(): Team[];
  getDirectReports(managerId: string): Person[];
}

import { createAcmeOrgGraph } from "../seed/org-acme";

let store: OrgGraph | null = null;

export function initGraphStore(initial: OrgGraph): GraphStore {
  store = structuredClone(initial);

  return {
    getGraph: () => store!,
    getPerson: (id) => store!.people.find((p) => p.id === id),
    getTask: (id) => store!.tasks.find((t) => t.id === id),
    getGoal: (id) => store!.goals.find((g) => g.id === id),
    updateTask(id, patch) {
      const idx = store!.tasks.findIndex((t) => t.id === id);
      if (idx < 0) throw new Error(`Task not found: ${id}`);
      store!.tasks[idx] = { ...store!.tasks[idx], ...patch };
      return store!.tasks[idx];
    },
    updateDependency(id, patch) {
      const idx = store!.dependencies.findIndex((d) => d.id === id);
      if (idx < 0) throw new Error(`Dependency not found: ${id}`);
      store!.dependencies[idx] = { ...store!.dependencies[idx], ...patch };
      return store!.dependencies[idx];
    },
    addEvent(event) {
      store!.events.unshift(event);
    },
    getTeams: () => store!.teams,
    getDirectReports(managerId) {
      return store!.people.filter((p) => p.managerId === managerId);
    },
  };
}