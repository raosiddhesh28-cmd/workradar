import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DueDateClassification } from "@/domain/scheduling/due-date";
import { formatDueDateDisplay } from "@/domain/scheduling/due-date";

interface DueDateBadgeProps {
  classification: DueDateClassification;
  className?: string;
}

const STATUS_STYLES: Record<
  DueDateClassification["status"],
  { badge: string; label: string }
> = {
  completed: {
    badge: "bg-muted text-muted-foreground border-muted",
    label: "Completed",
  },
  overdue: {
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    label: "Overdue",
  },
  due_today: {
    badge: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-100",
    label: "Due today",
  },
  due_soon: {
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50",
    label: "Due soon",
  },
  on_track: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50",
    label: "On track",
  },
  none: {
    badge: "bg-muted/50 text-muted-foreground",
    label: "No due date",
  },
};

export function DueDateBadge({ classification, className }: DueDateBadgeProps) {
  const style = STATUS_STYLES[classification.status];
  const dateText =
    classification.dueDate && classification.status !== "completed"
      ? formatDueDateDisplay(classification.dueDate)
      : classification.dueDate
        ? formatDueDateDisplay(classification.dueDate)
        : null;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <Badge variant="outline" className={cn("text-xs w-fit", style.badge)}>
        {style.label.toUpperCase()}
      </Badge>
      {dateText && (
        <span className="text-xs text-muted-foreground">Due {dateText}</span>
      )}
    </div>
  );
}
