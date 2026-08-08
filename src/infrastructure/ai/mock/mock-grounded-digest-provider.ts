import type { IDigestProvider, GroundedDigestProviderOutput } from "@/application/ai/contracts/digest-provider.contract";
import type { DigestContext } from "@/application/digest/types/digest-context";
import { DomainEventType } from "@/domain/events/types";
import { createAiResult } from "@/application/ai/contracts/shared";

function goalLabel(context: DigestContext, goalId: string | null): string | null {
  if (!goalId) return null;
  return context.relevantGoals.find((g) => g.goalId === goalId)?.title ?? null;
}

/**
 * Deterministic mock digest provider — generates grounded narrative from DigestContext only.
 */
export class MockDigestProvider implements IDigestProvider {
  readonly name = "mock-digest-provider";
  private available = true;
  private shouldThrow = false;
  private returnInvalid = false;

  isAvailable(): boolean {
    return this.available;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  setReturnInvalid(returnInvalid: boolean): void {
    this.returnInvalid = returnInvalid;
  }

  async generate(
    context: DigestContext,
  ): Promise<ReturnType<typeof createAiResult<GroundedDigestProviderOutput>>> {
    if (!this.available) {
      return createAiResult({
        data: emptyOutput(context),
        status: "unavailable",
        source: "deterministic-fallback",
        fallbackReason: "Mock digest provider unavailable",
      });
    }

    if (this.shouldThrow) {
      throw new Error("Mock digest provider failure");
    }

    if (this.returnInvalid) {
      return createAiResult({
        data: {
          headline: "Invalid",
          narrative: "This cites a fake event.",
          items: [{ text: "Fake fact.", citedEventIds: ["evt-does-not-exist"] }],
          citedEventIds: ["evt-does-not-exist"],
        },
        status: "success",
        source: "mock-ai",
      });
    }

    if (context.events.length === 0) {
      return createAiResult({
        data: {
          headline: "No activity recorded",
          narrative: "No role-relevant events were recorded in the selected time window.",
          items: [],
          citedEventIds: [],
        },
        status: "success",
        source: "mock-ai",
      });
    }

    const items: GroundedDigestProviderOutput["items"] = [];

    for (const change of context.goalHealthChanges) {
      const goalName = change.goalTitle;
      items.push({
        text: `${goalName} moved from ${change.beforeHealth.replace("_", " ")} to ${change.afterHealth.replace("_", " ")}.`,
        citedEventIds: [...change.sourceEventIds],
      });
    }

    const completed = context.events.filter((e) => e.type === DomainEventType.TASK_COMPLETED);
    for (const event of completed) {
      const linkedGoal = goalLabel(context, event.goalId);
      const goalSuffix = linkedGoal ? `, linked to ${linkedGoal}` : "";
      items.push({
        text: `${event.summary}${goalSuffix}.`,
        citedEventIds: [event.eventId],
      });
    }

    for (const change of context.dependencyChanges) {
      if (change.changeType === "removed" || change.changeType === "unblocked") {
        items.push({
          text: `Dependency resolved: ${change.description}.`,
          citedEventIds: [...change.sourceEventIds],
        });
      } else {
        items.push({
          text: `Dependency change: ${change.description}.`,
          citedEventIds: [...change.sourceEventIds],
        });
      }
    }

    const covered = new Set(items.flatMap((i) => i.citedEventIds));
    for (const event of context.events) {
      if (covered.has(event.eventId)) continue;
      items.push({
        text: event.summary,
        citedEventIds: [event.eventId],
      });
    }

    const narrative = items.map((i) => i.text).join(" ");
    const citedEventIds = [...new Set(items.flatMap((i) => i.citedEventIds))];

    return createAiResult({
      data: {
        headline: `${context.persona.personName}'s operational update (${context.events.length} events)`,
        narrative,
        items,
        citedEventIds,
      },
      status: "success",
      source: "mock-ai",
    });
  }
}

function emptyOutput(context: DigestContext): GroundedDigestProviderOutput {
  return {
    headline: "No activity recorded",
    narrative: "No role-relevant events in the selected window.",
    items: [],
    citedEventIds: [],
  };
}
