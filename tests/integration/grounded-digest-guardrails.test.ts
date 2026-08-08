import { describe, it, expect, beforeEach } from "vitest";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import { resetAiServices, getDigestProvider, MockDigestProvider } from "@/infrastructure/ai";
import {
  getGroundedWhatHappenedDigest,
  buildDigestContextForPerson,
} from "@/application/digest";
import { snapshotCurrentGraph } from "@/application/ai/context/build-ai-context";
import { computeImpactScore, scoreOpenTasks } from "@/domain/scoring/impact-score";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "@/domain/scoring/config";
import { NOW } from "@/infrastructure/seed/teams";

describe("Grounded digest architecture boundaries", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("does not mutate graph state when generating digest", async () => {
    const before = snapshotCurrentGraph();

    await getGroundedWhatHappenedDigest("person-priya", NOW);

    const after = getGraphStore().getGraph();
    expect(after.tasks).toEqual(before.tasks);
    expect(after.goals).toEqual(before.goals);
    expect(after.dependencies).toEqual(before.dependencies);
    expect(after.events.length).toBe(before.events.length);
  });

  it("does not modify authoritative Impact Score", async () => {
    const graph = getGraphStore().getGraph();
    const task = graph.tasks.find((t) => t.status === "open")!;
    const scoreBefore = computeImpactScore(graph, task, NOW);
    const rankedBefore = scoreOpenTasks(graph, "person-priya", NOW).map((t) => ({
      id: t.id,
      score: t.impactScore.score,
    }));

    await getGroundedWhatHappenedDigest("person-priya", NOW);

    const graphAfter = getGraphStore().getGraph();
    const scoreAfter = computeImpactScore(graphAfter, task, NOW);
    const rankedAfter = scoreOpenTasks(graphAfter, "person-priya", NOW).map((t) => ({
      id: t.id,
      score: t.impactScore.score,
    }));

    expect(scoreAfter).toEqual(scoreBefore);
    expect(rankedAfter).toEqual(rankedBefore);
    expect(DEFAULT_IMPACT_SCORE_CONFIG.weights).toEqual({
      goalAlignment: 0.3,
      blockingRadius: 0.25,
      urgency: 0.2,
      stakeholderTier: 0.1,
      recencyOfRisk: 0.1,
      staleness: 0.05,
    });
  });

  it("provider receives DigestContext without store references", async () => {
    const context = buildDigestContextForPerson("person-priya", NOW);
    const provider = getDigestProvider() as MockDigestProvider;

    const result = await provider.generate(context);
    expect(
      result.data.citedEventIds.every((id) =>
        context.events.some((e) => e.eventId === id),
      ),
    ).toBe(true);
  });
});
