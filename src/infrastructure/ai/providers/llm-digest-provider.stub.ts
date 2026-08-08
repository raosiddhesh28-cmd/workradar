import type { IDigestProvider } from "@/application/ai/contracts/digest-provider.contract";
import type { DigestContext } from "@/application/digest/types/digest-context";
import { createAiResult } from "@/application/ai/contracts/shared";

/**
 * Boundary stub for a future real LLM digest provider.
 * Not connected to any external API.
 */
export class LlmDigestProviderStub implements IDigestProvider {
  readonly name = "llm-digest-provider-stub";

  isAvailable(): boolean {
    return false;
  }

  async generate(context: DigestContext) {
    return createAiResult({
      data: {
        headline: "",
        narrative: "",
        items: [],
        citedEventIds: [],
      },
      status: "unavailable",
      source: "deterministic-fallback",
      fallbackReason: `LLM digest provider is not configured (${context.events.length} events skipped)`,
    });
  }
}
