import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import { getEventBus } from "@/infrastructure/events";
import { DomainEventType } from "@/domain/events/types";
import {
  completeTask,
  deferTask,
  flagBlocker,
} from "@/app/actions";
import { getAerialView } from "@/application/services/aerial-view.service";
import { getTeamRollup } from "@/application/services/aerial-view.service";
import { getGroundedWhatHappenedDigest } from "@/application/digest";
import { NOW } from "@/infrastructure/seed/teams";
import { classifyDueDate } from "@/domain/scheduling/due-date";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "workradar-person-id" ? { value: "person-priya" } : undefined,
    set: vi.fn(),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("functional QA — task actions", () => {
  beforeEach(() => {
    resetGraphStore();
  });

  it("completeTask is idempotent", async () => {
    const bus = getEventBus();
    const before = bus.getSequence();
    await completeTask("task-oncall-runbook");
    await completeTask("task-oncall-runbook");
    const events = bus.query({
      types: [DomainEventType.TASK_COMPLETED],
      taskId: "task-oncall-runbook",
    });
    expect(events.length).toBe(1);
    expect(bus.getSequence()).toBe(before + 1);
  });

  it("completeTask resolves blocker dependencies", async () => {
    await completeTask("task-api-migration");
    const graph = getGraphStore().getGraph();
    const dep = graph.dependencies.find((d) => d.id === "dep-api-blocks-mobile");
    expect(dep?.status).toBe("resolved");
    const unblocked = getEventBus().query({
      types: [DomainEventType.TASK_UNBLOCKED],
    });
    expect(unblocked.some((e) => e.dependencyId === "dep-api-blocks-mobile")).toBe(
      true,
    );
  });

  it("deferTask publishes TASK_DEFERRED to bus", async () => {
    const bus = getEventBus();
    const before = bus.getSequence();
    await deferTask("task-oncall-runbook");
    const deferred = bus.query({
      types: [DomainEventType.TASK_DEFERRED],
      taskId: "task-oncall-runbook",
    });
    expect(deferred.length).toBe(1);
    expect(bus.getSequence()).toBe(before + 1);
    expect(getGraphStore().getTask("task-oncall-runbook")?.status).toBe(
      "deferred",
    );
  });

  it("deferTask does not run on completed tasks", async () => {
    await completeTask("task-oncall-runbook");
    const bus = getEventBus();
    const before = bus.getSequence();
    await deferTask("task-oncall-runbook");
    expect(bus.getSequence()).toBe(before);
    expect(getGraphStore().getTask("task-oncall-runbook")?.status).toBe("done");
  });

  it("defer clears completedAt for consistent due-date display", async () => {
    const store = getGraphStore();
    store.updateTask("task-rate-limit-fix", {
      status: "in_progress",
      completedAt: "2026-08-08T10:00:00.000Z",
    });
    await deferTask("task-rate-limit-fix");
    const task = store.getTask("task-rate-limit-fix")!;
    expect(task.status).toBe("deferred");
    expect(task.completedAt).toBeNull();
    const due = classifyDueDate(task.dueDate, task.completedAt, task.status, NOW);
    expect(due.status).not.toBe("completed");
  });

  it("flagBlocker rejects empty description", async () => {
    const result = await flagBlocker("task-rate-limit-fix", "   ");
    expect(result.ok).toBe(false);
  });

  it("flagBlocker accepts valid description", async () => {
    const result = await flagBlocker(
      "task-rate-limit-fix",
      "Waiting on vendor patch",
    );
    expect(result.ok).toBe(true);
  });
});

describe("functional QA — aerial and team views", () => {
  beforeEach(() => {
    resetGraphStore();
  });

  it("im_blocking shows blocker task title for Priya blocking Marcus", async () => {
    const view = await getAerialView("person-priya", NOW);
    const blocking = view.whoIsBlocked.imBlocking.find(
      (b) => b.dependency.id === "dep-priya-blocks-marcus",
    );
    expect(blocking).toBeDefined();
    expect(blocking!.taskTitle).toContain("auth middleware");
  });

  it("team rollup counts open tasks not top-work cap", async () => {
    const rollup = await getTeamRollup("person-devon", NOW);
    const marcus = rollup!.reports.find((r) => r.person.id === "person-marcus");
    expect(marcus).toBeDefined();
    expect(marcus!.topWorkCount).toBeGreaterThanOrEqual(1);
  });

  it("team blockers are deduplicated", async () => {
    const rollup = await getTeamRollup("person-devon", NOW);
    const ids = rollup!.teamBlockers.map((b) => b.dependency.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("defer appears in digest event bus path", async () => {
    await deferTask("task-oncall-runbook");
    const digest = await getGroundedWhatHappenedDigest("person-priya", NOW);
    const hasDefer = digest.sourceEvents.some((e) =>
      e.summary.toLowerCase().includes("deferred"),
    );
    expect(hasDefer).toBe(true);
  });
});

describe("functional QA — personas", () => {
  it("demo personas exclude executive switcher entry", async () => {
    const { DEMO_PERSONAS } = await import("@/infrastructure/seed/people");
    expect(DEMO_PERSONAS.map((p) => p.id)).toEqual([
      "person-priya",
      "person-devon",
      "person-jordan",
      "person-alex",
    ]);
  });
});
