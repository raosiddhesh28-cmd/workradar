import type { ProgressSummaryDto } from "@/application/progress/progress.service";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressViewProps {
  summary: ProgressSummaryDto;
}

function formatDay(date: string): string {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function ProgressView({ summary }: ProgressViewProps) {
  const maxRemaining = summary.hasHistory
    ? Math.max(...summary.history.map((p) => p.remaining), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.remaining}</p>
            <p className="text-xs text-muted-foreground">{summary.metricLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.completed}</p>
            <p className="text-xs text-muted-foreground">{summary.metricLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total in scope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.total}</p>
            {summary.deferred > 0 && (
              <p className="text-xs text-muted-foreground">
                {summary.deferred} deferred
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {summary.hasHistory ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Remaining work trend</h2>
          {summary.historyNote && (
            <p className="text-xs text-muted-foreground">{summary.historyNote}</p>
          )}
          <div className="rounded-lg border p-4 space-y-3">
            {summary.history.map((point) => (
              <div key={point.date} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-muted-foreground">
                  {formatDay(point.date)}
                </span>
                <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded"
                    style={{
                      width: `${(point.remaining / maxRemaining) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs">
                  {point.remaining}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="No progress history"
          description={
            summary.historyNote ??
            "There isn't enough historical data to show a burndown yet."
          }
        />
      )}
    </div>
  );
}
