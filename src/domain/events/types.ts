import type { GoalHealth, TaskStatus } from "../types";

/** Canonical domain event types for the Event/Signal Bus (Phase 1). */
export const DomainEventType = {
  TASK_COMPLETED: "TASK_COMPLETED",
  TASK_BLOCKED: "TASK_BLOCKED",
  TASK_UNBLOCKED: "TASK_UNBLOCKED",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  DUE_DATE_CHANGED: "DUE_DATE_CHANGED",
  DEPENDENCY_ADDED: "DEPENDENCY_ADDED",
  DEPENDENCY_REMOVED: "DEPENDENCY_REMOVED",
  GOAL_HEALTH_CHANGED: "GOAL_HEALTH_CHANGED",
} as const;

export type DomainEventTypeName =
  (typeof DomainEventType)[keyof typeof DomainEventType];

export type DomainEntityType = "task" | "goal" | "dependency";

/** Shared envelope for every bus event. */
export interface DomainEventEnvelope {
  eventId: string;
  sequence: number;
  orgId: string;
  type: DomainEventTypeName;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  entityType: DomainEntityType;
  entityId: string;
  taskId: string | null;
  goalId: string | null;
  dependencyId: string | null;
  relatedPersonIds: string[];
}

export interface TaskCompletedPayload {
  taskTitle: string;
  before: { status: TaskStatus };
  after: { status: TaskStatus; completedAt: string };
}

export interface TaskBlockedPayload {
  taskTitle: string;
  blockedByTaskId: string | null;
  blockedByPersonId: string | null;
  dependencyId: string;
  description: string;
}

export interface TaskUnblockedPayload {
  taskTitle: string;
  dependencyId: string;
  resolution: string;
}

export interface TaskAssignedPayload {
  taskTitle: string;
  assigneePersonId: string;
  before: { ownerId: string | null };
  after: { ownerId: string };
}

export interface DueDateChangedPayload {
  taskTitle: string;
  before: { dueDate: string | null };
  after: { dueDate: string | null };
}

export interface DependencyAddedPayload {
  dependencyId: string;
  blockerTaskId: string | null;
  blockerPersonId: string | null;
  blockedTaskId: string | null;
  blockedPersonId: string | null;
  description: string;
}

export interface DependencyRemovedPayload {
  dependencyId: string;
  blockerTaskId: string | null;
  blockedTaskId: string | null;
  reason: string;
}

export interface GoalHealthChangedPayload {
  goalTitle: string;
  before: { healthStatus: GoalHealth };
  after: { healthStatus: GoalHealth };
}

export type DomainEventPayload =
  | TaskCompletedPayload
  | TaskBlockedPayload
  | TaskUnblockedPayload
  | TaskAssignedPayload
  | DueDateChangedPayload
  | DependencyAddedPayload
  | DependencyRemovedPayload
  | GoalHealthChangedPayload;

export interface DomainEvent extends DomainEventEnvelope {
  payload: DomainEventPayload;
}

export type ReadonlyDomainEvent = Readonly<DomainEvent> &
  Readonly<{ payload: Readonly<DomainEventPayload> }>;

export interface DomainEventFilter {
  types?: DomainEventTypeName[];
  since?: string;
  until?: string;
  entityId?: string;
  taskId?: string;
  goalId?: string;
  dependencyId?: string;
  actorPersonId?: string;
}
