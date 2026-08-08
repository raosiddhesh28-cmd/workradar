import type {
  INaturalLanguageInputParsingService,
  NlInputParsingInput,
  NlInputParsingOutput,
} from "@/application/ai/contracts/nl-input-parsing.contract";
import { createAiResult } from "@/application/ai/contracts/shared";

const BLOCKER_PATTERNS = /\b(block|blocked|blocker|waiting on|stuck on)\b/i;
const TASK_PATTERNS = /\b(remind|create|add|task|todo|by friday|by monday|due)\b/i;
const FRIDAY_PATTERN = /\bfriday\b/i;
const TEAM_PATTERN = /\b(design team|engineering|team)\b/i;

export class MockNaturalLanguageInputParsingService
  implements INaturalLanguageInputParsingService
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

  async parseInput(
    input: NlInputParsingInput,
  ): Promise<ReturnType<typeof createAiResult<NlInputParsingOutput>>> {
    if (!this.available) {
      return createAiResult({
        data: {
          parsed: { intent: "unknown", reason: "NL parsing service unavailable" },
          confidence: 0,
          requiresConfirmation: true,
          originalInput: input.rawInput,
        },
        status: "unavailable",
        source: "deterministic-fallback",
        fallbackReason: "Mock NL parsing service unavailable",
      });
    }

    if (this.shouldThrow) {
      throw new Error("Mock NL parsing service failure");
    }

    const text = input.rawInput.trim();
    if (!text) {
      return createAiResult({
        data: {
          parsed: { intent: "unknown", reason: "Empty input" },
          confidence: 0,
          requiresConfirmation: true,
          originalInput: input.rawInput,
        },
        status: "success",
        source: "mock-ai",
      });
    }

    if (BLOCKER_PATTERNS.test(text)) {
      return createAiResult({
        data: {
          parsed: {
            intent: "flag_blocker",
            taskHint: null,
            description: text,
          },
          confidence: 0.75,
          requiresConfirmation: true,
          originalInput: input.rawInput,
        },
        status: "success",
        source: "mock-ai",
      });
    }

    if (TASK_PATTERNS.test(text)) {
      const title = text
        .replace(/^(remind|create|add)\s+(the\s+)?/i, "")
        .replace(/\s+by\s+friday\.?$/i, "")
        .trim();

      return createAiResult({
        data: {
          parsed: {
            intent: "create_task",
            title: title || text,
            dueDate: FRIDAY_PATTERN.test(text) ? "next-friday" : null,
            assigneeHint: TEAM_PATTERN.test(text) ? "design-team" : null,
            linkedGoalHint: null,
          },
          confidence: 0.8,
          requiresConfirmation: true,
          originalInput: input.rawInput,
        },
        status: "success",
        source: "mock-ai",
      });
    }

    return createAiResult({
      data: {
        parsed: {
          intent: "unknown",
          reason: "Input did not match known task or blocker patterns",
        },
        confidence: 0.2,
        requiresConfirmation: true,
        originalInput: input.rawInput,
      },
      status: "success",
      source: "mock-ai",
    });
  }
}
