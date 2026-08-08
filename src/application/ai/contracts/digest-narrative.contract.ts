import type { AiServiceResult } from "./shared";

export interface DigestEventSnapshot {
  eventId: string;
  sequence: number;
  type: string;
  timestamp: string;
  summary: string;
  entityType: string;
  entityId: string;
}

export interface DigestNarrativeInput {
  personId: string;
  personName: string;
  timeWindow: { since: string; until: string };
  events: ReadonlyArray<DigestEventSnapshot>;
}

export interface DigestNarrativeItem {
  summary: string;
  citedEventIds: string[];
}

export interface DigestNarrativeOutput {
  headline: string;
  items: DigestNarrativeItem[];
  /** Every narrative item must trace to at least one source event. */
  allCitedEventIds: string[];
}

/**
 * Assistive digest/narrative over structured bus events.
 * Grounded in Event/Signal Bus data — never invents facts.
 */
export interface IDigestNarrativeService {
  isAvailable(): boolean;
  generateNarrative(
    input: DigestNarrativeInput,
  ): Promise<AiServiceResult<DigestNarrativeOutput>>;
}
