"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getGraphStore } from "@/infrastructure/store";
import { SESSION_COOKIE, getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { NOW, ORG_ID } from "@/infrastructure/seed/teams";
import { publishDomainEvent } from "@/application/events/event-publisher.service";
import { createTaskAssignedEvent,
  createDependencyAddedEvent,
  createTaskCompletedEvent,
} from "@/domain/events/factories";

export type AssignTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function switchPersona(personId: string): Promise<void> {
  const store = getGraphStore();
  if (!store.getPerson(personId)) return;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, personId, { path: "/" });
  revalidatePath("/", "layout");
}

export async function completeTask(taskId: string): Promise<void> {
  const store = getGraphStore();
  const task = store.getTask(taskId);
  if (!task) return;

  const actorPersonId = await getCurrentPersonId();
  const completedAt = NOW.toISOString();

  store.updateTask(taskId, {
    status: "done",
    completedAt,
  });

  publishDomainEvent(
    createTaskCompletedEvent({
      eventId: `evt-complete-${taskId}-${Date.now()}`,
      orgId: ORG_ID,
      timestamp: completedAt,
      actorPersonId,
      sourceSystem: task.sourceSystem,
      taskId,
      taskTitle: task.title,
      beforeStatus: task.status,
      completedAt,
      relatedPersonIds: [task.ownerId, actorPersonId],
    }),
  );

  revalidatePath("/aerial");
  revalidatePath(`/tasks/${taskId}`);
}

export async function assignTask(
  taskId: string,
  assigneePersonId: string,
): Promise<AssignTaskResult> {
  try {
    const store = getGraphStore();
    const task = store.getTask(taskId);
    if (!task) {
      return { ok: false, message: "Unable to assign task. Please try again." };
    }

    const assignee = store.getPerson(assigneePersonId);
    if (!assignee) {
      return { ok: false, message: "Unable to assign task. Please try again." };
    }

    const beforeOwnerId = task.ownerId;
    if (beforeOwnerId === assigneePersonId) {
      return { ok: true };
    }

    const actorPersonId = await getCurrentPersonId();
    const timestamp = NOW.toISOString();

    store.updateTask(taskId, { ownerId: assigneePersonId });

    publishDomainEvent(
      createTaskAssignedEvent({
        eventId: `evt-assign-${taskId}-${Date.now()}`,
        orgId: ORG_ID,
        timestamp,
        actorPersonId,
        sourceSystem: task.sourceSystem,
        taskId,
        taskTitle: task.title,
        beforeOwnerId,
        afterOwnerId: assigneePersonId,
        relatedPersonIds: [beforeOwnerId, assigneePersonId, actorPersonId],
      }),
    );

    revalidatePath("/aerial");
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/search");
    revalidatePath(`/people/${assigneePersonId}`);
    if (beforeOwnerId) {
      revalidatePath(`/people/${beforeOwnerId}`);
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to assign task. Please try again." };
  }
}

export async function deferTask(taskId: string): Promise<void> {
  const store = getGraphStore();
  const task = store.getTask(taskId);
  if (!task) return;

  store.updateTask(taskId, { status: "deferred" });

  // task_deferred is not a Phase 1 bus event type — legacy graph digest only
  store.addEvent({
    id: `evt-defer-${taskId}-${Date.now()}`,
    orgId: ORG_ID,
    entityType: "task",
    entityId: taskId,
    eventType: "task_deferred",
    timestamp: NOW.toISOString(),
    summary: `${task.title} deferred`,
    payload: {},
    relevantPersonIds: [task.ownerId],
  });

  revalidatePath("/aerial");
  revalidatePath(`/tasks/${taskId}`);
}

export async function flagBlocker(taskId: string, description: string): Promise<void> {
  const store = getGraphStore();
  const task = store.getTask(taskId);
  if (!task) return;

  const actorPersonId = await getCurrentPersonId();
  const depId = `dep-flag-${Date.now()}`;
  const flaggedAt = NOW.toISOString();
  const graph = store.getGraph();
  graph.dependencies.push({
    id: depId,
    orgId: ORG_ID,
    blockerTaskId: taskId,
    blockerPersonId: null,
    blockedTaskId: null,
    blockedPersonId: null,
    status: "unresolved",
    flaggedAt,
    resolvedAt: null,
    description,
  });

  publishDomainEvent(
    createDependencyAddedEvent({
      eventId: `evt-dep-added-${depId}`,
      orgId: ORG_ID,
      timestamp: flaggedAt,
      actorPersonId,
      sourceSystem: task.sourceSystem,
      dependencyId: depId,
      blockerTaskId: taskId,
      blockerPersonId: null,
      blockedTaskId: null,
      blockedPersonId: null,
      description,
      relatedPersonIds: [task.ownerId, actorPersonId],
    }),
  );

  revalidatePath("/aerial");
  revalidatePath("/blockers");
}