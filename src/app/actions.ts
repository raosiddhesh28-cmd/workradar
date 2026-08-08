"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getGraphStore } from "@/infrastructure/store";
import { SESSION_COOKIE } from "@/infrastructure/session/mock-session";
import { NOW, ORG_ID } from "@/infrastructure/seed/teams";

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

  store.updateTask(taskId, {
    status: "done",
    completedAt: NOW.toISOString(),
  });

  store.addEvent({
    id: `evt-complete-${taskId}-${Date.now()}`,
    orgId: ORG_ID,
    entityType: "task",
    entityId: taskId,
    eventType: "task_completed",
    timestamp: NOW.toISOString(),
    summary: `${task.title} marked complete`,
    payload: {},
    relevantPersonIds: [task.ownerId],
  });

  revalidatePath("/aerial");
  revalidatePath(`/tasks/${taskId}`);
}

export async function deferTask(taskId: string): Promise<void> {
  const store = getGraphStore();
  const task = store.getTask(taskId);
  if (!task) return;

  store.updateTask(taskId, { status: "deferred" });

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

  const depId = `dep-flag-${Date.now()}`;
  const graph = store.getGraph();
  graph.dependencies.push({
    id: depId,
    orgId: ORG_ID,
    blockerTaskId: taskId,
    blockerPersonId: null,
    blockedTaskId: null,
    blockedPersonId: null,
    status: "unresolved",
    flaggedAt: NOW.toISOString(),
    resolvedAt: null,
    description,
  });

  store.addEvent({
    id: `evt-blocker-${depId}`,
    orgId: ORG_ID,
    entityType: "dependency",
    entityId: depId,
    eventType: "blocker_created",
    timestamp: NOW.toISOString(),
    summary: `Blocker flagged on ${task.title}: ${description}`,
    payload: { taskId },
    relevantPersonIds: [task.ownerId],
  });

  revalidatePath("/aerial");
  revalidatePath("/blockers");
}
