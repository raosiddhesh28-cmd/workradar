import { describe, it, expect, beforeEach, vi } from "vitest";
import { createAcmeOrgGraph } from "@/infrastructure/seed/org-acme";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import { getEventBus } from "@/infrastructure/events";
import { DomainEventType } from "@/domain/events/types";
import { completeTask, flagBlocker } from "@/app/actions";
import { NOW, ORG_ID } from "@/infrastructure/seed/teams";
import { publishDomainEvent } from "@/application/events/event-publisher.service";
import { createTaskCompletedEvent } from "@/domain/events/factories";

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

describe("MVP actions and Event Bus integration", () => {
  beforeEach(() => {
    resetGraphStore();
  });

  it("hydrates bus from seed data with correct count", () => {
    const bus = getEventBus();
    expect(bus.getSequence()).toBe(11);
    const types = bus.getAll().map((e) => e.type);
    expect(types).toContain(DomainEventType.GOAL_HEALTH_CHANGED);
    expect(types).toContain(DomainEventType.TASK_COMPLETED);
    expect(types).toContain(DomainEventType.DEPENDENCY_ADDED);
  });

  it("completeTask publishes TASK_COMPLETED to bus and projects to graph", async () => {
    resetGraphStore();
    const bus = getEventBus();
    const beforeCount = bus.getSequence();

    await completeTask("task-oncall-runbook");

    const busEvents = bus.query({
      types: [DomainEventType.TASK_COMPLETED],
      taskId: "task-oncall-runbook",
    });
    expect(busEvents.length).toBe(1);
    const latest = busEvents[0];
    expect(latest.taskId).toBe("task-oncall-runbook");
    expect(latest.payload).toMatchObject({
      before: { status: "open" },
      after: { status: "done" },
    });
    expect(bus.getSequence()).toBe(beforeCount + 1);

    const graphEvents = getGraphStore().getGraph().events;
    expect(
      graphEvents.some(
        (e) =>
          e.entityId === "task-oncall-runbook" && e.eventType === "task_completed",
      ),
    ).toBe(true);
  });

  it("flagBlocker publishes DEPENDENCY_ADDED to bus", async () => {
    resetGraphStore();
    const bus = getEventBus();
    const beforeCount = bus.getSequence();

    await flagBlocker("task-rate-limit-fix", "Waiting on vendor patch");

    const added = bus.query({ types: [DomainEventType.DEPENDENCY_ADDED] });
    const latest = added[added.length - 1];
    expect(latest.type).toBe(DomainEventType.DEPENDENCY_ADDED);
    expect(latest.payload).toMatchObject({
      description: "Waiting on vendor patch",
      blockerTaskId: "task-rate-limit-fix",
    });
    expect(bus.getSequence()).toBe(beforeCount + 1);
  });

  it("publishDomainEvent does not modify Impact Score path", () => {
    const bus = getEventBus();
    publishDomainEvent(
      createTaskCompletedEvent({
        eventId: "evt-score-isolation",
        orgId: ORG_ID,
        timestamp: NOW.toISOString(),
        actorPersonId: "person-priya",
        sourceSystem: "mock-jira",
        taskId: "task-api-migration",
        taskTitle: "API migration",
        beforeStatus: "open",
        completedAt: NOW.toISOString(),
      }),
    );
    const published = bus.getAll().find((e) => e.eventId === "evt-score-isolation");
    expect(published?.type).toBe(DomainEventType.TASK_COMPLETED);
    expect(published?.payload).not.toHaveProperty("impactScore");
  });
});
