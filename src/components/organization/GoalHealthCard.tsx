import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { GoalHealthItem } from "@/application/organization/organizational-view.service";
import { EmptyState } from "@/components/shared/EmptyState";

interface GoalHealthCardProps {
  items: GoalHealthItem[];
}

function healthBadgeVariant(
  status: GoalHealthItem["healthStatus"],
): "destructive" | "outline" | "secondary" {
  if (status === "breached") return "destructive";
  if (status === "at_risk") return "outline";
  return "secondary";
}

export function GoalHealthCard({ items }: GoalHealthCardProps) {
  const atRisk = items.filter((g) => g.healthStatus !== "on_track");

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Goal Health</CardTitle>
        <p className="text-sm text-muted-foreground">
          Goal status from existing system signals
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="No at-risk goals"
            description="All tracked goals in scope are currently on track."
          />
        ) : (
          items.map((goal) => (
            <div key={goal.goalId} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/goals/${goal.goalId}`}
                  className="font-medium text-sm hover:underline"
                >
                  {goal.title}
                </Link>
                <Badge
                  variant={healthBadgeVariant(goal.healthStatus)}
                  className={
                    goal.healthStatus === "at_risk" ? "text-amber-600" : undefined
                  }
                >
                  {goal.healthLabel}
                </Badge>
              </div>
              {goal.drivers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Drivers
                  </p>
                  <ul className="space-y-1">
                    {goal.drivers.map((driver) => (
                      <li key={driver.taskId}>
                        <Link
                          href={`/tasks/${driver.taskId}`}
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          {driver.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
        {items.length > 0 && atRisk.length === 0 && (
          <p className="text-xs text-muted-foreground">
            All goals in scope are on track.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
