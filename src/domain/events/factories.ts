import type {
  DomainEvent,
  DomainEventEnvelope,
  DomainEventPayload,
  DomainEventTypeName,
  GoalHealthChangedPayload,
  DependencyAddedPayload,
  DependencyRemovedPayload,
  TaskAssignedPayload,
  TaskBlockedPayload,
  TaskCompletedPayload,
  TaskUnblockedPayload,
  DueDateChangedPayload,
} from "./types";
import { DomainEventType } from "./types";
import type { GoalHealth, TaskStatus } from "../types";

export interface CreateDomainEventInput {
  eventId: string;
  orgId: string;
  type: DomainEventTypeName;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  entityType: DomainEventEnvelope["entityType"];
  entityId: string;
  taskId?: string | null;
  goalId?: string | null;
  dependencyId?: string | null;
  relatedPersonIds?: string[];
  payload: DomainEventPayload;
}

export function createDomainEvent(input: CreateDomainEventInput): DomainEvent {
  return {
    eventId: input.eventId,
    sequence: 0, // assigned by bus on publish
    orgId: input.orgId,
    type: input.type,
    timestamp: input.timestamp,
    actorPersonId: input.actorPersonId,
    sourceSystem: input.sourceSystem,
    entityType: input.entityType,
    entityId: input.entityId,
    taskId: input.taskId ?? null,
    goalId: input.goalId ?? null,
    dependencyId: input.dependencyId ?? null,
    relatedPersonIds: input.relatedPersonIds ?? [],
    payload: input.payload,
  };
}

export function createTaskCompletedEvent(params: {
  eventId: string;
  orgId: string;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  taskId: string;
  taskTitle: string;
  beforeStatus: TaskStatus;
  completedAt: string;
  relatedPersonIds?: string[];
}): DomainEvent {
  const payload: TaskCompletedPayload = {
    taskTitle: params.taskTitle,
    before: { status: params.beforeStatus },
    after: { status: "done", completedAt: params.completedAt },
  };
  return createDomainEvent({
    eventId: params.eventId,
    orgId: params.orgId,
    type: DomainEventType.TASK_COMPLETED,
    timestamp: params.timestamp,
    actorPersonId: params.actorPersonId,
    sourceSystem: params.sourceSystem,
    entityType: "task",
    entityId: params.taskId,
    taskId: params.taskId,
    relatedPersonIds: params.relatedPersonIds,
    payload,
  });
}

export function createDependencyAddedEvent(params: {
  eventId: string;
  orgId: string;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  dependencyId: string;
  blockerTaskId: string | null;
  blockerPersonId: string | null;
  blockedTaskId: string | null;
  blockedPersonId: string | null;
  description: string;
  relatedPersonIds?: string[];
}): DomainEvent {
  const payload: DependencyAddedPayload = {
    dependencyId: params.dependencyId,
    blockerTaskId: params.blockerTaskId,
    blockerPersonId: params.blockerPersonId,
    blockedTaskId: params.blockedTaskId,
    blockedPersonId: params.blockedPersonId,
    description: params.description,
  };
  const taskId = params.blockerTaskId ?? params.blockedTaskId ?? null;
  return createDomainEvent({
    eventId: params.eventId,
    orgId: params.orgId,
    type: DomainEventType.DEPENDENCY_ADDED,
    timestamp: params.timestamp,
    actorPersonId: params.actorPersonId,
    sourceSystem: params.sourceSystem,
    entityType: "dependency",
    entityId: params.dependencyId,
    taskId,
    dependencyId: params.dependencyId,
    relatedPersonIds: params.relatedPersonIds,
    payload,
  });
}

export function createTaskBlockedEvent(params: {
  eventId: string;
  orgId: string;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  taskId: string;
  taskTitle: string;
  dependencyId: string;
  blockedByTaskId: string | null;
  blockedByPersonId: string | null;
  description: string;
  relatedPersonIds?: string[];
}): DomainEvent {
  const payload: TaskBlockedPayload = {
    taskTitle: params.taskTitle,
    blockedByTaskId: params.blockedByTaskId,
    blockedByPersonId: params.blockedByPersonId,
    dependencyId: params.dependencyId,
    description: params.description,
  };
  return createDomainEvent({
    eventId: params.eventId,
    orgId: params.orgId,
    type: DomainEventType.TASK_BLOCKED,
    timestamp: params.timestamp,
    actorPersonId: params.actorPersonId,
    sourceSystem: params.sourceSystem,
    entityType: "task",
    entityId: params.taskId,
    taskId: params.taskId,
    dependencyId: params.dependencyId,
    relatedPersonIds: params.relatedPersonIds,
    payload,
  });
}

export function createTaskUnblockedEvent(params: {
  eventId: string;
  orgId: string;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  taskId: string;
  taskTitle: string;
  dependencyId: string;
  resolution: string;
  relatedPersonIds?: string[];
}): DomainEvent {
  const payload: TaskUnblockedPayload = {
    taskTitle: params.taskTitle,
    dependencyId: params.dependencyId,
    resolution: params.resolution,
  };
  return createDomainEvent({
    eventId: params.eventId,
    orgId: params.orgId,
    type: DomainEventType.TASK_UNBLOCKED,
    timestamp: params.timestamp,
    actorPersonId: params.actorPersonId,
    sourceSystem: params.sourceSystem,
    entityType: "task",
    entityId: params.taskId,
    taskId: params.taskId,
    dependencyId: params.dependencyId,
    relatedPersonIds: params.relatedPersonIds,
    payload,
  });
}

export function createTaskAssignedEvent(params: {
  eventId: string;
  orgId: string;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  taskId: string;
  taskTitle: string;
  beforeOwnerId: string | null;
  afterOwnerId: string;
  relatedPersonIds?: string[];
}): DomainEvent {
  const payload: TaskAssignedPayload = {
    taskTitle: params.taskTitle,
    assigneePersonId: params.afterOwnerId,
    before: { ownerId: params.beforeOwnerId },
    after: { ownerId: params.afterOwnerId },
  };
  return createDomainEvent({
    eventId: params.eventId,
    orgId: params.orgId,
    type: DomainEventType.TASK_ASSIGNED,
    timestamp: params.timestamp,
    actorPersonId: params.actorPersonId,
    sourceSystem: params.sourceSystem,
    entityType: "task",
    entityId: params.taskId,
    taskId: params.taskId,
    relatedPersonIds: params.relatedPersonIds,
    payload,
  });
}

export function createDueDateChangedEvent(params: {
  eventId: string;
  orgId: string;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  taskId: string;
  taskTitle: string;
  beforeDueDate: string | null;
  afterDueDate: string | null;
  relatedPersonIds?: string[];
}): DomainEvent {
  const payload: DueDateChangedPayload = {
    taskTitle: params.taskTitle,
    before: { dueDate: params.beforeDueDate },
    after: { dueDate: params.afterDueDate },
  };
  return createDomainEvent({
    eventId: params.eventId,
    orgId: params.orgId,
    type: DomainEventType.DUE_DATE_CHANGED,
    timestamp: params.timestamp,
    actorPersonId: params.actorPersonId,
    sourceSystem: params.sourceSystem,
    entityType: "task",
    entityId: params.taskId,
    taskId: params.taskId,
    relatedPersonIds: params.relatedPersonIds,
    payload,
  });
}

export function createDependencyRemovedEvent(params: {
  eventId: string;
  orgId: string;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  dependencyId: string;
  blockerTaskId: string | null;
  blockedTaskId: string | null;
  reason: string;
  relatedPersonIds?: string[];
}): DomainEvent {
  const payload: DependencyRemovedPayload = {
    dependencyId: params.dependencyId,
    blockerTaskId: params.blockerTaskId,
    blockedTaskId: params.blockedTaskId,
    reason: params.reason,
  };
  const taskId = params.blockedTaskId ?? params.blockerTaskId ?? null;
  return createDomainEvent({
    eventId: params.eventId,
    orgId: params.orgId,
    type: DomainEventType.DEPENDENCY_REMOVED,
    timestamp: params.timestamp,
    actorPersonId: params.actorPersonId,
    sourceSystem: params.sourceSystem,
    entityType: "dependency",
    entityId: params.dependencyId,
    taskId,
    dependencyId: params.dependencyId,
    relatedPersonIds: params.relatedPersonIds,
    payload,
  });
}

export function createGoalHealthChangedEvent(params: {
  eventId: string;
  orgId: string;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  goalId: string;
  goalTitle: string;
  beforeHealth: GoalHealth;
  afterHealth: GoalHealth;
  relatedPersonIds?: string[];
}): DomainEvent {
  const payload: GoalHealthChangedPayload = {
    goalTitle: params.goalTitle,
    before: { healthStatus: params.beforeHealth },
    after: { healthStatus: params.afterHealth },
  };
  return createDomainEvent({
    eventId: params.eventId,
    orgId: params.orgId,
    type: DomainEventType.GOAL_HEALTH_CHANGED,
    timestamp: params.timestamp,
    actorPersonId: params.actorPersonId,
    sourceSystem: params.sourceSystem,
    entityType: "goal",
    entityId: params.goalId,
    goalId: params.goalId,
    relatedPersonIds: params.relatedPersonIds,
    payload,
  });
}
