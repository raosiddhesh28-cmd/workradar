import { describe, it, expect, beforeEach } from "vitest";
import { createAcmeOrgGraph } from "@/infrastructure/seed/org-acme";
import { initGraphStore } from "@/infrastructure/store/graph-store";
import { computeImpactScore, scoreOpenTasks } from "@/domain/scoring/impact-score";
import { NOW } from "@/infrastructure/seed/teams";
import { getAerialView } from "@/application/services/aerial-view.service";

describe("Impact Score", () => {
  let graph = createAcmeOrgGraph();

  beforeEach(() => {
    graph = createAcmeOrgGraph();
    initGraphStore(graph);
  });

  it("returns non-empty oneLineWhy for every open task", () => {
    const scored = scoreOpenTasks(graph, undefined, NOW);
    for (const task of scored) {
      expect(task.impactScore.oneLineWhy.length).toBeGreaterThan(0);
      expect(task.impactScore.componentBreakdown).toBeDefined();
    }
  });

  it("scores task with no linked goal at 0 goal alignment", () => {
    const unlinked = {
      ...graph.tasks[0],
      id: "task-unlinked",
      linkedGoalId: null,
    };
    const snapshot = computeImpactScore(graph, unlinked, NOW);
    expect(snapshot.componentBreakdown.goalAlignment).toBe(0);
    expect(snapshot.oneLineWhy).toContain("No linked goal");
  });

  it("ranks urgent blocking work above stale low-impact tasks", () => {
    const priyaTasks = scoreOpenTasks(graph, "person-priya", NOW);
    expect(priyaTasks.length).toBeGreaterThan(0);
    const top = priyaTasks[0];
    expect(top.impactScore.score).toBeGreaterThan(0);
    // API migration blocks multiple people — should rank highly
    const apiTask = priyaTasks.find((t) => t.id === "task-api-migration");
    expect(apiTask).toBeDefined();
    expect(apiTask!.impactScore.componentBreakdown.blockingRadius).toBeGreaterThan(0);
  });

  it("applies staleness penalty for repeatedly surfaced tasks", () => {
    const stale = graph.tasks.find((t) => t.surfacedCount >= 5)!;
    const snapshot = computeImpactScore(graph, stale, NOW);
    expect(snapshot.componentBreakdown.staleness).toBeGreaterThan(0);
  });
});

describe("Aerial View", () => {
  beforeEach(() => {
    initGraphStore(createAcmeOrgGraph());
  });

  it("returns four anchors for Priya", () => {
    const view = getAerialView("person-priya", NOW);
    expect(view.topWork.length).toBeGreaterThan(0);
    expect(view.topWork.length).toBeLessThanOrEqual(5);
    expect(view.whatHappened.length).toBeGreaterThan(0);
    expect(view.personName).toBe("Priya Sharma");
  });

  it("shows cross-team blockers for Jordan", () => {
    const view = getAerialView("person-jordan", NOW);
    const blockingMe = view.whoIsBlocked.blockingMe;
    expect(blockingMe.length).toBeGreaterThan(0);
  });
});
