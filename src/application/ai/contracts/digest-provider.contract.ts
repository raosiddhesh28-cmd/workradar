import type { AiServiceResult } from "@/application/ai/contracts/shared";
import type { DigestContext } from "@/application/digest/types/digest-context";

export interface GroundedDigestNarrativeBlock {
  text: string;
  citedEventIds: string[];
}

export interface GroundedDigestProviderOutput {
  headline: string;
  narrative: string;
  items: GroundedDigestNarrativeBlock[];
  citedEventIds: string[];
}

/**
 * Provider boundary for grounded digest generation.
 * MockDigestProvider implements this today; a future LlmDigestProvider can swap in.
 */
export interface IDigestProvider {
  readonly name: string;
  isAvailable(): boolean;
  generate(context: DigestContext): Promise<AiServiceResult<GroundedDigestProviderOutput>>;
}
