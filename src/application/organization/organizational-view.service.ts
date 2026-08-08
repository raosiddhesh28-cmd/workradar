import type { Goal, GoalHealth, OrgGraph, ScoredTask } from "@/domain/types";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "@/domain/scoring/config";
import { scoreOpenTasks } from "@/domain/scoring/impact-score";
import {
  getBlockedPartiesForTask,
  findNearestStrategicGoal,
} from "@/domain/graph/impact-graph";
import {
  resolveOrganizationalScope,
  getTeamForPerson,
  getTeamForTask,
  type OrganizationalScope,
} from "@/domain/organization/scope";
import {
  getCrossTeamDependencies,
  buildOrganizationalWhyNarrative,
  type CrossTeamDependencyView,
} from "@/domain/organization/cross-team-dependencies";
import { getGraphStore } from "@/infrastructure/store";
import { NOW } from "@/infrastructure/seed/teams";

export interface OrganizationalAttentionItem {
  id: string;
  taskId: string;
  title: string;
  severity: "high" | "medium";
  reason: string;
  context: string;
  goalTitle: string | null;
  urgencyLabel: string;
}

export interface TopOrganizationalImpactItem {
  rank: number;
  task: ScoredTask;
  assigneeName: string;
  teamName: string;
  impactScore: number;
  whyItMatters: string;
  organizationalWhy: string;
  goalTitle: string | null;
  goalHealth: GoalHealth | null;
  downstreamTaskCount: number;
  downstreamTeamCount: number;
}

export interface GoalHealthItem {
  goalId: string;
  title: string;
  healthStatus: GoalHealth;
  healthLabel: string;
  drivers: Array<{ taskId: string; title: string }>;
}

export interface OrganizationalViewDto {
  viewerId: string;
  viewerName: string;
  scopeMode: "manager" | "executive";
  scopeLabel: string;
  lastUpdated: string;
  attention: OrganizationalAttentionItem[];
  topImpact: TopOrganizationalImpactItem[];
  crossTeamDependencies: CrossTeamDependencyView[];
  goalHealth: GoalHealthItem[];
  briefing: string | null;
}

function urgencyLabel(score: number): string {
  if (score >= 0.85) return "High";
  if (score >= 0.7) return "Medium";
  return "Normal";
}

function healthLabel(status: GoalHealth): string {
  switch (status) {
    case "at_risk":
      return "At risk";
    case "breached":
      return "Breached";
    default:
      return "On track";
  }
}

function scopedScoredTasks(
  graph: OrgGraph,
  scope: OrganizationalScope,
  now: Date,
): ScoredTask[] {
  const allScored = scoreOpenTasks(graph, undefined, now);
  return allScored.filter((t) => scope.taskIds.has(t.id));
}

export function getOrganizationalAttention(
  graph: OrgGraph,
  scope: OrganizationalScope,
  now: Date,
): OrganizationalAttentionItem[] {
  const config = DEFAULT_IMPACT_SCORE_CONFIG;
  const scored = scopedScoredTasks(graph, scope, now);
  const items: OrganizationalAttentionItem[] = [];

  for (const task of scored) {
    const b = task.impactScore.componentBreakdown;
    const goal = task.linkedGoalId
      ? graph.goals.find((g) => g.id === task.linkedGoalId)
      : null;
    const strategic = findNearestStrategicGoal(graph, task);
    const highBlocking = b.blockingRadius >= 0.4;
    const urgent =
      b.urgency >= config.attentionThresholds.urgency ||
      b.recencyOfRisk >= config.attentionThresholds.recencyOfRisk ||
      goal?.healthStatus === "at_risk" ||
      goal?.healthStatus === "breached";

    if (!urgent && !highBlocking) continue;

    const downstream = getBlockedPartiesForTask(
      graph,
      task.id,
      config.maxTraverseDepth,
    );
    const blockedTitles = downstream.taskIds
      .slice(0, 3)
      .map((id) => graph.tasks.find((t) => t.id === id)?.title)
      .filter((t): t is string => Boolean(t));

    let context = task.impactScore.oneLineWhy;
    if (blockedTitles.length > 0) {
      context = `Blocking ${blockedTitles.join(" and ")}`;
    }

    items.push({
      id: `org-attn-${task.id}`,
      taskId: task.id,
      title: task.title,
      severity:
        b.urgency >= 0.85 ||
        goal?.healthStatus === "breached" ||
        highBlocking
          ? "high"
          : "medium",
      reason: task.impactScore.oneLineWhy,
      context,
      goalTitle: strategic?.goal.title ?? goal?.title ?? null,
      urgencyLabel: urgencyLabel(b.urgency),
    });
  }

  return items
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1 };
      const diff = severityOrder[a.severity] - severityOrder[b.severity];
      if (diff !== 0) return diff;
      const taskA = scored.find((t) => t.id === a.taskId);
      const taskB = scored.find((t) => t.id === b.taskId);
      return (taskB?.impactScore.score ?? 0) - (taskA?.impactScore.score ?? 0);
    })
    .slice(0, 8);
}

export function getTopOrganizationalImpact(
  graph: OrgGraph,
  scope: OrganizationalScope,
  now: Date,
  limit = 5,
): TopOrganizationalImpactItem[] {
  const config = DEFAULT_IMPACT_SCORE_CONFIG;
  const scored = scopedScoredTasks(graph, scope, now)
    .sort((a, b) => b.impactScore.score - a.impactScore.score)
    .slice(0, limit);

  return scored.map((task, index) => {
    const owner = graph.people.find((p) => p.id === task.ownerId);
    const team = owner ? getTeamForPerson(graph, owner.id) : null;
    const downstream = getBlockedPartiesForTask(
      graph,
      task.id,
      config.maxTraverseDepth,
    );
    const teamIds = new Set<string>();
    for (const id of [task.id, ...downstream.taskIds]) {
      const t = getTeamForTask(graph, id);
      if (t) teamIds.add(t.teamId);
    }
    const strategic = findNearestStrategicGoal(graph, task);
    const goal = task.linkedGoalId
      ? graph.goals.find((g) => g.id === task.linkedGoalId)
      : null;

    return {
      rank: index + 1,
      task,
      assigneeName: owner?.name ?? "Unassigned",
      teamName: team?.teamName ?? "Unknown team",
      impactScore: task.impactScore.score,
      whyItMatters: task.impactScore.oneLineWhy,
      organizationalWhy: buildOrganizationalWhyNarrative(graph, task),
      goalTitle: strategic?.goal.title ?? goal?.title ?? null,
      goalHealth: strategic?.goal.healthStatus ?? goal?.healthStatus ?? null,
      downstreamTaskCount: downstream.taskIds.length,
      downstreamTeamCount: teamIds.size,
    };
  });
}

export function getGoalHealthProjection(
  graph: OrgGraph,
  scope: OrganizationalScope,
): GoalHealthItem[] {
  const relevantGoalIds = new Set<string>();
  for (const taskId of scope.taskIds) {
    const task = graph.tasks.find((t) => t.id === taskId);
    if (task?.linkedGoalId) relevantGoalIds.add(task.linkedGoalId);
    const strategic = task ? findNearestStrategicGoal(graph, task) : null;
    if (strategic) relevantGoalIds.add(strategic.goal.id);
  }

  const goals = graph.goals.filter(
    (g) =>
      relevantGoalIds.has(g.id) ||
      (scope.mode === "executive" && g.level === "company"),
  );

  const uniqueGoals = new Map<string, Goal>();
  for (const g of goals) {
    uniqueGoals.set(g.id, g);
  }

  return [...uniqueGoals.values()]
    .map((goal) => {
      const drivers = graph.tasks
        .filter(
          (t) =>
            scope.taskIds.has(t.id) &&
            (t.linkedGoalId === goal.id ||
              findNearestStrategicGoal(graph, t)?.goal.id === goal.id) &&
            (t.status === "open" || t.status === "in_progress"),
        )
        .slice(0, 5)
        .map((t) => ({ taskId: t.id, title: t.title }));

      return {
        goalId: goal.id,
        title: goal.title,
        healthStatus: goal.healthStatus,
        healthLabel: healthLabel(goal.healthStatus),
        drivers,
      };
    })
    .sort((a, b) => {
      const order = { breached: 0, at_risk: 1, on_track: 2 };
      return order[a.healthStatus] - order[b.healthStatus];
    });
}

function buildDeterministicBriefing(dto: Pick<
  OrganizationalViewDto,
  "attention" | "topImpact" | "crossTeamDependencies" | "goalHealth"
>): string {
  const parts: string[] = [];
  if (dto.attention.length > 0) {
    parts.push(
      `${dto.attention.length} item${dto.attention.length === 1 ? "" : "s"} require organizational attention.`,
    );
  }
  if (dto.topImpact[0]) {
    parts.push(
      `Highest systemic impact: ${dto.topImpact[0].task.title}.`,
    );
  }
  if (dto.crossTeamDependencies.length > 0) {
    parts.push(
      `${dto.crossTeamDependencies.length} cross-team dependency chain${dto.crossTeamDependencies.length === 1 ? "" : "s"} active.`,
    );
  }
  const atRisk = dto.goalHealth.filter((g) => g.healthStatus !== "on_track");
  if (atRisk.length > 0) {
    parts.push(
      `Goals at risk: ${atRisk.map((g) => g.title).join(", ")}.`,
    );
  }
  return parts.join(" ") || "No significant organizational risks detected.";
}

export function getOrganizationalView(
  viewerId: string,
  now: Date = NOW,
): OrganizationalViewDto | null {
  const store = getGraphStore();
  const graph = store.getGraph();
  const viewer = store.getPerson(viewerId);
  if (!viewer) return null;

  const scope = resolveOrganizationalScope(
    graph,
    viewerId,
    (id) => store.getDirectReports(id),
  );
  if (!scope) return null;

  const attention = getOrganizationalAttention(graph, scope, now);
  const topImpact = getTopOrganizationalImpact(graph, scope, now);
  const crossTeamDependencies = getCrossTeamDependencies(graph, scope);
  const goalHealth = getGoalHealthProjection(graph, scope);

  const scopeLabel =
    scope.mode === "executive"
      ? "Organization-wide"
      : `${viewer.name.split(" ")[0]}'s team & cross-team reach`;

  const briefing = buildDeterministicBriefing({
    attention,
    topImpact,
    crossTeamDependencies,
    goalHealth,
  });

  return {
    viewerId,
    viewerName: viewer.name,
    scopeMode: scope.mode,
    scopeLabel,
    lastUpdated: now.toISOString(),
    attention,
    topImpact,
    crossTeamDependencies,
    goalHealth,
    briefing,
  };
}

export function canAccessOrganizationalView(viewerId: string): boolean {
  const store = getGraphStore();
  const person = store.getPerson(viewerId);
  return person?.role === "manager" || person?.role === "executive";
}
