import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroundedDigestViewModel } from "@/application/digest/types/grounded-digest.dto";
import { formatEventTime, formatRelativeTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";

interface WhatHappenedCardProps {
  digest: GroundedDigestViewModel;
}

export function WhatHappenedCard({ digest }: WhatHappenedCardProps) {
  const hasNarrative = digest.mode === "ai" && digest.narrative.trim().length > 0;
  const showFallbackList = digest.mode === "fallback" || !hasNarrative;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          What Happened Today
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {hasNarrative ? digest.disclosureLabel : "Changes since yesterday — grounded in system events"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {digest.fallbackNotice && (
          <p className="text-xs text-muted-foreground" role="status">
            {digest.fallbackNotice}
          </p>
        )}

        {hasNarrative && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{digest.headline}</p>
            <p className="text-sm leading-relaxed">{digest.narrative}</p>
          </div>
        )}

        {digest.sourceEventCount > 0 && (
          <details className="group rounded-lg border p-3">
            <summary
              className="cursor-pointer text-sm font-medium list-none flex justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              aria-label={`View ${digest.sourceEventCount} source events`}
            >
              <span>
                View {digest.sourceEventCount} source event
                {digest.sourceEventCount === 1 ? "" : "s"}
              </span>
              <span className="text-xs text-muted-foreground shrink-0" aria-hidden>
                expand
              </span>
            </summary>
            <ul className="mt-3 space-y-3" role="list">
              {digest.sourceEvents.map((event) => (
                <li
                  key={event.eventId}
                  className="border-t pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium">{event.summary}</span>
                    <time
                      className="text-xs text-muted-foreground shrink-0"
                      dateTime={event.timestamp}
                    >
                      {formatEventTime(event.timestamp)}
                    </time>
                  </div>
                  <dl className="mt-1 grid gap-0.5 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      <dt className="sr-only">Event type</dt>
                      <dd>{event.eventType.replace(/_/g, " ")}</dd>
                    </div>
                    {event.teamName && (
                      <div className="flex gap-1">
                        <dt className="sr-only">Team</dt>
                        <dd>{event.teamName}</dd>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <dt className="sr-only">Source system</dt>
                      <dd>{event.sourceSystem}</dd>
                    </div>
                    {(event.beforeValue || event.afterValue) && (
                      <div className="flex gap-1">
                        <dt className="sr-only">Change</dt>
                        <dd>
                          {event.beforeValue ?? "—"} → {event.afterValue ?? "—"}
                        </dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          </details>
        )}

        {showFallbackList && digest.legacyItems.length > 0 && (
          <div className="space-y-3" aria-label="Source events">
            {digest.legacyItems.map((item) => (
              <details key={item.id} className="group rounded-lg border p-3">
                <summary className="cursor-pointer text-sm font-medium list-none flex justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  <span>{item.summary}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </summary>
                <p className="mt-2 text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
