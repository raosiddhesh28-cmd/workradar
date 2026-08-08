import type { DigestContext } from "./types/digest-context";
import type {
  GroundedDigestViewModel,
  SourceEventDisplay,
} from "./types/grounded-digest.dto";
import type { DigestItem } from "@/application/services/aerial-view.service";
import { buildDigestContext } from "./build-digest-context";
import { defaultDigestDateRange } from "./digest-event-selection.service";
import { validateGroundedDigestOutput } from "./validate-grounded-digest";
import { getDigestProvider } from "@/infrastructure/ai";
import { getGraphStore } from "@/infrastructure/store";

const DISCLOSURE_LABEL = "AI summary from WorkRadar events";
const FALLBACK_NOTICE = "Summary unavailable — showing source events.";

function toSourceEventDisplay(
  context: DigestContext,
): SourceEventDisplay[] {
  const store = getGraphStore();
  const teams = store.getTeams();

  return context.events.map((event) => {
    const actor = store.getPerson(event.actorPersonId);
    const team = actor
      ? teams.find((t) => t.id === actor.teamId)
      : undefined;

    return {
      eventId: event.eventId,
      eventType: event.type,
      timestamp: event.timestamp,
      summary: event.summary,
      entityType: event.entityType,
      entityId: event.entityId,
      sourceSystem: event.sourceSystem,
      actorPersonId: event.actorPersonId,
      teamName: team?.name ?? null,
      beforeValue: event.beforeValue,
      afterValue: event.afterValue,
    };
  });
}

function toLegacyItems(context: DigestContext): DigestItem[] {
  return [...context.events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)
    .map((e) => ({
      id: e.eventId,
      summary: e.summary,
      timestamp: e.timestamp,
      sourceEventIds: [e.eventId],
    }));
}

function buildFallbackViewModel(context: DigestContext): GroundedDigestViewModel {
  const legacyItems = toLegacyItems(context);

  return {
    mode: "fallback",
    headline: legacyItems.length
      ? `${legacyItems.length} update(s) in the last 24 hours`
      : "No notable changes",
    narrative: "",
    narrativeItems: legacyItems.map((item) => ({
      text: item.summary,
      citedEventIds: item.sourceEventIds,
    })),
    sourceEvents: toSourceEventDisplay(context),
    sourceEventCount: context.events.length,
    citedEventIds: context.events.map((e) => e.eventId),
    disclosureLabel: DISCLOSURE_LABEL,
    fallbackNotice: FALLBACK_NOTICE,
    legacyItems,
  };
}

function buildAiViewModel(
  context: DigestContext,
  headline: string,
  narrative: string,
  items: { text: string; citedEventIds: string[] }[],
  citedEventIds: string[],
): GroundedDigestViewModel {
  return {
    mode: "ai",
    headline,
    narrative,
    narrativeItems: items,
    sourceEvents: toSourceEventDisplay(context),
    sourceEventCount: context.events.length,
    citedEventIds,
    disclosureLabel: DISCLOSURE_LABEL,
    fallbackNotice: null,
    legacyItems: toLegacyItems(context),
  };
}

/**
 * Generates the grounded "What Happened Today" digest for the aerial view.
 * Falls back to structured events when the provider fails or returns invalid output.
 */
export async function getGroundedWhatHappenedDigest(
  personId: string,
  now: Date = new Date(),
): Promise<GroundedDigestViewModel> {
  const criteria = {
    personId,
    dateRange: defaultDigestDateRange(now),
  };

  const context = buildDigestContext(criteria);
  const provider = getDigestProvider();

  try {
    if (!provider.isAvailable()) {
      return buildFallbackViewModel(context);
    }

    const result = await provider.generate(context);

    if (result.status === "unavailable" || result.status === "fallback") {
      return buildFallbackViewModel(context);
    }

    const validation = validateGroundedDigestOutput(result.data, context);
    if (!validation.valid) {
      return buildFallbackViewModel(context);
    }

    return buildAiViewModel(
      context,
      result.data.headline,
      result.data.narrative,
      result.data.items,
      result.data.citedEventIds,
    );
  } catch {
    return buildFallbackViewModel(context);
  }
}

/** Exposed for tests — builds context without invoking provider. */
export function buildDigestContextForPerson(
  personId: string,
  now: Date,
): DigestContext {
  return buildDigestContext({
    personId,
    dateRange: defaultDigestDateRange(now),
  });
}
