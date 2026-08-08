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
import {
  buildBlockerChainForDependency,
  type BlockerChain,
} from "@/domain/graph/blocker-chain";
import { getGraphStore } from "@/infrastructure/store";
import { NOW } from "@/infrastructure/seed/teams";
import { explainBlockerChain } from "@/application/blocker/blocker-narrative.service";

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
  chain: BlockerChain;
  narrative: string | null;
  rootBlockerSummary: string | null;
  daysOverdue: number | null;
  blockedPersonName: string | null;
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

export async function getAerialView(personId: string, now: Date = NOW): Promise<AerialViewDto> {
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

  const { blockingMe: blockingMeDeps, imBlocking: imBlockingDeps } =
    getUnresolvedDependenciesForPerson(graph, personId);

  const mapBlocker = async (
    dep: Dependency,
    direction: "blocking_me" | "im_blocking",
  ): Promise<BlockerItem> => {
    const chain = buildBlockerChainForDependency(graph, dep, direction, now);
    const taskId =
      direction === "blocking_me" ? dep.blockedTaskId : dep.blockedTaskId;
    const blockedTask = taskId ? graph.tasks.find((t) => t.id === taskId) : null;
    const blockerTaskId =
      direction === "blocking_me" ? dep.blockerTaskId : dep.blockedTaskId;
    const blockerTask = blockerTaskId
      ? graph.tasks.find((t) => t.id === blockerTaskId)
      : null;
    const displayTask =
      direction === "blocking_me" ? blockerTask : blockedTask ?? blockerTask;
    const otherPersonId =
      direction === "blocking_me"
        ? (blockerTask?.ownerId ?? dep.blockerPersonId)
        : (dep.blockedPersonId ??
          (dep.blockedTaskId
            ? graph.tasks.find((t) => t.id === dep.blockedTaskId)?.ownerId
            : null));
    const other = otherPersonId
      ? graph.people.find((p) => p.id === otherPersonId)
      : null;

    const blockedPerson = dep.blockedPersonId
      ? graph.people.find((p) => p.id === dep.blockedPersonId)
      : blockedTask?.ownerId
        ? graph.people.find((p) => p.id === blockedTask.ownerId)
        : null;

    let narrative: string | null = null;
    let rootBlockerSummary: string | null = null;
    try {
      const explained = await explainBlockerChain(dep.id, personId, now);
      narrative = explained.narrative;
      rootBlockerSummary = explained.rootBlockerSummary;
    } catch {
      narrative = null;
      rootBlockerSummary = null;
    }

    const daysOverdue =
      displayTask?.dueDate && new Date(displayTask.dueDate) < now
        ? Math.floor(
            (now.getTime() - new Date(displayTask.dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

    return {
      dependency: dep,
      otherPartyName: other?.name ?? "Unknown",
      taskTitle: displayTask?.title ?? dep.description,
      daysBlocked: daysSince(dep.flaggedAt, now),
      direction,
      chain,
      narrative,
      rootBlockerSummary,
      daysOverdue,
      blockedPersonName: blockedPerson?.name ?? null,
    };
  };

  const blockingMe = await Promise.all(
    blockingMeDeps.map((d) => mapBlocker(d, "blocking_me")),
  );
  const imBlocking = await Promise.all(
    imBlockingDeps.map((d) => mapBlocker(d, "im_blocking")),
  );

  return {
    personId,
    personName: person.name,
    lastUpdated: now.toISOString(),
    topWork,
    whatHappened,
    needsAttention: needsAttention.slice(0, 5),
    whoIsBlocked: {
      blockingMe,
      imBlocking,
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

export async function getTaskBlockerContext(
  taskId: string,
  personId: string,
  now: Date = NOW,
) {
  const store = getGraphStore();
  const graph = store.getGraph();
  const task = store.getTask(taskId);
  if (!task) return null;

  const detail = getTaskDetail(taskId, personId, now);
  if (!detail) return null;

  const blockingDeps = graph.dependencies.filter(
    (d) =>
      d.status === "unresolved" &&
      (d.blockedTaskId === taskId ||
        (d.blockedPersonId === personId && task.ownerId === personId)),
  );

  const chains = await Promise.all(
    blockingDeps.map(async (dep) => {
      const chain = buildBlockerChainForDependency(graph, dep, "blocking_me", now);
      let narrative: string | null = null;
      try {
        const explained = await explainBlockerChain(dep.id, personId, now);
        narrative = explained.narrative;
      } catch {
        narrative = null;
      }
      return { dependency: dep, chain, narrative };
    }),
  );

  return { ...detail, blockerChains: chains };
}

export async function getBlockerRadar(personId: string, now: Date = NOW) {
  const view = await getAerialView(personId, now);
  return {
    ...view.whoIsBlocked,
    personName: view.personName,
  };
}

export async function getTeamRollup(managerId: string, now: Date = NOW) {
  const store = getGraphStore();
  const graph = store.getGraph();
  const manager = store.getPerson(managerId);
  if (!manager || manager.role !== "manager") return null;

  const reports = store.getDirectReports(managerId);

  const reportData = await Promise.all(
    reports.map(async (report) => {
      const aerial = await getAerialView(report.id, now);
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
  );

  const teamBlockersNested = await Promise.all(
    reports.map(async (r) => {
      const { imBlocking, blockingMe } = (await getAerialView(r.id, now)).whoIsBlocked;
      return [...imBlocking, ...blockingMe];
    }),
  );

  return {
    manager,
    reports: reportData,
    teamBlockers: teamBlockersNested.flat(),
    graph,
  };
}
