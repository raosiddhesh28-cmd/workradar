export type GoalLevel = "company" | "team" | "individual";
export type GoalHealth = "on_track" | "at_risk" | "breached";
export type TaskStatus = "open" | "in_progress" | "done" | "deferred";
export type PersonaRole = "ic" | "manager" | "executive" | "ops" | "hr" | "admin";
export type StakeholderTier =
  | "ic"
  | "manager"
  | "director"
  | "vp"
  | "c_level"
  | "customer";
export type DependencyStatus = "unresolved" | "resolved";
export type EntityType = "task" | "goal" | "dependency" | "person";
export type EventType =
  | "task_completed"
  | "task_deferred"
  | "blocker_created"
  | "blocker_resolved"
  | "goal_health_changed"
  | "task_assigned"
  | "dependency_unblocked"
  | "due_date_changed";

export interface Person {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: PersonaRole;
  tier: StakeholderTier;
  teamId: string;
  managerId: string | null;
  title: string;
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
}

export interface Goal {
  id: string;
  orgId: string;
  title: string;
  level: GoalLevel;
  parentGoalId: string | null;
  healthStatus: GoalHealth;
  ownerId: string;
  strategicWeight: number;
  initiativeId: string | null;
}

export interface Initiative {
  id: string;
  orgId: string;
  title: string;
  goalId: string;
}

export interface Task {
  id: string;
  orgId: string;
  title: string;
  description: string;
  ownerId: string;
  linkedGoalId: string | null;
  initiativeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  status: TaskStatus;
  sourceSystem: string;
  surfacedCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface Dependency {
  id: string;
  orgId: string;
  blockerTaskId: string | null;
  blockerPersonId: string | null;
  blockedTaskId: string | null;
  blockedPersonId: string | null;
  status: DependencyStatus;
  flaggedAt: string;
  resolvedAt: string | null;
  description: string;
}

export interface OrgEvent {
  id: string;
  orgId: string;
  entityType: EntityType;
  entityId: string;
  eventType: EventType;
  timestamp: string;
  summary: string;
  payload: Record<string, unknown>;
  relevantPersonIds: string[];
}

export interface ImpactScoreBreakdown {
  goalAlignment: number;
  blockingRadius: number;
  urgency: number;
  stakeholderTier: number;
  recencyOfRisk: number;
  staleness: number;
}

export interface ImpactScoreSnapshot {
  taskId: string;
  score: number;
  componentBreakdown: ImpactScoreBreakdown;
  oneLineWhy: string;
  computedAt: string;
}

export interface ScoredTask extends Task {
  impactScore: ImpactScoreSnapshot;
}

export interface OrgGraph {
  orgId: string;
  people: Person[];
  teams: Team[];
  goals: Goal[];
  initiatives: Initiative[];
  tasks: Task[];
  dependencies: Dependency[];
  events: OrgEvent[];
}
