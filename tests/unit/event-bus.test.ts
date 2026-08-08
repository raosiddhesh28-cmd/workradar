import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryEventBus } from "@/infrastructure/events/in-memory-event-bus";
import { DomainEventType } from "@/domain/events/types";
import {
  createTaskCompletedEvent,
  createDependencyAddedEvent,
  createGoalHealthChangedEvent,
} from "@/domain/events/factories";
import { ORG_ID } from "@/infrastructure/seed/teams";

describe("InMemoryEventBus", () => {
  let bus: InMemoryEventBus;

  beforeEach(() => {
    bus = new InMemoryEventBus();
  });

  it("publishes events with monotonic sequence ordering", () => {
    const first = bus.publish(
      createTaskCompletedEvent({
        eventId: "evt-1",
        orgId: ORG_ID,
        timestamp: "2026-08-08T10:00:00.000Z",
        actorPersonId: "person-priya",
        sourceSystem: "mock-jira",
        taskId: "task-1",
        taskTitle: "First task",
        beforeStatus: "open",
        completedAt: "2026-08-08T10:00:00.000Z",
      }),
    );
    const second = bus.publish(
      createTaskCompletedEvent({
        eventId: "evt-2",
        orgId: ORG_ID,
        timestamp: "2026-08-08T10:01:00.000Z",
        actorPersonId: "person-priya",
        sourceSystem: "mock-jira",
        taskId: "task-2",
        taskTitle: "Second task",
        beforeStatus: "open",
        completedAt: "2026-08-08T10:01:00.000Z",
      }),
    );

    expect(first.sequence).toBe(1);
    expect(second.sequence).toBe(2);
    expect(bus.getAll().map((e) => e.sequence)).toEqual([1, 2]);
  });

  it("returns immutable published events", () => {
    const published = bus.publish(
      createTaskCompletedEvent({
        eventId: "evt-immutable",
        orgId: ORG_ID,
        timestamp: "2026-08-08T10:00:00.000Z",
        actorPersonId: "person-priya",
        sourceSystem: "mock-jira",
        taskId: "task-1",
        taskTitle: "Immutable task",
        beforeStatus: "open",
        completedAt: "2026-08-08T10:00:00.000Z",
      }),
    );

    expect(Object.isFrozen(published)).toBe(true);
    expect(() => {
      (published as { type: string }).type = DomainEventType.DEPENDENCY_ADDED;
    }).toThrow();
  });

  it("queries by type and timestamp", () => {
    bus.publish(
      createTaskCompletedEvent({
        eventId: "evt-a",
        orgId: ORG_ID,
        timestamp: "2026-08-08T09:00:00.000Z",
        actorPersonId: "person-priya",
        sourceSystem: "mock-jira",
        taskId: "task-a",
        taskTitle: "A",
        beforeStatus: "open",
        completedAt: "2026-08-08T09:00:00.000Z",
      }),
    );
    bus.publish(
      createDependencyAddedEvent({
        eventId: "evt-b",
        orgId: ORG_ID,
        timestamp: "2026-08-08T11:00:00.000Z",
        actorPersonId: "person-devon",
        sourceSystem: "mock-jira",
        dependencyId: "dep-1",
        blockerTaskId: "task-x",
        blockerPersonId: null,
        blockedTaskId: "task-y",
        blockedPersonId: null,
        description: "blocked",
      }),
    );

    const completed = bus.query({ types: [DomainEventType.TASK_COMPLETED] });
    expect(completed.length).toBe(1);
    expect(completed[0].eventId).toBe("evt-a");

    const recent = bus.getSince("2026-08-08T10:00:00.000Z");
    expect(recent.length).toBe(1);
    expect(recent[0].eventId).toBe("evt-b");
  });

  it("notifies subscribers on publish with optional type filter", () => {
    const received: string[] = [];
    bus.subscribe((e) => received.push(e.eventId), {
      types: [DomainEventType.DEPENDENCY_ADDED],
    });
    bus.subscribe((e) => received.push(`all:${e.eventId}`));

    bus.publish(
      createTaskCompletedEvent({
        eventId: "evt-skip",
        orgId: ORG_ID,
        timestamp: "2026-08-08T10:00:00.000Z",
        actorPersonId: "person-priya",
        sourceSystem: "mock-jira",
        taskId: "task-1",
        taskTitle: "Skip",
        beforeStatus: "open",
        completedAt: "2026-08-08T10:00:00.000Z",
      }),
    );
    bus.publish(
      createDependencyAddedEvent({
        eventId: "evt-catch",
        orgId: ORG_ID,
        timestamp: "2026-08-08T10:01:00.000Z",
        actorPersonId: "person-priya",
        sourceSystem: "mock-jira",
        dependencyId: "dep-2",
        blockerTaskId: "task-1",
        blockerPersonId: null,
        blockedTaskId: null,
        blockedPersonId: null,
        description: "flagged",
      }),
    );

    expect(received).toContain("evt-catch");
    expect(received).toContain("all:evt-catch");
    expect(received).toContain("all:evt-skip");
    expect(received.filter((id) => id === "evt-skip").length).toBe(0);
  });

  it("loads historical events in order without notifying subscribers", () => {
    const notified: string[] = [];
    bus.subscribe((e) => notified.push(e.eventId));

    const historical = [
      createGoalHealthChangedEvent({
        eventId: "hist-1",
        orgId: ORG_ID,
        timestamp: "2026-08-07T16:00:00.000Z",
        actorPersonId: "person-vp-eng",
        sourceSystem: "mock-seed",
        goalId: "goal-1",
        goalTitle: "Retention",
        beforeHealth: "on_track",
        afterHealth: "at_risk",
      }),
    ];
    bus.loadHistorical(
      historical.map((e, i) => ({ ...e, sequence: i + 1 } as const)),
    );

    expect(notified.length).toBe(0);
    expect(bus.getSequence()).toBe(1);
  });

  it("creates events with required metadata fields", () => {
    const published = bus.publish(
      createDependencyAddedEvent({
        eventId: "evt-meta",
        orgId: ORG_ID,
        timestamp: "2026-08-08T12:00:00.000Z",
        actorPersonId: "person-priya",
        sourceSystem: "mock-github",
        dependencyId: "dep-meta",
        blockerTaskId: "task-blocker",
        blockerPersonId: null,
        blockedTaskId: "task-blocked",
        blockedPersonId: null,
        description: "API blocks mobile",
        relatedPersonIds: ["person-priya", "person-jordan"],
      }),
    );

    expect(published.type).toBe(DomainEventType.DEPENDENCY_ADDED);
    expect(published.actorPersonId).toBe("person-priya");
    expect(published.sourceSystem).toBe("mock-github");
    expect(published.taskId).toBe("task-blocker");
    expect(published.dependencyId).toBe("dep-meta");
    expect(published.payload).toMatchObject({
      blockerTaskId: "task-blocker",
      blockedTaskId: "task-blocked",
    });
  });
});
