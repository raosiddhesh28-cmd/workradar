import { describe, it, expect, beforeEach } from "vitest";
import {
  buildDigestNarrativeContext,
  buildBlockerRootCauseContext,
  buildAdvisoryScoringContext,
} from "@/application/ai/context/build-ai-context";
import {
  MockDigestNarrativeService,
  MockBlockerRootCauseNarrativeService,
  MockNaturalLanguageInputParsingService,
  MockAdvisoryScoringAnalysisService,
  withAiFallback,
  buildDigestFallback,
  buildNlParsingFallback,
} from "@/infrastructure/ai";
import { resetGraphStore } from "@/infrastructure/store";
import { NOW, ORG_ID } from "@/infrastructure/seed/teams";

describe("AI context builders", () => {
  beforeEach(() => {
    resetGraphStore();
  });

  it("builds digest context with structured event snapshots from the bus", () => {
    const context = buildDigestNarrativeContext("person-priya", NOW);

    expect(context.personId).toBe("person-priya");
    expect(context.personName).toBeTruthy();
    expect(context.timeWindow.since).toBeTruthy();
    expect(context.timeWindow.until).toBeTruthy();
    expect(Array.isArray(context.events)).toBe(true);

    for (const event of context.events) {
      expect(event).toHaveProperty("eventId");
      expect(event).toHaveProperty("sequence");
      expect(event).toHaveProperty("type");
      expect(event).toHaveProperty("summary");
      expect(event).toHaveProperty("entityType");
      expect(event).toHaveProperty("entityId");
    }
  });

  it("builds blocker context with dependency path and related events", () => {
    const context = buildBlockerRootCauseContext(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );

    expect(context.dependencyId).toBe("dep-api-blocks-mobile");
    expect(context.path.length).toBeGreaterThan(0);
    expect(context.path[0]).toMatchObject({ type: expect.any(String), id: expect.any(String) });
    expect(context.direction).toMatch(/blocking_me|im_blocking/);
    expect(typeof context.daysBlocked).toBe("number");
  });

  it("builds advisory context with pre-computed authoritative score samples", () => {
    const context = buildAdvisoryScoringContext(ORG_ID, "person-priya", NOW);

    expect(context.orgId).toBe(ORG_ID);
    expect(context.currentWeights).toMatchObject({
      goalAlignment: expect.any(Number),
      blockingRadius: expect.any(Number),
    });

    for (const sample of context.taskScoreSamples) {
      expect(sample.authoritativeScore).toBeGreaterThanOrEqual(0);
      expect(sample.authoritativeScore).toBeLessThanOrEqual(100);
      expect(sample.componentBreakdown).toBeDefined();
    }
  });
});

describe("Mock AI services — deterministic responses", () => {
  it("digest service cites only provided source events", async () => {
    const service = new MockDigestNarrativeService();
    const input = {
      personId: "person-priya",
      personName: "Priya",
      timeWindow: { since: "2026-08-07T00:00:00.000Z", until: NOW.toISOString() },
      events: [
        {
          eventId: "evt-test-1",
          sequence: 1,
          type: "TASK_COMPLETED",
          timestamp: "2026-08-08T08:00:00.000Z",
          summary: "Finished design tokens",
          entityType: "task",
          entityId: "task-design-system",
        },
      ],
    };

    const result = await service.generateNarrative(input);
    expect(result.status).toBe("success");
    expect(result.source).toBe("mock-ai");
    expect(result.data.allCitedEventIds).toEqual(["evt-test-1"]);
    expect(result.data.items.every((i) => i.citedEventIds.length > 0)).toBe(true);
  });

  it("NL parsing always requires confirmation", async () => {
    const service = new MockNaturalLanguageInputParsingService();
    const result = await service.parseInput({
      rawInput: "Remind the design team about tokens by Friday",
      actorPersonId: "person-priya",
      orgId: ORG_ID,
    });

    expect(result.data.requiresConfirmation).toBe(true);
    expect(result.data.parsed.intent).toBe("create_task");
    if (result.data.parsed.intent === "create_task") {
      expect(result.data.parsed.title).toContain("design team");
    }
  });

  it("advisory scoring marks suggestions as advisory only", async () => {
    const service = new MockAdvisoryScoringAnalysisService();
    const context = buildAdvisoryScoringContext(ORG_ID, "person-priya", NOW);
    const result = await service.analyzeWeights(context);

    expect(result.data.authoritativeScoresPreserved).toBe(true);
    for (const suggestion of result.data.suggestions) {
      expect(suggestion.advisoryOnly).toBe(true);
    }
    expect(result.data.disclaimers.some((d) => d.includes("deterministic"))).toBe(true);
  });
});

describe("AI fallback behavior", () => {
  it("returns deterministic fallback when service throws", async () => {
    const service = new MockDigestNarrativeService();
    service.setShouldThrow(true);

    const input = {
      personId: "person-priya",
      personName: "Priya",
      timeWindow: { since: "2026-08-07T00:00:00.000Z", until: NOW.toISOString() },
      events: [
        {
          eventId: "evt-fb-1",
          sequence: 1,
          type: "TASK_COMPLETED",
          timestamp: "2026-08-08T08:00:00.000Z",
          summary: "Test event",
          entityType: "task",
          entityId: "task-1",
        },
      ],
    };

    const result = await withAiFallback(
      () => service.generateNarrative(input),
      () => buildDigestFallback(input),
    );

    expect(result.status).toBe("fallback");
    expect(result.source).toBe("deterministic-fallback");
    expect(result.fallbackReason).toBeTruthy();
    expect(result.data.allCitedEventIds).toContain("evt-fb-1");
  });

  it("returns fallback when service reports unavailable", async () => {
    const service = new MockNaturalLanguageInputParsingService();
    service.setAvailable(false);

    const input = {
      rawInput: "block the deploy",
      actorPersonId: "person-priya",
      orgId: ORG_ID,
    };

    const result = await withAiFallback(
      () => service.parseInput(input),
      () => buildNlParsingFallback(input),
    );

    expect(result.status).toBe("fallback");
    expect(result.data.parsed.intent).toBe("unknown");
    expect(result.data.requiresConfirmation).toBe(true);
  });

  it("blocker service fallback includes dependency path", async () => {
    resetGraphStore();
    const service = new MockBlockerRootCauseNarrativeService();
    service.setShouldThrow(true);
    const context = buildBlockerRootCauseContext(
      "dep-api-blocks-mobile",
      "person-jordan",
      NOW,
    );

    const result = await withAiFallback(
      () => service.explainBlocker(context),
      () => ({
        data: {
          narrative: `Blocked: ${context.description}`,
          rootCauseSummary: context.description,
          suggestedNextStep: "Review manually.",
          citations: [],
          dependencyPath: context.path,
        },
        status: "fallback" as const,
        source: "deterministic-fallback" as const,
        generatedAt: new Date().toISOString(),
      }),
    );

    expect(result.status).toBe("fallback");
    expect(result.data.dependencyPath.length).toBeGreaterThan(0);
  });
});
