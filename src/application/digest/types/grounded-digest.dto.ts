import type { DigestItem } from "@/application/services/aerial-view.service";

export interface SourceEventDisplay {
  eventId: string;
  eventType: string;
  timestamp: string;
  summary: string;
  entityType: string;
  entityId: string;
  sourceSystem: string;
  actorPersonId: string;
  teamName: string | null;
  beforeValue: string | null;
  afterValue: string | null;
}

export interface GroundedDigestNarrativeItem {
  text: string;
  citedEventIds: string[];
}

export interface GroundedDigestViewModel {
  mode: "ai" | "fallback";
  headline: string;
  narrative: string;
  narrativeItems: GroundedDigestNarrativeItem[];
  sourceEvents: SourceEventDisplay[];
  sourceEventCount: number;
  citedEventIds: string[];
  disclosureLabel: string;
  fallbackNotice: string | null;
  /** Structured raw events for fallback presentation — preserves MVP behavior. */
  legacyItems: DigestItem[];
}
