"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getGraphStore } from "@/infrastructure/store";
import { SESSION_COOKIE, getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { NOW, ORG_ID } from "@/infrastructure/seed/teams";
import { publishDomainEvent } from "@/application/events/event-publisher.service";
import {
  createTaskAssignedEvent,
  createDependencyAddedEvent,
  createTaskCompletedEvent,
  createTaskDeferredEvent,
  createTaskUnblockedEvent,
  createDependencyRemovedEvent,
} from "@/domain/events/factories";

export type AssignTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export type FlagBlockerResult =
  | { ok: true }
  | { ok: false; message: string };

export async function switchPersona(personId: string): Promise<void> {
  const store = getGraphStore();
  if (!store.getPerson(personId)) return;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, personId, { path: "/" });
  revalidatePath("/", "layout");
}

function revalidateTaskViews(taskId: string): void {
  revalidatePath("/aerial");
  revalidatePath("/blockers");
  revalidatePath("/team");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
}

export async function completeTask(taskId: string): Promise<void> {
  const store = getGraphStore();
  const task = store.getTask(taskId);
  if (!task || task.status === "done") return;

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

  const graph = store.getGraph();
  const resolvedDeps = graph.dependencies.filter(
    (d) => d.status === "unresolved" && d.blockerTaskId === taskId,
  );

  for (const dep of resolvedDeps) {
    store.updateDependency(dep.id, {
      status: "resolved",
      resolvedAt: completedAt,
    });

    const blockedTask = dep.blockedTaskId
      ? store.getTask(dep.blockedTaskId)
      : null;
    const relatedIds = new Set([task.ownerId, actorPersonId]);
    if (blockedTask) relatedIds.add(blockedTask.ownerId);
    if (dep.blockedPersonId) relatedIds.add(dep.blockedPersonId);

    if (dep.blockedTaskId && blockedTask) {
      publishDomainEvent(
        createTaskUnblockedEvent({
          eventId: `evt-unblock-${dep.id}-${Date.now()}`,
          orgId: ORG_ID,
          timestamp: completedAt,
          actorPersonId,
          sourceSystem: task.sourceSystem,
          taskId: dep.blockedTaskId,
          taskTitle: blockedTask.title,
          dependencyId: dep.id,
          resolution: `Blocker task "${task.title}" completed`,
          relatedPersonIds: [...relatedIds],
        }),
      );
    } else {
      publishDomainEvent(
        createDependencyRemovedEvent({
          eventId: `evt-dep-removed-${dep.id}-${Date.now()}`,
          orgId: ORG_ID,
          timestamp: completedAt,
          actorPersonId,
          sourceSystem: task.sourceSystem,
          dependencyId: dep.id,
          blockerTaskId: taskId,
          blockedTaskId: dep.blockedTaskId,
          reason: `Blocker task "${task.title}" completed`,
          relatedPersonIds: [...relatedIds],
        }),
      );
    }
  }

  revalidateTaskViews(taskId);
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
    revalidatePath("/tasks");
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
  if (!task || task.status === "deferred" || task.status === "done") return;

  const actorPersonId = await getCurrentPersonId();
  const timestamp = NOW.toISOString();
  const beforeStatus = task.status;

  store.updateTask(taskId, {
    status: "deferred",
    completedAt: null,
  });

  publishDomainEvent(
    createTaskDeferredEvent({
      eventId: `evt-defer-${taskId}-${Date.now()}`,
      orgId: ORG_ID,
      timestamp,
      actorPersonId,
      sourceSystem: task.sourceSystem,
      taskId,
      taskTitle: task.title,
      beforeStatus,
      relatedPersonIds: [task.ownerId, actorPersonId],
    }),
  );

  revalidateTaskViews(taskId);
}

export async function flagBlocker(
  taskId: string,
  description: string,
): Promise<FlagBlockerResult> {
  const trimmed = description.trim();
  if (!trimmed) {
    return { ok: false, message: "Please describe the blocker." };
  }

  const store = getGraphStore();
  const task = store.getTask(taskId);
  if (!task) {
    return { ok: false, message: "Unable to flag blocker. Please try again." };
  }

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
    description: trimmed,
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
      description: trimmed,
      relatedPersonIds: [task.ownerId, actorPersonId],
    }),
  );

  revalidateTaskViews(taskId);
  return { ok: true };
}
