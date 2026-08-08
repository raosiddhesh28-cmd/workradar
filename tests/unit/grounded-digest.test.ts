import { describe, it, expect, beforeEach } from "vitest";
import { resetGraphStore } from "@/infrastructure/store";
import { resetAiServices, getDigestProvider, MockDigestProvider } from "@/infrastructure/ai";
import {
  selectDigestEvents,
  getPersonaScopedPersonIds,
  defaultDigestDateRange,
  buildDigestContextForPerson,
  getGroundedWhatHappenedDigest,
  validateGroundedDigestOutput,
} from "@/application/digest";
import { NOW } from "@/infrastructure/seed/teams";
import { getGraphStore } from "@/infrastructure/store";
import { getAerialView } from "@/application/services/aerial-view.service";
import { computeImpactScore, scoreOpenTasks } from "@/domain/scoring/impact-score";

describe("Digest event selection", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("filters events by date range", () => {
    const range = defaultDigestDateRange(NOW);
    const events = selectDigestEvents({ personId: "person-priya", dateRange: range });

    for (const event of events) {
      expect(new Date(event.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(range.since).getTime(),
      );
      expect(new Date(event.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(range.until).getTime(),
      );
    }
  });

  it("scopes events to the IC persona", () => {
    const range = defaultDigestDateRange(NOW);
    const priyaEvents = selectDigestEvents({ personId: "person-priya", dateRange: range });
    const marcusEvents = selectDigestEvents({ personId: "person-marcus", dateRange: range });

    expect(priyaEvents.length).toBeGreaterThan(0);
    for (const event of priyaEvents) {
      expect(event.relatedPersonIds).toContain("person-priya");
    }
    expect(marcusEvents.some((e) => e.relatedPersonIds.includes("person-marcus"))).toBe(true);
  });

  it("expands scope for managers to include direct reports", () => {
    const store = getGraphStore();
    const devon = store.getPerson("person-devon")!;
    const scoped = getPersonaScopedPersonIds(devon);
    const reports = store.getDirectReports("person-devon").map((p) => p.id);

    expect(scoped).toContain("person-devon");
    for (const reportId of reports) {
      expect(scoped).toContain(reportId);
    }
  });

  it("preserves deterministic bus sequence ordering", () => {
    const range = defaultDigestDateRange(NOW);
    const events = selectDigestEvents({ personId: "person-priya", dateRange: range });
    const sequences = events.map((e) => e.sequence);

    for (let i = 1; i < sequences.length; i++) {
      expect(sequences[i]).toBeGreaterThan(sequences[i - 1]);
    }
  });

  it("filters by task ID when provided", () => {
    const range = defaultDigestDateRange(NOW);
    const filtered = selectDigestEvents({
      personId: "person-priya",
      dateRange: range,
      taskIds: ["task-design-system"],
    });

    expect(filtered.length).toBeGreaterThan(0);
    for (const event of filtered) {
      const matches =
        event.taskId === "task-design-system" || event.entityId === "task-design-system";
      expect(matches).toBe(true);
    }
  });
});

describe("DigestContext grounding", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("builds DigestContext with structured event metadata", () => {
    const context = buildDigestContextForPerson("person-priya", NOW);

    expect(context.persona.personId).toBe("person-priya");
    expect(context.dateRange.since).toBeTruthy();
    expect(context.events.length).toBeGreaterThan(0);

    const first = context.events[0];
    expect(first.eventId).toBeTruthy();
    expect(first.type).toBeTruthy();
    expect(first.timestamp).toBeTruthy();
    expect(first.sourceSystem).toBeTruthy();
    expect(first.summary).toBeTruthy();
  });

  it("mock provider cites only supplied events", async () => {
    const context = buildDigestContextForPerson("person-priya", NOW);
    const provider = new MockDigestProvider();
    const result = await provider.generate(context);

    const allowed = new Set(context.events.map((e) => e.eventId));
    for (const id of result.data.citedEventIds) {
      expect(allowed.has(id)).toBe(true);
    }
  });

  it("rejects provider output that cites unknown events", () => {
    const context = buildDigestContextForPerson("person-priya", NOW);
    const validation = validateGroundedDigestOutput(
      {
        headline: "Bad",
        narrative: "Invented",
        items: [{ text: "Fake", citedEventIds: ["evt-not-in-context"] }],
        citedEventIds: ["evt-not-in-context"],
      },
      context,
    );

    expect(validation.valid).toBe(false);
  });

  it("handles empty event sets with a sensible result", async () => {
    const context = buildDigestContextForPerson("person-priya", NOW);
    const emptyContext = { ...context, events: [], goalHealthChanges: [], dependencyChanges: [] };
    const provider = new MockDigestProvider();
    const result = await provider.generate(emptyContext);

    expect(result.data.narrative).toContain("No role-relevant events");
    expect(result.data.citedEventIds).toEqual([]);
  });
});

describe("Grounded digest source transparency", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("preserves source event metadata in the view model", async () => {
    const digest = await getGroundedWhatHappenedDigest("person-priya", NOW);

    expect(digest.sourceEventCount).toBeGreaterThan(0);
    expect(digest.sourceEvents.length).toBe(digest.sourceEventCount);

    for (const event of digest.sourceEvents) {
      expect(event.eventId).toBeTruthy();
      expect(event.eventType).toBeTruthy();
      expect(event.timestamp).toBeTruthy();
      expect(event.sourceSystem).toBeTruthy();
      expect(event.summary).toBeTruthy();
    }
  });

  it("links narrative items to source event IDs", async () => {
    const digest = await getGroundedWhatHappenedDigest("person-priya", NOW);

    if (digest.mode === "ai") {
      for (const item of digest.narrativeItems) {
        for (const id of item.citedEventIds) {
          expect(digest.citedEventIds).toContain(id);
        }
      }
    }
  });
});

describe("Grounded digest failure handling", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("falls back when provider throws", async () => {
    const provider = getDigestProvider() as MockDigestProvider;
    provider.setShouldThrow(true);

    const digest = await getGroundedWhatHappenedDigest("person-priya", NOW);

    expect(digest.mode).toBe("fallback");
    expect(digest.fallbackNotice).toBe("Summary unavailable — showing source events.");
    expect(digest.legacyItems.length).toBeGreaterThan(0);
  });

  it("falls back when provider returns invalid citations", async () => {
    const provider = getDigestProvider() as MockDigestProvider;
    provider.setReturnInvalid(true);

    const digest = await getGroundedWhatHappenedDigest("person-priya", NOW);

    expect(digest.mode).toBe("fallback");
    expect(digest.fallbackNotice).toBeTruthy();
    expect(digest.sourceEvents.length).toBeGreaterThan(0);
  });

  it("falls back when provider is unavailable", async () => {
    const provider = getDigestProvider() as MockDigestProvider;
    provider.setAvailable(false);

    const digest = await getGroundedWhatHappenedDigest("person-priya", NOW);

    expect(digest.mode).toBe("fallback");
    expect(digest.legacyItems.length).toBeGreaterThan(0);
  });
});

describe("Grounded digest — existing aerial view preserved", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("does not change synchronous aerial view anchors", async () => {
    const view = await getAerialView("person-priya", NOW);
    expect(view.topWork.length).toBeGreaterThan(0);
    expect(view.whatHappened.length).toBeGreaterThan(0);
    expect(view.personName).toBe("Priya Sharma");
  });
});
