import { describe, it, expect, beforeEach } from "vitest";
import type { Dependency, OrgGraph, Task } from "@/domain/types";
import { DEFAULT_BLOCKER_CHAIN_CONFIG } from "@/domain/blocker/config";
import {
  traverseUpstreamBlockerChain,
  buildBlockerChainForDependency,
  buildDeterministicBlockerNarrative,
} from "@/domain/graph/blocker-chain";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import { resetAiServices } from "@/infrastructure/ai";
import { buildBlockerRootCauseContext } from "@/application/ai/context/build-ai-context";
import {
  explainBlockerChain,
  getDeterministicBlockerNarrative,
} from "@/application/blocker/blocker-narrative.service";
import { MockBlockerRootCauseNarrativeService } from "@/infrastructure/ai";
import { withAiFallback, buildBlockerFallback } from "@/infrastructure/ai";
import { NOW, ORG_ID } from "@/infrastructure/seed/teams";

function makeTask(id: string, title: string, ownerId = "person-a"): Task {
  return {
    id,
    orgId: ORG_ID,
    title,
    description: title,
    ownerId,
    linkedGoalId: null,
    initiativeId: null,
    startDate: null,
    dueDate: null,
    status: "open",
    sourceSystem: "test",
    surfacedCount: 0,
    createdAt: NOW.toISOString(),
    completedAt: null,
  };
}

function makeDep(
  id: string,
  blockerTaskId: string,
  blockedTaskId: string,
): Dependency {
  return {
    id,
    orgId: ORG_ID,
    blockerTaskId,
    blockerPersonId: null,
    blockedTaskId,
    blockedPersonId: null,
    status: "unresolved",
    flaggedAt: "2026-08-05T10:00:00.000Z",
    resolvedAt: null,
    description: `${blockerTaskId} blocks ${blockedTaskId}`,
  };
}

function patchGraph(patch: Partial<OrgGraph>): OrgGraph {
  const graph = getGraphStore().getGraph();
  return { ...graph, ...patch };
}

describe("blocker chain traversal", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("identifies direct blocker A → B", () => {
    const graph = patchGraph({
      tasks: [makeTask("task-a", "Task A"), makeTask("task-b", "Task B")],
      dependencies: [makeDep("dep-1", "task-a", "task-b")],
    });

    const result = traverseUpstreamBlockerChain(
      graph,
      "task-b",
      4,
      NOW,
      "task-a",
      "dep-1",
    );

    expect(result.immediateBlockerTaskId).toBe("task-a");
    expect(result.rootBlockerTaskId).toBe("task-a");
    expect(result.nodes.map((n) => n.taskId)).toEqual(["task-b", "task-a"]);
    expect(result.chainComplete).toBe(true);
  });

  it("traverses multi-hop chain A → B → C → D", () => {
    const graph = patchGraph({
      tasks: [
        makeTask("task-a", "A"),
        makeTask("task-b", "B"),
        makeTask("task-c", "C"),
        makeTask("task-d", "D"),
      ],
      dependencies: [
        makeDep("dep-1", "task-a", "task-b"),
        makeDep("dep-2", "task-b", "task-c"),
        makeDep("dep-3", "task-c", "task-d"),
      ],
    });

    const result = traverseUpstreamBlockerChain(
      graph,
      "task-d",
      4,
      NOW,
      "task-c",
      "dep-3",
    );

    expect(result.nodes.map((n) => n.taskId)).toEqual([
      "task-d",
      "task-c",
      "task-b",
      "task-a",
    ]);
    expect(result.rootBlockerTaskId).toBe("task-a");
  });

  it("does not traverse beyond maxBlockerChainDepth", () => {
    const tasks = Array.from({ length: 6 }, (_, i) =>
      makeTask(`task-${i}`, `Task ${i}`),
    );
    const dependencies = Array.from({ length: 5 }, (_, i) =>
      makeDep(`dep-${i}`, `task-${i}`, `task-${i + 1}`),
    );

    const graph = patchGraph({ tasks, dependencies });
    const result = traverseUpstreamBlockerChain(
      graph,
      "task-5",
      DEFAULT_BLOCKER_CHAIN_CONFIG.maxBlockerChainDepth,
      NOW,
      "task-4",
      "dep-4",
    );

    expect(result.nodes.length).toBeLessThanOrEqual(
      DEFAULT_BLOCKER_CHAIN_CONFIG.maxBlockerChainDepth + 1,
    );
    expect(result.hasDeeperUpstream).toBe(true);
  });

  it("preserves multiple independent blockers on the same task", () => {
    const graph = patchGraph({
      tasks: [
        makeTask("task-a", "A"),
        makeTask("task-b", "B"),
        makeTask("task-c", "C"),
        makeTask("task-x", "X"),
      ],
      dependencies: [
        makeDep("dep-a", "task-a", "task-x"),
        makeDep("dep-b", "task-b", "task-x"),
        makeDep("dep-c", "task-c", "task-x"),
      ],
    });

    const chainA = buildBlockerChainForDependency(
      graph,
      graph.dependencies.find((d) => d.id === "dep-a")!,
      "blocking_me",
      NOW,
    );
    const chainB = buildBlockerChainForDependency(
      graph,
      graph.dependencies.find((d) => d.id === "dep-b")!,
      "blocking_me",
      NOW,
    );

    expect(chainA.immediateBlockerTaskId).toBe("task-a");
    expect(chainB.immediateBlockerTaskId).toBe("task-b");
    expect(chainA.immediateBlockerTaskId).not.toBe(chainB.immediateBlockerTaskId);
  });

  it("terminates safely on cyclic dependencies", () => {
    const graph = patchGraph({
      tasks: [
        makeTask("task-a", "A"),
        makeTask("task-b", "B"),
        makeTask("task-c", "C"),
      ],
      dependencies: [
        makeDep("dep-1", "task-a", "task-b"),
        makeDep("dep-2", "task-b", "task-c"),
        makeDep("dep-3", "task-c", "task-a"),
      ],
    });

    const result = traverseUpstreamBlockerChain(
      graph,
      "task-c",
      4,
      NOW,
      "task-b",
      "dep-2",
    );

    expect(result.cycleDetected).toBe(true);
    expect(result.cycleTaskIds.length).toBeGreaterThan(0);
  });

  it("represents incomplete chain when no upstream blocker exists", () => {
    const graph = patchGraph({
      tasks: [makeTask("task-a", "A"), makeTask("task-b", "B")],
      dependencies: [makeDep("dep-1", "task-a", "task-b")],
    });

    const chain = buildBlockerChainForDependency(
      graph,
      graph.dependencies[0],
      "blocking_me",
      NOW,
    );

    expect(chain.chainComplete).toBe(true);
    expect(chain.hasDeeperUpstream).toBe(false);
    const narrative = buildDeterministicBlockerNarrative(chain);
    expect(narrative).toContain("waiting on");
    expect(narrative).not.toMatch(/because engineering/i);
  });
});

describe("blocker narrative grounding", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("includes owner only when assignee exists in seed data", async () => {
    const context = buildBlockerRootCauseContext(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );
    const immediate = context.blockingChain.nodes.find(
      (n) => n.taskId === context.blockingChain.immediateBlockerTaskId,
    );
    expect(immediate?.ownerName).toBe("Priya Sharma");
  });

  it("calculates overdue independently from days blocked", async () => {
    const context = buildBlockerRootCauseContext(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );
    expect(context.daysBlocked).toBeGreaterThan(0);
    const blockedNode = context.blockingChain.nodes[0];
    expect(blockedNode.daysOverdue).toBe(1);
    expect(context.daysBlocked).not.toBe(blockedNode.daysOverdue);
  });

  it("includes goal context only when task-goal link exists", async () => {
    const context = buildBlockerRootCauseContext(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );
    const blockedNode = context.blockingChain.nodes[0];
    expect(blockedNode.goalTitle).toBe("Mobile App v2 Launch");
    expect(blockedNode.goalHealth).toBe("at_risk");
  });

  it("mock narrative uses only structured facts and avoids recommendations", async () => {
    const service = new MockBlockerRootCauseNarrativeService();
    const context = buildBlockerRootCauseContext(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );
    const result = await service.explainBlocker(context);

    expect(result.data.narrative).toContain("Complete API gateway migration");
    expect(result.data.narrative).not.toMatch(/contact/i);
    expect(result.data.narrative).not.toMatch(/escalat/i);
    expect(result.data.suggestedNextStep).toBeUndefined();
  });

  it("falls back to deterministic chain when AI service throws", async () => {
    const service = new MockBlockerRootCauseNarrativeService();
    service.setShouldThrow(true);
    const context = buildBlockerRootCauseContext(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );

    const result = await withAiFallback(
      () => service.explainBlocker(context),
      () => buildBlockerFallback(context),
    );

    expect(result.status).toBe("fallback");
    expect(result.data.narrative.length).toBeGreaterThan(0);
    expect(context.blockingChain.nodes.length).toBeGreaterThan(1);
  });

  it("Jordan seed chain includes infrastructure upstream blocker", async () => {
    const context = buildBlockerRootCauseContext(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );
    expect(context.blockingChain.rootBlockerTitle).toBe("Infrastructure security review");
    expect(context.blockingChain.nodes.map((n) => n.taskTitle)).toEqual([
      "Ship mobile v2 release candidate",
      "Complete API gateway migration",
      "Infrastructure security review",
    ]);
  });

  it("explainBlockerChain orchestration returns narrative", async () => {
    const result = await explainBlockerChain(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(result.rootBlockerSummary).toContain("Root blocker");
  });

  it("deterministic fallback works without AI", () => {
    const graph = getGraphStore().getGraph();
    const dep = graph.dependencies.find((d) => d.id === "dep-api-blocks-mobile")!;
    const chain = buildBlockerChainForDependency(graph, dep, "blocking_me", NOW);
    const result = getDeterministicBlockerNarrative(chain);
    expect(result.narrative).toBeTruthy();
    expect(result.aiSource).toBe("deterministic-fallback");
  });
});
