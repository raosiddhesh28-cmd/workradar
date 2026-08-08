import type { ReadonlyDomainEvent } from "@/domain/events/types";
import { DomainEventType } from "@/domain/events/types";
import { queryDomainEvents } from "@/application/events/event-publisher.service";
import { getGraphStore } from "@/infrastructure/store";
import type { DigestSelectionCriteria } from "./types/digest-context";
import type { Person } from "@/domain/types";

/**
 * Resolves which person IDs an event must touch to be in scope for a persona.
 * Managers see their direct reports' events; ICs see only their own.
 */
export function getPersonaScopedPersonIds(person: Person): string[] {
  const store = getGraphStore();
  const ids = new Set<string>([person.id]);

  if (person.role === "manager") {
    for (const report of store.getDirectReports(person.id)) {
      ids.add(report.id);
    }
  }

  if (person.role === "executive") {
    for (const member of store.getGraph().people) {
      ids.add(member.id);
    }
  }

  return [...ids];
}

function eventTouchesScopedPersons(
  event: ReadonlyDomainEvent,
  scopedPersonIds: Set<string>,
): boolean {
  return event.relatedPersonIds.some((id) => scopedPersonIds.has(id));
}

function matchesEntityFilters(
  event: ReadonlyDomainEvent,
  criteria: DigestSelectionCriteria,
): boolean {
  if (criteria.taskIds?.length) {
    const taskMatch =
      (event.taskId && criteria.taskIds.includes(event.taskId)) ||
      criteria.taskIds.includes(event.entityId);
    if (!taskMatch) return false;
  }

  if (criteria.goalIds?.length) {
    const goalMatch =
      (event.goalId && criteria.goalIds.includes(event.goalId)) ||
      criteria.goalIds.includes(event.entityId);
    if (!goalMatch) return false;
  }

  if (criteria.dependencyIds?.length) {
    const depMatch =
      (event.dependencyId && criteria.dependencyIds.includes(event.dependencyId)) ||
      criteria.dependencyIds.includes(event.entityId);
    if (!depMatch) return false;
  }

  return true;
}

/**
 * Retrieves persona-scoped, deterministically ordered events from the Event Bus.
 */
export function selectDigestEvents(criteria: DigestSelectionCriteria): ReadonlyDomainEvent[] {
  const store = getGraphStore();
  const person = store.getPerson(criteria.personId);
  if (!person) return [];

  const scopedIds = new Set(getPersonaScopedPersonIds(person));

  const busEvents = queryDomainEvents({
    since: criteria.dateRange.since,
    until: criteria.dateRange.until,
  });

  return busEvents
    .filter((event) => eventTouchesScopedPersons(event, scopedIds))
    .filter((event) => matchesEntityFilters(event, criteria))
    .sort((a, b) => a.sequence - b.sequence);
}

export function defaultDigestDateRange(now: Date, windowHours = 24): {
  since: string;
  until: string;
} {
  return {
    since: new Date(now.getTime() - windowHours * 60 * 60 * 1000).toISOString(),
    until: now.toISOString(),
  };
}

export const DEPENDENCY_EVENT_TYPES = new Set<string>([
  DomainEventType.DEPENDENCY_ADDED,
  DomainEventType.DEPENDENCY_REMOVED,
  DomainEventType.TASK_BLOCKED,
  DomainEventType.TASK_UNBLOCKED,
]);

export const GOAL_HEALTH_EVENT_TYPES = new Set<string>([
  DomainEventType.GOAL_HEALTH_CHANGED,
]);
