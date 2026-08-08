import type { OrgGraph } from "@/domain/types";
import { getUnresolvedDependenciesForPerson } from "@/domain/graph/impact-graph";
import {
  buildBlockerChainForDependency,
  type BlockerChain,
} from "@/domain/graph/blocker-chain";
import { projectDomainEventToOrgEvent } from "@/domain/events/projector";
import { queryDomainEvents } from "@/application/events/event-publisher.service";
import { getGraphStore } from "@/infrastructure/store";
import type { DigestNarrativeInput } from "../contracts/digest-narrative.contract";
import type {
  BlockerRootCauseInput,
  BlockerChainSnapshot,
  DependencyPathNode,
} from "../contracts/blocker-root-cause.contract";
import type { AdvisoryScoringInput } from "../contracts/advisory-scoring.contract";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "@/domain/scoring/config";
import { scoreOpenTasks } from "@/domain/scoring/impact-score";

function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function snapshotGraph(graph: OrgGraph): OrgGraph {
  return structuredClone(graph);
}

function toChainSnapshot(chain: BlockerChain): BlockerChainSnapshot {
  return {
    dependencyId: chain.dependencyId,
    blockedTaskId: chain.blockedTaskId,
    blockedTaskTitle: chain.blockedTaskTitle,
    blockedPersonId: chain.blockedPersonId,
    direction: chain.direction,
    daysBlocked: chain.daysBlocked,
    nodes: chain.nodes.map((n) => ({ ...n })),
    immediateBlockerTaskId: chain.immediateBlockerTaskId,
    rootBlockerTaskId: chain.rootBlockerTaskId,
    rootBlockerTitle: chain.rootBlockerTitle,
    hasDeeperUpstream: chain.hasDeeperUpstream,
    chainComplete: chain.chainComplete,
    cycleDetected: chain.cycleDetected,
  };
}

function buildPathFromChain(
  graph: OrgGraph,
  chain: BlockerChain,
  dependencyDescription: string,
): DependencyPathNode[] {
  const path: DependencyPathNode[] = [];

  for (const node of chain.nodes) {
    path.push({ type: "task", id: node.taskId, label: node.taskTitle });
    if (node.ownerId && node.ownerName) {
      path.push({ type: "person", id: node.ownerId, label: node.ownerName });
    }
  }

  if (path.length === 0) {
    path.push({
      type: "dependency",
      id: chain.dependencyId,
      label: dependencyDescription,
    });
  }

  return path;
}

/**
 * Builds read-only, structured context for AI services from the Event Bus and graph.
 * Context is cloned — AI consumers receive snapshots, not live mutable references.
 */
export function buildDigestNarrativeContext(
  personId: string,
  now: Date,
  windowHours = 24,
): DigestNarrativeInput {
  const store = getGraphStore();
  const person = store.getPerson(personId);
  if (!person) throw new Error(`Person not found: ${personId}`);

  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000).toISOString();
  const until = now.toISOString();

  const busEvents = queryDomainEvents({ since, until });
  const graph = store.getGraph();

  const events = busEvents
    .filter((e) => e.relatedPersonIds.includes(personId))
    .map((e) => {
      const orgEvent = projectDomainEventToOrgEvent(e);
      return {
        eventId: e.eventId,
        sequence: e.sequence,
        type: e.type,
        timestamp: e.timestamp,
        summary: orgEvent.summary,
        entityType: e.entityType,
        entityId: e.entityId,
      };
    });

  return {
    personId,
    personName: person.name,
    timeWindow: { since, until },
    events,
  };
}

export function buildBlockerRootCauseContext(
  dependencyId: string,
  personId: string,
  now: Date,
): BlockerRootCauseInput {
  const store = getGraphStore();
  const graph = store.getGraph();
  const dependency = graph.dependencies.find((d) => d.id === dependencyId);
  if (!dependency) throw new Error(`Dependency not found: ${dependencyId}`);

  const { blockingMe, imBlocking } = getUnresolvedDependenciesForPerson(graph, personId);
  const direction = blockingMe.some((d) => d.id === dependencyId)
    ? "blocking_me"
    : imBlocking.some((d) => d.id === dependencyId)
      ? "im_blocking"
      : "blocking_me";

  const chain = buildBlockerChainForDependency(graph, dependency, direction, now);
  const blockingChain = toChainSnapshot(chain);

  const taskId =
    direction === "blocking_me" ? dependency.blockerTaskId : dependency.blockedTaskId;
  const task = taskId ? graph.tasks.find((t) => t.id === taskId) : null;
  const otherPersonId =
    direction === "blocking_me"
      ? (task?.ownerId ?? dependency.blockerPersonId)
      : (dependency.blockedPersonId ??
        (dependency.blockedTaskId
          ? graph.tasks.find((t) => t.id === dependency.blockedTaskId)?.ownerId
          : null));
  const other = otherPersonId ? graph.people.find((p) => p.id === otherPersonId) : null;

  const path = buildPathFromChain(graph, chain, dependency.description);

  const relatedEvents = queryDomainEvents({ dependencyId, types: undefined }).map((e) => {
    const orgEvent = projectDomainEventToOrgEvent(e);
    return {
      eventId: e.eventId,
      type: e.type,
      summary: orgEvent.summary,
      timestamp: e.timestamp,
    };
  });

  return {
    dependencyId,
    description: dependency.description,
    direction,
    path,
    relatedEvents,
    daysBlocked: daysSince(dependency.flaggedAt, now),
    taskTitle:
      direction === "blocking_me"
        ? (chain.blockedTaskTitle ?? task?.title ?? null)
        : (task?.title ?? chain.blockedTaskTitle ?? null),
    otherPartyName: other?.name ?? "Unknown",
    blockingChain,
  };
}

export function buildAdvisoryScoringContext(
  orgId: string,
  personId: string | undefined,
  now: Date,
  sampleLimit = 5,
): AdvisoryScoringInput {
  const store = getGraphStore();
  const graph = snapshotGraph(store.getGraph());
  const scored = scoreOpenTasks(graph, personId, now).slice(0, sampleLimit);

  return {
    orgId,
    currentWeights: { ...DEFAULT_IMPACT_SCORE_CONFIG.weights },
    taskScoreSamples: scored.map((task) => ({
      taskId: task.id,
      taskTitle: task.title,
      authoritativeScore: task.impactScore.score,
      componentBreakdown: { ...task.impactScore.componentBreakdown },
    })),
  };
}

/** Returns a frozen graph snapshot for guardrail tests. */
export function snapshotCurrentGraph(): OrgGraph {
  return snapshotGraph(getGraphStore().getGraph());
}
