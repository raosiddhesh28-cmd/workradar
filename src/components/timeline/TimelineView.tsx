import Link from "next/link";
import type { TimelineBar, TimelineDto } from "@/application/timeline/timeline.service";
import { timelineBarStyle } from "@/application/timeline/timeline.service";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";

interface TimelineViewProps {
  timeline: TimelineDto;
}

function formatAxisDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function TimelineRow({
  bar,
  rangeStart,
  rangeEnd,
}: {
  bar: TimelineBar;
  rangeStart: string;
  rangeEnd: string;
}) {
  const style = timelineBarStyle(bar, rangeStart, rangeEnd);
  const statusColor =
    bar.status === "done"
      ? "bg-muted-foreground/60"
      : bar.isBlocked
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div className="grid grid-cols-[minmax(140px,200px)_1fr] gap-3 items-center py-2 border-b last:border-b-0">
      <div className="min-w-0">
        <Link
          href={`/tasks/${bar.taskId}`}
          className="text-sm font-medium hover:underline line-clamp-2"
        >
          {bar.title}
        </Link>
        <p className="text-xs text-muted-foreground truncate">
          {bar.assigneeName} · {bar.teamName}
        </p>
        {bar.hasEstimatedDates && (
          <p className="text-xs text-muted-foreground">Estimated span</p>
        )}
      </div>
      <div className="relative h-8 bg-muted/30 rounded">
        <Link
          href={`/tasks/${bar.taskId}`}
          className={`absolute top-1 bottom-1 rounded ${statusColor} opacity-90 hover:opacity-100 transition-opacity`}
          style={style}
          title={`${bar.title} — ${formatAxisDate(bar.startDate)} to ${formatAxisDate(bar.endDate)}`}
        />
      </div>
    </div>
  );
}

export function TimelineView({ timeline }: TimelineViewProps) {
  if (timeline.bars.length === 0) {
    return (
      <EmptyState
        title="No timeline data"
        description="There is not enough scheduling information to display a timeline."
      />
    );
  }

  const mid = timeline.rangeStart;
  const end = timeline.rangeEnd;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[minmax(140px,200px)_1fr] gap-3 text-xs text-muted-foreground pb-2">
            <span>Task</span>
            <div className="flex justify-between px-1">
              <span>{formatAxisDate(mid)}</span>
              <span>{formatAxisDate(end)}</span>
            </div>
          </div>
          {timeline.bars.map((bar) => (
            <TimelineRow
              key={bar.taskId}
              bar={bar}
              rangeStart={timeline.rangeStart}
              rangeEnd={timeline.rangeEnd}
            />
          ))}
        </div>
      </div>
      {timeline.excludedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {timeline.excludedCount} task
          {timeline.excludedCount === 1 ? "" : "s"} omitted — no start or due
          date available.
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">Active</Badge>
        <Badge variant="outline" className="border-amber-400">
          Blocked
        </Badge>
        <Badge variant="outline" className="bg-muted">Done</Badge>
      </div>
    </div>
  );
}
