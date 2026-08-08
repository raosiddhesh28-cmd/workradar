import type { ReadonlyDomainEvent } from "@/domain/events/types";
import { DomainEventType } from "@/domain/events/types";
import type { GoalHealth } from "@/domain/types";
import { projectDomainEventToOrgEvent } from "@/domain/events/projector";
import { getGraphStore } from "@/infrastructure/store";
import type {
  DigestContext,
  DigestContextDependencyChange,
  DigestContextEvent,
  DigestContextGoalHealthChange,
  DigestSelectionCriteria,
} from "./types/digest-context";
import {
  selectDigestEvents,
  DEPENDENCY_EVENT_TYPES,
  GOAL_HEALTH_EVENT_TYPES,
} from "./digest-event-selection.service";

function extractBeforeAfter(
  event: ReadonlyDomainEvent,
): { before: string | null; after: string | null } {
  const payload = event.payload as unknown as Record<string, unknown>;
  if ("before" in payload && "after" in payload) {
    const before = payload.before as Record<string, unknown>;
    const after = payload.after as Record<string, unknown>;
    const beforeKey = Object.keys(before)[0];
    const afterKey = Object.keys(after)[0];
    return {
      before: beforeKey ? String(before[beforeKey]) : null,
      after: afterKey ? String(after[afterKey]) : null,
    };
  }
  return { before: null, after: null };
}

function toContextEvent(event: ReadonlyDomainEvent): DigestContextEvent {
  const orgEvent = projectDomainEventToOrgEvent(event);
  const { before, after } = extractBeforeAfter(event);

  return {
    eventId: event.eventId,
    sequence: event.sequence,
    type: event.type,
    timestamp: event.timestamp,
    actorPersonId: event.actorPersonId,
    sourceSystem: event.sourceSystem,
    entityType: event.entityType,
    entityId: event.entityId,
    taskId: event.taskId,
    goalId: event.goalId,
    dependencyId: event.dependencyId,
    summary: orgEvent.summary,
    payload: structuredClone(event.payload) as unknown as Record<string, unknown>,
    beforeValue: before,
    afterValue: after,
  };
}

function buildDependencyChanges(
  events: ReadonlyArray<DigestContextEvent>,
): DigestContextDependencyChange[] {
  const changes: DigestContextDependencyChange[] = [];

  for (const event of events) {
    if (!DEPENDENCY_EVENT_TYPES.has(event.type)) continue;

    let changeType: DigestContextDependencyChange["changeType"];
    switch (event.type) {
      case DomainEventType.DEPENDENCY_ADDED:
      case DomainEventType.TASK_BLOCKED:
        changeType = "added";
        break;
      case DomainEventType.DEPENDENCY_REMOVED:
        changeType = "removed";
        break;
      case DomainEventType.TASK_UNBLOCKED:
        changeType = "unblocked";
        break;
      default:
        changeType = "blocked";
    }

    const payload = event.payload as {
      dependencyId?: string;
      blockerTaskId?: string | null;
      blockedTaskId?: string | null;
      description?: string;
      reason?: string;
    };

    changes.push({
      dependencyId: event.dependencyId ?? event.entityId,
      changeType,
      description: payload.description ?? payload.reason ?? event.summary,
      blockerTaskId: payload.blockerTaskId ?? event.taskId,
      blockedTaskId: payload.blockedTaskId ?? null,
      sourceEventIds: [event.eventId],
    });
  }

  return changes;
}

function buildGoalHealthChanges(
  events: ReadonlyArray<DigestContextEvent>,
): DigestContextGoalHealthChange[] {
  const changes: DigestContextGoalHealthChange[] = [];

  for (const event of events) {
    if (!GOAL_HEALTH_EVENT_TYPES.has(event.type)) continue;
    const payload = event.payload as {
      goalTitle?: string;
      before?: { healthStatus: GoalHealth };
      after?: { healthStatus: GoalHealth };
    };

    changes.push({
      goalId: event.goalId ?? event.entityId,
      goalTitle: payload.goalTitle ?? event.summary,
      beforeHealth: payload.before?.healthStatus ?? "on_track",
      afterHealth: payload.after?.healthStatus ?? "at_risk",
      sourceEventIds: [event.eventId],
    });
  }

  return changes;
}

/**
 * Builds a frozen DigestContext from bus events and graph snapshots.
 * The provider receives this object only — no live store access.
 */
export function buildDigestContext(criteria: DigestSelectionCriteria): DigestContext {
  const store = getGraphStore();
  const person = store.getPerson(criteria.personId);
  if (!person) throw new Error(`Person not found: ${criteria.personId}`);

  const busEvents = selectDigestEvents(criteria);
  const contextEvents = busEvents.map(toContextEvent);
  const graph = store.getGraph();

  const taskIds = new Set(
    contextEvents.flatMap((e) => [e.taskId, e.entityType === "task" ? e.entityId : null]).filter(Boolean),
  );
  const goalIds = new Set(
    contextEvents.flatMap((e) => [e.goalId, e.entityType === "goal" ? e.entityId : null]).filter(Boolean),
  );

  const relevantTasks = graph.tasks
    .filter((t) => taskIds.has(t.id))
    .map((t) => ({
      taskId: t.id,
      title: t.title,
      ownerId: t.ownerId,
      status: t.status,
      linkedGoalId: t.linkedGoalId,
    }));

  const relevantGoals = graph.goals
    .filter((g) => goalIds.has(g.id))
    .map((g) => ({
      goalId: g.id,
      title: g.title,
      healthStatus: g.healthStatus,
      ownerId: g.ownerId,
    }));

  return {
    persona: {
      personId: person.id,
      personName: person.name,
      role: person.role,
      teamId: person.teamId,
    },
    dateRange: criteria.dateRange,
    events: contextEvents,
    relevantGoals,
    relevantTasks,
    dependencyChanges: buildDependencyChanges(contextEvents),
    goalHealthChanges: buildGoalHealthChanges(contextEvents),
  };
}
