import type { GoalHealth, PersonaRole } from "@/domain/types";
import type { DomainEventTypeName } from "@/domain/events/types";

export interface DigestDateRange {
  since: string;
  until: string;
}

export interface DigestPersona {
  personId: string;
  personName: string;
  role: PersonaRole;
  teamId: string;
}

export interface DigestContextEvent {
  eventId: string;
  sequence: number;
  type: DomainEventTypeName;
  timestamp: string;
  actorPersonId: string;
  sourceSystem: string;
  entityType: "task" | "goal" | "dependency";
  entityId: string;
  taskId: string | null;
  goalId: string | null;
  dependencyId: string | null;
  summary: string;
  payload: Readonly<Record<string, unknown>>;
  beforeValue: string | null;
  afterValue: string | null;
}

export interface DigestContextGoal {
  goalId: string;
  title: string;
  healthStatus: GoalHealth;
  ownerId: string;
}

export interface DigestContextTask {
  taskId: string;
  title: string;
  ownerId: string;
  status: string;
  linkedGoalId: string | null;
}

export interface DigestContextDependencyChange {
  dependencyId: string;
  changeType: "added" | "removed" | "blocked" | "unblocked";
  description: string;
  blockerTaskId: string | null;
  blockedTaskId: string | null;
  sourceEventIds: string[];
}

export interface DigestContextGoalHealthChange {
  goalId: string;
  goalTitle: string;
  beforeHealth: GoalHealth;
  afterHealth: GoalHealth;
  sourceEventIds: string[];
}

/**
 * Strongly typed grounding contract for digest providers.
 * Providers receive DigestContext only — never live graph/bus handles.
 */
export interface DigestContext {
  persona: DigestPersona;
  dateRange: DigestDateRange;
  events: ReadonlyArray<DigestContextEvent>;
  relevantGoals: ReadonlyArray<DigestContextGoal>;
  relevantTasks: ReadonlyArray<DigestContextTask>;
  dependencyChanges: ReadonlyArray<DigestContextDependencyChange>;
  goalHealthChanges: ReadonlyArray<DigestContextGoalHealthChange>;
}

export interface DigestSelectionCriteria {
  personId: string;
  dateRange: DigestDateRange;
  taskIds?: string[];
  goalIds?: string[];
  dependencyIds?: string[];
}
