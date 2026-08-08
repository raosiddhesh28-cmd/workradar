import type {
  IBlockerRootCauseNarrativeService,
  BlockerRootCauseInput,
  BlockerRootCauseOutput,
} from "@/application/ai/contracts/blocker-root-cause.contract";
import { createAiResult } from "@/application/ai/contracts/shared";

export class MockBlockerRootCauseNarrativeService
  implements IBlockerRootCauseNarrativeService
{
  private available = true;
  private shouldThrow = false;

  isAvailable(): boolean {
    return this.available;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  async explainBlocker(
    input: BlockerRootCauseInput,
  ): Promise<ReturnType<typeof createAiResult<BlockerRootCauseOutput>>> {
    if (!this.available) {
      return createAiResult({
        data: {
          narrative: `Blocked: ${input.description}`,
          rootCauseSummary: input.description,
          suggestedNextStep: "Review dependency details manually.",
          citations: input.relatedEvents.map((e, i) => ({
            eventId: e.eventId,
            sequence: i + 1,
            type: e.type,
            timestamp: e.timestamp,
          })),
          dependencyPath: input.path,
        },
        status: "unavailable",
        source: "deterministic-fallback",
        fallbackReason: "Mock blocker narrative service unavailable",
      });
    }

    if (this.shouldThrow) {
      throw new Error("Mock blocker narrative service failure");
    }

    const pathSummary = input.path.map((n) => `${n.type}:${n.label}`).join(" → ");
    const directionLabel =
      input.direction === "blocking_me" ? "waiting on" : "blocking";

    return createAiResult({
      data: {
        narrative: `${input.taskTitle ?? "Work"} is ${directionLabel} ${input.otherPartyName}. ${input.description} (${input.daysBlocked}d). Chain: ${pathSummary}.`,
        rootCauseSummary: input.description,
        suggestedNextStep:
          input.direction === "blocking_me"
            ? `Follow up with ${input.otherPartyName} on the open dependency.`
            : `Unblock ${input.otherPartyName} by resolving: ${input.description}`,
        citations: input.relatedEvents.map((e, i) => ({
          eventId: e.eventId,
          sequence: i + 1,
          type: e.type,
          timestamp: e.timestamp,
        })),
        dependencyPath: input.path,
      },
      status: "success",
      source: "mock-ai",
    });
  }
}
