import type { OrgEvent } from "../types";
import type { DomainEvent, ReadonlyDomainEvent } from "./types";
import { DomainEventType } from "./types";

/**
 * Maps bus domain events to legacy OrgEvent records for graph digest projection.
 * Keeps aerial-view "What Happened" working without coupling digest to bus internals.
 */
export function projectDomainEventToOrgEvent(event: ReadonlyDomainEvent): OrgEvent {
  const base = {
    id: event.eventId,
    orgId: event.orgId,
    timestamp: event.timestamp,
    relevantPersonIds: [...event.relatedPersonIds],
    payload: { ...event.payload, busSequence: event.sequence, busType: event.type },
  };

  switch (event.type) {
    case DomainEventType.TASK_COMPLETED:
      return {
        ...base,
        entityType: "task",
        entityId: event.entityId,
        eventType: "task_completed",
        summary: `${(event.payload as { taskTitle: string }).taskTitle} marked complete`,
      };
    case DomainEventType.TASK_DEFERRED:
      return {
        ...base,
        entityType: "task",
        entityId: event.entityId,
        eventType: "task_deferred",
        summary: `${(event.payload as { taskTitle: string }).taskTitle} deferred`,
      };
    case DomainEventType.TASK_ASSIGNED:
      return {
        ...base,
        entityType: "task",
        entityId: event.entityId,
        eventType: "task_assigned",
        summary: `Task assigned: ${(event.payload as { taskTitle: string }).taskTitle}`,
      };
    case DomainEventType.TASK_BLOCKED:
      return {
        ...base,
        entityType: "task",
        entityId: event.entityId,
        eventType: "blocker_created",
        summary: `Task blocked: ${(event.payload as { taskTitle: string }).taskTitle}`,
      };
    case DomainEventType.TASK_UNBLOCKED:
      return {
        ...base,
        entityType: "task",
        entityId: event.entityId,
        eventType: "dependency_unblocked",
        summary: `Task unblocked: ${(event.payload as { taskTitle: string }).taskTitle}`,
      };
    case DomainEventType.DUE_DATE_CHANGED:
      return {
        ...base,
        entityType: "task",
        entityId: event.entityId,
        eventType: "due_date_changed",
        summary: `Due date changed: ${(event.payload as { taskTitle: string }).taskTitle}`,
      };
    case DomainEventType.DEPENDENCY_ADDED:
      return {
        ...base,
        entityType: "dependency",
        entityId: event.entityId,
        eventType: "blocker_created",
        summary: `Dependency added: ${(event.payload as { description: string }).description}`,
      };
    case DomainEventType.DEPENDENCY_REMOVED:
      return {
        ...base,
        entityType: "dependency",
        entityId: event.entityId,
        eventType: "blocker_resolved",
        summary: `Dependency removed: ${(event.payload as { reason: string }).reason}`,
      };
    case DomainEventType.GOAL_HEALTH_CHANGED:
      const p = event.payload as {
        goalTitle: string;
        before: { healthStatus: string };
        after: { healthStatus: string };
      };
      return {
        ...base,
        entityType: "goal",
        entityId: event.entityId,
        eventType: "goal_health_changed",
        summary: `${p.goalTitle} moved from ${p.before.healthStatus} to ${p.after.healthStatus}`,
        payload: { from: p.before.healthStatus, to: p.after.healthStatus },
      };
    default:
      return {
        ...base,
        entityType: "task",
        entityId: event.entityId,
        eventType: "task_assigned",
        summary: `Event: ${event.type}`,
      };
  }
}

export function projectSeedOrgEventToDomainEvent(
  orgEvent: OrgEvent,
  sequence: number,
): DomainEvent {
  const actor =
    orgEvent.relevantPersonIds[0] ?? "system";
  const sourceSystem =
    (orgEvent.payload.sourceSystem as string | undefined) ?? "mock-seed";

  const envelope = {
    eventId: orgEvent.id,
    sequence,
    orgId: orgEvent.orgId,
    timestamp: orgEvent.timestamp,
    actorPersonId: actor,
    sourceSystem,
    relatedPersonIds: [...orgEvent.relevantPersonIds],
  };

  switch (orgEvent.eventType) {
    case "task_completed":
      return {
        ...envelope,
        type: DomainEventType.TASK_COMPLETED,
        entityType: "task",
        entityId: orgEvent.entityId,
        taskId: orgEvent.entityId,
        goalId: null,
        dependencyId: null,
        payload: {
          taskTitle:
            (orgEvent.payload.taskTitle as string) ?? orgEvent.summary,
          before: { status: "in_progress" },
          after: {
            status: "done",
            completedAt: orgEvent.timestamp,
          },
        },
      };
    case "task_assigned":
      return {
        ...envelope,
        type: DomainEventType.TASK_ASSIGNED,
        entityType: "task",
        entityId: orgEvent.entityId,
        taskId: orgEvent.entityId,
        goalId: null,
        dependencyId: null,
        payload: {
          taskTitle: orgEvent.summary,
          assigneePersonId: actor,
          before: { ownerId: null },
          after: { ownerId: actor },
        },
      };
    case "blocker_created":
      if (orgEvent.entityType === "dependency") {
        return {
          ...envelope,
          type: DomainEventType.DEPENDENCY_ADDED,
          entityType: "dependency",
          entityId: orgEvent.entityId,
          taskId: (orgEvent.payload.blockerTaskId as string) ?? null,
          goalId: null,
          dependencyId: orgEvent.entityId,
          payload: {
            dependencyId: orgEvent.entityId,
            blockerTaskId: (orgEvent.payload.blockerTaskId as string) ?? null,
            blockerPersonId: null,
            blockedTaskId: (orgEvent.payload.blockedTaskId as string) ?? null,
            blockedPersonId: null,
            description: orgEvent.summary,
          },
        };
      }
      return {
        ...envelope,
        type: DomainEventType.TASK_BLOCKED,
        entityType: "task",
        entityId: orgEvent.entityId,
        taskId: orgEvent.entityId,
        goalId: null,
        dependencyId: orgEvent.entityId,
        payload: {
          taskTitle: orgEvent.summary,
          blockedByTaskId: null,
          blockedByPersonId: null,
          dependencyId: orgEvent.entityId,
          description: orgEvent.summary,
        },
      };
    case "dependency_unblocked":
      return {
        ...envelope,
        type: DomainEventType.TASK_UNBLOCKED,
        entityType: "dependency",
        entityId: orgEvent.entityId,
        taskId: (orgEvent.payload.blockedTaskId as string) ?? null,
        goalId: null,
        dependencyId: orgEvent.entityId,
        payload: {
          taskTitle: orgEvent.summary,
          dependencyId: orgEvent.entityId,
          resolution: orgEvent.summary,
        },
      };
    case "task_deferred":
      return {
        ...envelope,
        type: DomainEventType.TASK_DEFERRED,
        entityType: "task",
        entityId: orgEvent.entityId,
        taskId: orgEvent.entityId,
        goalId: null,
        dependencyId: null,
        payload: {
          taskTitle:
            (orgEvent.payload.taskTitle as string) ?? orgEvent.summary,
          before: { status: "open" },
          after: { status: "deferred" },
        },
      };
    case "goal_health_changed":
      return {
        ...envelope,
        type: DomainEventType.GOAL_HEALTH_CHANGED,
        entityType: "goal",
        entityId: orgEvent.entityId,
        taskId: null,
        goalId: orgEvent.entityId,
        dependencyId: null,
        payload: {
          goalTitle: orgEvent.summary.split(" goal")[0] ?? orgEvent.entityId,
          before: {
            healthStatus: (orgEvent.payload.from as "on_track" | "at_risk" | "breached") ?? "on_track",
          },
          after: {
            healthStatus: (orgEvent.payload.to as "on_track" | "at_risk" | "breached") ?? "at_risk",
          },
        },
      };
    default:
      const entityType: DomainEvent["entityType"] =
        orgEvent.entityType === "person"
          ? "task"
          : orgEvent.entityType;
      return {
        ...envelope,
        type: DomainEventType.TASK_ASSIGNED,
        entityType,
        entityId: orgEvent.entityId,
        taskId: entityType === "task" ? orgEvent.entityId : null,
        goalId: entityType === "goal" ? orgEvent.entityId : null,
        dependencyId: entityType === "dependency" ? orgEvent.entityId : null,
        payload: {
          taskTitle: orgEvent.summary,
          assigneePersonId: actor,
          before: { ownerId: null },
          after: { ownerId: actor },
        },
      };
  }
}
