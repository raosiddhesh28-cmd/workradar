import type { Goal, OrgGraph, Person, Task } from "../types";

export interface SearchTaskResult {
  type: "task";
  id: string;
  title: string;
  assigneeName: string;
  teamName: string;
}

export interface SearchPersonResult {
  type: "person";
  id: string;
  name: string;
  teamName: string;
  title: string;
}

export interface SearchGoalResult {
  type: "goal";
  id: string;
  title: string;
  healthStatus: string;
}

export interface WorkRadarSearchResults {
  tasks: SearchTaskResult[];
  people: SearchPersonResult[];
  goals: SearchGoalResult[];
  query: string;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function matches(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query);
}

function teamName(graph: OrgGraph, teamId: string): string {
  return graph.teams.find((t) => t.id === teamId)?.name ?? "Unknown team";
}

function personName(graph: OrgGraph, personId: string): string {
  return graph.people.find((p) => p.id === personId)?.name ?? "Unassigned";
}

function taskToResult(graph: OrgGraph, task: Task): SearchTaskResult {
  const owner = graph.people.find((p) => p.id === task.ownerId);
  return {
    type: "task",
    id: task.id,
    title: task.title,
    assigneeName: owner?.name ?? "Unassigned",
    teamName: owner ? teamName(graph, owner.teamId) : "—",
  };
}

function personToResult(graph: OrgGraph, person: Person): SearchPersonResult {
  return {
    type: "person",
    id: person.id,
    name: person.name,
    teamName: teamName(graph, person.teamId),
    title: person.title,
  };
}

function goalToResult(goal: Goal): SearchGoalResult {
  return {
    type: "goal",
    id: goal.id,
    title: goal.title,
    healthStatus: goal.healthStatus.replace("_", " "),
  };
}

/**
 * Deterministic substring search across tasks, people, and goals.
 * Person matches also surface that person's open/in-progress tasks.
 */
export function searchWorkRadar(
  graph: OrgGraph,
  rawQuery: string,
): WorkRadarSearchResults {
  const query = normalizeQuery(rawQuery);
  if (!query) {
    return { tasks: [], people: [], goals: [], query: rawQuery };
  }

  const matchedPeople = graph.people.filter(
    (p) =>
      matches(p.name, query) ||
      matches(p.title, query) ||
      matches(p.email, query),
  );
  const matchedPersonIds = new Set(matchedPeople.map((p) => p.id));

  const taskIds = new Set<string>();
  const tasks: SearchTaskResult[] = [];

  for (const task of graph.tasks) {
    const titleMatch =
      matches(task.title, query) || matches(task.description, query);
    const ownerMatch = matchedPersonIds.has(task.ownerId);
    if (titleMatch || ownerMatch) {
      if (!taskIds.has(task.id)) {
        taskIds.add(task.id);
        tasks.push(taskToResult(graph, task));
      }
    }
  }

  const people = matchedPeople.map((p) => personToResult(graph, p));

  const goals = graph.goals
    .filter((g) => matches(g.title, query))
    .map(goalToResult);

  return {
    tasks: tasks.sort((a, b) => a.title.localeCompare(b.title)),
    people: people.sort((a, b) => a.name.localeCompare(b.name)),
    goals: goals.sort((a, b) => a.title.localeCompare(b.title)),
    query: rawQuery.trim(),
  };
}

export function hasSearchResults(results: WorkRadarSearchResults): boolean {
  return (
    results.tasks.length > 0 ||
    results.people.length > 0 ||
    results.goals.length > 0
  );
}
