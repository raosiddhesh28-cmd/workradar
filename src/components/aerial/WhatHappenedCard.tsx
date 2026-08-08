import { Clock } from "lucide-react";
import type { GroundedDigestViewModel } from "@/application/digest/types/grounded-digest.dto";
import { formatEventTime, formatRelativeTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/design-system/SectionCard";
import { StatusLabel } from "@/components/design-system/StatusLabel";

interface WhatHappenedCardProps {
  digest: GroundedDigestViewModel;
}

export function WhatHappenedCard({ digest }: WhatHappenedCardProps) {
  const hasNarrative = digest.mode === "ai" && digest.narrative.trim().length > 0;
  const showFallbackList = digest.mode === "fallback" || !hasNarrative;

  return (
    <SectionCard
      id="what-happened"
      title="What changed"
      description={
        hasNarrative
          ? digest.disclosureLabel
          : "Meaningful changes since yesterday — grounded in system events"
      }
      icon={<Clock className="h-4 w-4" />}
    >
      {digest.fallbackNotice && (
        <p className="text-xs text-muted-foreground mb-3" role="status">
          {digest.fallbackNotice}
        </p>
      )}

      {hasNarrative && (
        <div className="space-y-2 mb-4 rounded-md bg-muted/40 p-3 border border-border/60">
          <p className="text-sm font-medium">{digest.headline}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {digest.narrative}
          </p>
        </div>
      )}

      {digest.sourceEventCount > 0 && (
        <details className="group rounded-lg border border-border bg-background">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium list-none flex justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            <span>
              {digest.sourceEventCount} source event
              {digest.sourceEventCount === 1 ? "" : "s"}
            </span>
            <StatusLabel variant="neutral">Expand</StatusLabel>
          </summary>
          <ul className="px-4 pb-4 space-y-3 border-t border-border" role="list">
            {digest.sourceEvents.map((event) => (
              <li
                key={event.eventId}
                className="pt-3 first:pt-3 border-t border-border/60 first:border-t-0"
              >
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium">{event.summary}</span>
                  <time
                    className="wr-metadata shrink-0"
                    dateTime={event.timestamp}
                  >
                    {formatEventTime(event.timestamp)}
                  </time>
                </div>
                <dl className="mt-1.5 grid gap-1 wr-metadata">
                  <div>
                    <dt className="sr-only">Event type</dt>
                    <dd>{event.eventType.replace(/_/g, " ")}</dd>
                  </div>
                  {event.teamName && (
                    <div>
                      <dt className="sr-only">Team</dt>
                      <dd>{event.teamName}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="sr-only">Source</dt>
                    <dd>Source: {event.sourceSystem}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </details>
      )}

      {showFallbackList && digest.legacyItems.length > 0 && (
        <div className="space-y-2 mt-3" aria-label="Recent events">
          {digest.legacyItems.map((item) => (
            <details key={item.id} className="rounded-lg border border-border bg-background">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium list-none flex justify-between gap-2">
                <span>{item.summary}</span>
                <span className="wr-metadata shrink-0">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </summary>
              <p className="px-4 pb-3 wr-metadata">
                Event ID: {item.sourceEventIds.join(", ")}
              </p>
            </details>
          ))}
        </div>
      )}

      {digest.sourceEventCount === 0 && digest.legacyItems.length === 0 && (
        <EmptyState
          title="No notable changes"
          description="No activity recorded in the last 24 hours."
        />
      )}
    </SectionCard>
  );
}
