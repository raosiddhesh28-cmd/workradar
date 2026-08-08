import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import { resetAiServices } from "@/infrastructure/ai";
import { resetEventBus, getEventBus } from "@/infrastructure/events";
import { assignTask, completeTask, deferTask } from "@/app/actions";
import { DomainEventType } from "@/domain/events/types";

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

describe("assign task action", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
    resetEventBus();
  });

  it("assigns task to a valid user", async () => {
    const result = await assignTask("task-oncall-runbook", "person-jordan");
    expect(result.ok).toBe(true);

    const task = getGraphStore().getTask("task-oncall-runbook");
    expect(task?.ownerId).toBe("person-jordan");
  });

  it("persists assignment in repository state", async () => {
    await assignTask("task-oncall-runbook", "person-alex");
    const task = getGraphStore().getTask("task-oncall-runbook");
    expect(task?.ownerId).toBe("person-alex");
  });

  it("publishes TASK_ASSIGNED event", async () => {
    await assignTask("task-oncall-runbook", "person-jordan");
    const events = getEventBus().query({
      types: [DomainEventType.TASK_ASSIGNED],
      taskId: "task-oncall-runbook",
    });
    expect(events.length).toBe(1);
    expect(events[0].entityId).toBe("task-oncall-runbook");
  });

  it("rejects invalid assignee", async () => {
    const result = await assignTask("task-oncall-runbook", "person-does-not-exist");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Unable to assign task");
    }

    const task = getGraphStore().getTask("task-oncall-runbook");
    expect(task?.ownerId).toBe("person-priya");
  });

  it("rejects assignment for missing task", async () => {
    const result = await assignTask("task-missing", "person-jordan");
    expect(result.ok).toBe(false);
  });

  it("does not break existing complete action", async () => {
    await assignTask("task-oncall-runbook", "person-jordan");
    await completeTask("task-oncall-runbook");
    const task = getGraphStore().getTask("task-oncall-runbook");
    expect(task?.status).toBe("done");
  });

  it("does not break existing defer action", async () => {
    const taskId = "task-pr-review-auth";
    await deferTask(taskId);
    const task = getGraphStore().getTask(taskId);
    expect(task?.status).toBe("deferred");
  });
});
