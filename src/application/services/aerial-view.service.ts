import type {
  Dependency,
  ImpactScoreSnapshot,
  OrgEvent,
  ScoredTask,
  Task,
} from "@/domain/types";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "@/domain/scoring/config";
import { scoreOpenTasks, computeImpactScore } from "@/domain/scoring/impact-score";
import { getUnresolvedDependenciesForPerson } from "@/domain/graph/impact-graph";
import { getGraphStore } from "@/infrastructure/store";
import { NOW } from "@/infrastructure/seed/teams";

export interface TopWorkItem {
  task: ScoredTask;
  impactScore: ImpactScoreSnapshot;
}

export interface DigestItem {
  id: string;
  summary: string;
  timestamp: string;
  sourceEventIds: string[];
}

export interface AttentionItem {
  id: string;
  type: "task" | "goal";
  title: string;
  reason: string;
  severity: "high" | "medium";
  entityId: string;
}

export interface BlockerItem {
  dependency: Dependency;
  otherPartyName: string;
  taskTitle: string | null;
  daysBlocked: number;
  direction: "blocking_me" | "im_blocking";
}

export interface AerialViewDto {
  personId: string;
  personName: string;
  lastUpdated: string;
  topWork: TopWorkItem[];
  whatHappened: DigestItem[];
  needsAttention: AttentionItem[];
  whoIsBlocked: {
    blockingMe: BlockerItem[];
    imBlocking: BlockerItem[];
  };
}

function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function getAerialView(personId: string, now: Date = NOW): AerialViewDto {
  const store = getGraphStore();
  const graph = store.getGraph();
  const person = store.getPerson(personId);
  if (!person) throw new Error(`Person not found: ${personId}`);

  const scored = scoreOpenTasks(graph, personId, now);
  const topWork = scored.slice(0, 5).map((task) => ({
    task,
    impactScore: task.impactScore,
  }));

  const sessionStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const relevantEvents = graph.events
    .filter(
      (e) =>
        e.relevantPersonIds.includes(personId) &&
        new Date(e.timestamp) >= sessionStart,
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const whatHappened: DigestItem[] = relevantEvents.slice(0, 6).map((e) => ({
    id: e.id,
    summary: e.summary,
    timestamp: e.timestamp,
    sourceEventIds: [e.id],
  }));

  const config = DEFAULT_IMPACT_SCORE_CONFIG;
  const needsAttention: AttentionItem[] = [];

  for (const task of scored) {
    const b = task.impactScore.componentBreakdown;
    const goal = task.linkedGoalId
      ? graph.goals.find((g) => g.id === task.linkedGoalId)
      : null;
    const urgent =
      b.urgency >= config.attentionThresholds.urgency ||
      b.recencyOfRisk >= config.attentionThresholds.recencyOfRisk ||
      goal?.healthStatus === "at_risk" ||
      goal?.healthStatus === "breached";

    if (urgent) {
      needsAttention.push({
        id: `attn-task-${task.id}`,
        type: "task",
        title: task.title,
        reason: task.impactScore.oneLineWhy,
        severity: b.urgency >= 0.85 || goal?.healthStatus === "breached" ? "high" : "medium",
        entityId: task.id,
      });
    }
  }

  for (const goal of graph.goals) {
    if (goal.healthStatus === "at_risk" || goal.healthStatus === "breached") {
      const recent = graph.events.some(
        (e) =>
          e.entityId === goal.id &&
          e.eventType === "goal_health_changed" &&
          new Date(e.timestamp) >= sessionStart,
      );
      if (recent) {
        needsAttention.push({
          id: `attn-goal-${goal.id}`,
          type: "goal",
          title: goal.title,
          reason: `Goal health: ${goal.healthStatus.replace("_", " ")}`,
          severity: goal.healthStatus === "breached" ? "high" : "medium",
          entityId: goal.id,
        });
      }
    }
  }

  const { blockingMe, imBlocking } = getUnresolvedDependenciesForPerson(graph, personId);

  const mapBlocker = (
    dep: Dependency,
    direction: "blocking_me" | "im_blocking",
  ): BlockerItem => {
    const taskId =
      direction === "blocking_me" ? dep.blockerTaskId : dep.blockedTaskId;
    const task = taskId ? graph.tasks.find((t) => t.id === taskId) : null;
    const otherPersonId =
      direction === "blocking_me"
        ? task?.ownerId ?? dep.blockerPersonId
        : dep.blockedPersonId ??
          (dep.blockedTaskId
            ? graph.tasks.find((t) => t.id === dep.blockedTaskId)?.ownerId
            : null);
    const other = otherPersonId
      ? graph.people.find((p) => p.id === otherPersonId)
      : null;

    return {
      dependency: dep,
      otherPartyName: other?.name ?? "Unknown",
      taskTitle: task?.title ?? dep.description,
      daysBlocked: daysSince(dep.flaggedAt, now),
      direction,
    };
  };

  return {
    personId,
    personName: person.name,
    lastUpdated: now.toISOString(),
    topWork,
    whatHappened,
    needsAttention: needsAttention.slice(0, 5),
    whoIsBlocked: {
      blockingMe: blockingMe.map((d) => mapBlocker(d, "blocking_me")),
      imBlocking: imBlocking.map((d) => mapBlocker(d, "im_blocking")),
    },
  };
}

export function getTaskDetail(taskId: string, personId: string, now: Date = NOW) {
  const store = getGraphStore();
  const graph = store.getGraph();
  const task = store.getTask(taskId);
  if (!task) return null;

  const person = store.getPerson(personId);
  const canView =
    task.ownerId === personId ||
    person?.role === "manager" ||
    graph.dependencies.some(
      (d) =>
        d.blockerTaskId === taskId ||
        d.blockedTaskId === taskId ||
        d.blockedPersonId === personId,
    );

  if (!canView) return null;

  const impactScore = computeImpactScore(graph, task, now);
  const goal = task.linkedGoalId ? store.getGoal(task.linkedGoalId) : null;

  return { task, impactScore, goal, graph };
}

export function getBlockerRadar(personId: string, now: Date = NOW) {
  const view = getAerialView(personId, now);
  return {
    ...view.whoIsBlocked,
    personName: view.personName,
  };
}

export function getTeamRollup(managerId: string, now: Date = NOW) {
  const store = getGraphStore();
  const graph = store.getGraph();
  const manager = store.getPerson(managerId);
  if (!manager || manager.role !== "manager") return null;

  const reports = store.getDirectReports(managerId);

  return {
    manager,
    reports: reports.map((report) => {
      const aerial = getAerialView(report.id, now);
      const openCount = aerial.topWork.length;
      const blockerCount =
        aerial.whoIsBlocked.blockingMe.length +
        aerial.whoIsBlocked.imBlocking.length;
      return {
        person: report,
        topWorkCount: openCount,
        topTask: aerial.topWork[0]?.task.title ?? null,
        blockerCount,
        hasBlocker: blockerCount > 0,
      };
    }),
    teamBlockers: reports.flatMap((r) => {
      const { imBlocking, blockingMe } = getAerialView(r.id, now).whoIsBlocked;
      return [...imBlocking, ...blockingMe];
    }),
    graph,
  };
}
