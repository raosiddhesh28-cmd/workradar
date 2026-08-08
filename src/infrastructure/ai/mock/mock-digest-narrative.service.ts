import type {
  IDigestNarrativeService,
  DigestNarrativeInput,
  DigestNarrativeOutput,
} from "@/application/ai/contracts/digest-narrative.contract";
import { createAiResult } from "@/application/ai/contracts/shared";
import { buildDigestFallback } from "../fallback/fallback-generators";

export class MockDigestNarrativeService implements IDigestNarrativeService {
  private available = true;
  private shouldThrow = false;

  isAvailable(): boolean {
    return this.available;
  }

  /** Test hook — simulates provider outage. */
  setAvailable(available: boolean): void {
    this.available = available;
  }

  /** Test hook — simulates runtime failure. */
  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  async generateNarrative(
    input: DigestNarrativeInput,
  ): Promise<ReturnType<typeof createAiResult<DigestNarrativeOutput>>> {
    if (!this.available) {
      return createAiResult({
        data: buildDigestFallback(input).data,
        status: "unavailable",
        source: "deterministic-fallback",
        fallbackReason: "Mock AI provider unavailable",
      });
    }

    if (this.shouldThrow) {
      throw new Error("Mock digest service failure");
    }

    if (input.events.length === 0) {
      return createAiResult({
        data: {
          headline: `Quiet period for ${input.personName}`,
          items: [
            {
              summary: "No role-relevant events in the selected window.",
              citedEventIds: [],
            },
          ],
          allCitedEventIds: [],
        },
        status: "success",
        source: "mock-ai",
      });
    }

    const completed = input.events.filter((e) => e.type === "TASK_COMPLETED");
    const blockers = input.events.filter(
      (e) => e.type === "DEPENDENCY_ADDED" || e.type === "TASK_BLOCKED",
    );
    const goals = input.events.filter((e) => e.type === "GOAL_HEALTH_CHANGED");

    const items = [
      ...completed.map((e) => ({
        summary: `Completed: ${e.summary}`,
        citedEventIds: [e.eventId],
      })),
      ...blockers.map((e) => ({
        summary: `Blocker activity: ${e.summary}`,
        citedEventIds: [e.eventId],
      })),
      ...goals.map((e) => ({
        summary: `Goal shift: ${e.summary}`,
        citedEventIds: [e.eventId],
      })),
    ];

    const citedIds = input.events.map((e) => e.eventId);

    return createAiResult({
      data: {
        headline: `${input.personName}'s day in brief (${input.events.length} events)`,
        items: items.length > 0 ? items : [{ summary: input.events[0].summary, citedEventIds: [input.events[0].eventId] }],
        allCitedEventIds: citedIds,
      },
      status: "success",
      source: "mock-ai",
    });
  }
}
