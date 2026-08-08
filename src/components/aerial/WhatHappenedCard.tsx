import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DigestItem } from "@/application/services/aerial-view.service";
import { formatRelativeTime } from "@/lib/format";

interface WhatHappenedCardProps {
  items: DigestItem[];
}

export function WhatHappenedCard({ items }: WhatHappenedCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          What Happened Today
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Changes since yesterday — grounded in system events
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notable changes in the last 24 hours.
          </p>
        ) : (
          items.map((item) => (
            <details key={item.id} className="group rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium list-none flex justify-between gap-2">
                <span>{item.summary}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </summary>
              <p className="mt-2 text-xs text-muted-foreground">
                Source: event {item.sourceEventIds.join(", ")}
              </p>
            </details>
          ))
        )}
      </CardContent>
    </Card>
  );
}
