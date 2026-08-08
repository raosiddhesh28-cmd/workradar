import { describe, it, expect, beforeEach } from "vitest";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import { resetAiServices } from "@/infrastructure/ai";
import { resolveOrganizationalScope } from "@/domain/organization/scope";
import {
  getCrossTeamDependencies,
  buildOrganizationalWhyNarrative,
} from "@/domain/organization/cross-team-dependencies";
import {
  getOrganizationalView,
  getOrganizationalAttention,
  getTopOrganizationalImpact,
  getGoalHealthProjection,
  canAccessOrganizationalView,
} from "@/application/organization/organizational-view.service";
import { NOW } from "@/infrastructure/seed/teams";

describe("organizational view", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("surfaces high-impact tasks using existing Impact Score", () => {
    const view = getOrganizationalView("person-vp-eng", NOW);
    expect(view).not.toBeNull();
    expect(view!.topImpact.length).toBeGreaterThan(0);
    const scores = view!.topImpact.map((i) => i.impactScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
    expect(view!.topImpact[0].task.impactScore.score).toBeGreaterThan(0);
  });

  it("surfaces cross-team dependency between different teams", () => {
    const store = getGraphStore();
    const graph = store.getGraph();
    const scope = resolveOrganizationalScope(
      graph,
      "person-vp-eng",
      (id) => store.getDirectReports(id),
    )!;
    const chains = getCrossTeamDependencies(graph, scope);
    expect(chains.length).toBeGreaterThan(0);
    const apiChain = chains.find((c) => c.rootTaskId === "task-api-migration");
    expect(apiChain).toBeDefined();
    const teamIds = new Set(apiChain!.chain.map((n) => n.teamId));
    expect(teamIds.size).toBeGreaterThan(1);
  });

  it("represents multi-hop dependency chains", () => {
    const store = getGraphStore();
    const graph = store.getGraph();
    const scope = resolveOrganizationalScope(
      graph,
      "person-vp-eng",
      (id) => store.getDirectReports(id),
    )!;
    const chains = getCrossTeamDependencies(graph, scope);
    const apiChain = chains.find((c) => c.rootTaskId === "task-api-migration");
    expect(apiChain!.chain.length).toBeGreaterThanOrEqual(3);
  });

  it("surfaces tasks linked to at-risk goals in goal health", () => {
    const store = getGraphStore();
    const graph = store.getGraph();
    const scope = resolveOrganizationalScope(
      graph,
      "person-vp-eng",
      (id) => store.getDirectReports(id),
    )!;
    const goals = getGoalHealthProjection(graph, scope);
    const retention = goals.find((g) => g.goalId === "goal-q3-retention");
    expect(retention).toBeDefined();
    expect(retention!.healthStatus).toBe("at_risk");
    expect(retention!.drivers.length).toBeGreaterThan(0);
  });

  it("surfaces organizational attention for high-risk work", () => {
    const store = getGraphStore();
    const graph = store.getGraph();
    const scope = resolveOrganizationalScope(
      graph,
      "person-vp-eng",
      (id) => store.getDirectReports(id),
    )!;
    const attention = getOrganizationalAttention(graph, scope, NOW);
    expect(attention.length).toBeGreaterThan(0);
    expect(attention.some((a) => a.taskId === "task-api-migration")).toBe(true);
  });

  it("scopes manager view to team and connected dependencies", () => {
    const store = getGraphStore();
    const graph = store.getGraph();
    const scope = resolveOrganizationalScope(
      graph,
      "person-devon",
      (id) => store.getDirectReports(id),
    )!;
    expect(scope.mode).toBe("manager");
    expect(scope.taskIds.has("task-api-migration")).toBe(true);
    expect(scope.taskIds.has("task-mobile-release")).toBe(true);
    expect(scope.taskIds.has("task-sla-ticket")).toBe(false);
  });

  it("scopes executive view to full organization", () => {
    const store = getGraphStore();
    const graph = store.getGraph();
    const scope = resolveOrganizationalScope(
      graph,
      "person-vp-eng",
      (id) => store.getDirectReports(id),
    )!;
    expect(scope.mode).toBe("executive");
    expect(scope.taskIds.has("task-sla-ticket")).toBe(true);
    expect(scope.taskIds.has("task-api-migration")).toBe(true);
  });

  it("renders organizational view without AI dependency", () => {
    const view = getOrganizationalView("person-devon", NOW);
    expect(view).not.toBeNull();
    expect(view!.briefing).toBeTruthy();
    expect(view!.topImpact.length).toBeGreaterThan(0);
    expect(view!.crossTeamDependencies.length).toBeGreaterThan(0);
  });

  it("builds organizational why narrative from graph facts only", () => {
    const graph = getGraphStore().getGraph();
    const task = graph.tasks.find((t) => t.id === "task-api-migration")!;
    const narrative = buildOrganizationalWhyNarrative(graph, task);
    expect(narrative).toContain("blocking");
    expect(narrative.toLowerCase()).not.toContain("burnout");
    expect(narrative.toLowerCase()).not.toContain("understaffed");
  });

  it("denies organizational access to IC personas", () => {
    expect(canAccessOrganizationalView("person-priya")).toBe(false);
    expect(canAccessOrganizationalView("person-devon")).toBe(true);
    expect(canAccessOrganizationalView("person-vp-eng")).toBe(true);
  });

  it("returns null organizational view for IC", () => {
    expect(getOrganizationalView("person-jordan", NOW)).toBeNull();
  });

  it("provides navigable dependency chain ids", () => {
    const view = getOrganizationalView("person-vp-eng", NOW);
    const chain = view!.crossTeamDependencies[0];
    expect(chain.id.startsWith("chain-")).toBe(true);
    expect(chain.dependencyIds.length).toBeGreaterThan(0);
  });
});

describe("organizational empty states", () => {
  beforeEach(() => {
    resetGraphStore();
  });

  it("returns empty attention when no tasks meet thresholds in isolated graph", () => {
    const store = getGraphStore();
    const graph = store.getGraph();
    for (const task of graph.tasks) {
      if (task.status === "open" || task.status === "in_progress") {
        store.updateTask(task.id, { status: "done", completedAt: NOW.toISOString() });
      }
    }
    const scope = resolveOrganizationalScope(
      store.getGraph(),
      "person-vp-eng",
      (id) => store.getDirectReports(id),
    )!;
    const attention = getOrganizationalAttention(store.getGraph(), scope, NOW);
    expect(attention.length).toBe(0);
  });
});
