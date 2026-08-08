import { describe, it, expect, beforeEach } from "vitest";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import { resetAiServices, getDigestNarrativeService, MockDigestNarrativeService } from "@/infrastructure/ai";
import {
  generateDigestNarrative,
  parseNaturalLanguageInput,
  analyzeScoringWeights,
  snapshotCurrentGraph,
} from "@/application/ai";
import { scoreOpenTasks, computeImpactScore } from "@/domain/scoring/impact-score";
import { DEFAULT_IMPACT_SCORE_CONFIG } from "@/domain/scoring/config";
import { NOW } from "@/infrastructure/seed/teams";
import { AI_GUARDRAILS } from "@/application/ai/contracts/guardrails";

describe("AI guardrails — graph and scoring immutability", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("documents all required AI guardrails", () => {
    expect(AI_GUARDRAILS.mustNotCalculateAuthoritativeImpactScore).toBe(true);
    expect(AI_GUARDRAILS.mustNotModifyTaskPriority).toBe(true);
    expect(AI_GUARDRAILS.mustNotModifyGoals).toBe(true);
    expect(AI_GUARDRAILS.mustNotModifyDependencies).toBe(true);
    expect(AI_GUARDRAILS.mustNotInferEmployeePerformance).toBe(true);
    expect(AI_GUARDRAILS.mustNotInferProductivity).toBe(true);
    expect(AI_GUARDRAILS.mustNotInferBurnoutRisk).toBe(true);
    expect(AI_GUARDRAILS.mustNotMakeAutonomousOrganizationalDecisions).toBe(true);
  });

  it("digest narrative does not mutate core graph state", async () => {
    const before = snapshotCurrentGraph();
    const taskCountBefore = before.tasks.length;
    const goalCountBefore = before.goals.length;
    const depCountBefore = before.dependencies.length;
    const eventCountBefore = before.events.length;

    await generateDigestNarrative("person-priya", NOW);

    const after = getGraphStore().getGraph();
    expect(after.tasks).toEqual(before.tasks);
    expect(after.goals).toEqual(before.goals);
    expect(after.dependencies).toEqual(before.dependencies);
    expect(after.events.length).toBe(eventCountBefore);
    expect(after.tasks.length).toBe(taskCountBefore);
    expect(after.goals.length).toBe(goalCountBefore);
    expect(after.dependencies.length).toBe(depCountBefore);
  });

  it("NL parsing does not mutate core graph state", async () => {
    const before = snapshotCurrentGraph();

    const result = await parseNaturalLanguageInput(
      "Create a task for the design team by Friday",
      "person-priya",
    );

    expect(result.data.requiresConfirmation).toBe(true);
    const after = getGraphStore().getGraph();
    expect(after.tasks).toEqual(before.tasks);
    expect(after.goals).toEqual(before.goals);
    expect(after.dependencies).toEqual(before.dependencies);
  });

  it("advisory scoring does not modify authoritative Impact Score", async () => {
    const graph = getGraphStore().getGraph();
    const task = graph.tasks.find((t) => t.status === "open")!;
    const scoreBefore = computeImpactScore(graph, task, NOW);
    const rankedBefore = scoreOpenTasks(graph, "person-priya", NOW).map((t) => ({
      id: t.id,
      score: t.impactScore.score,
    }));

    const result = await analyzeScoringWeights("person-priya", NOW);

    expect(result.data.authoritativeScoresPreserved).toBe(true);
    expect(result.data.suggestions.every((s) => s.advisoryOnly)).toBe(true);

    const graphAfter = getGraphStore().getGraph();
    const scoreAfter = computeImpactScore(graphAfter, task, NOW);
    const rankedAfter = scoreOpenTasks(graphAfter, "person-priya", NOW).map((t) => ({
      id: t.id,
      score: t.impactScore.score,
    }));

    expect(scoreAfter.score).toBe(scoreBefore.score);
    expect(scoreAfter.componentBreakdown).toEqual(scoreBefore.componentBreakdown);
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

  it("fallback digest preserves MVP aerial view data paths", async () => {
    const digestService = getDigestNarrativeService() as MockDigestNarrativeService;
    digestService.setShouldThrow(true);

    const aerialBefore = getGraphStore().getGraph().events.length;
    const result = await generateDigestNarrative("person-priya", NOW);

    expect(result.status).toBe("fallback");
    expect(result.data.items.length).toBeGreaterThanOrEqual(0);
    expect(getGraphStore().getGraph().events.length).toBe(aerialBefore);
  });

  it("advisory output never contains modified task rankings", async () => {
    const result = await analyzeScoringWeights("person-priya", NOW);
    const serialized = JSON.stringify(result.data);

    expect(serialized).not.toMatch(/newRank/i);
    expect(serialized).not.toMatch(/"authoritativeScore":/);
    expect(result.data).not.toHaveProperty("rankedTasks");
    expect(result.data).not.toHaveProperty("modifiedScores");
    expect(result.data.authoritativeScoresPreserved).toBe(true);
  });
});
