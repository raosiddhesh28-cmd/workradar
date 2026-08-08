import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { TopOrganizationalImpactItem } from "@/application/organization/organizational-view.service";
import { EmptyState } from "@/components/shared/EmptyState";

interface TopOrganizationalImpactCardProps {
  items: TopOrganizationalImpactItem[];
}

export function TopOrganizationalImpactCard({
  items,
}: TopOrganizationalImpactCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Top Organizational Impact
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Highest systemic consequence — ranked by Impact Score
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="No scoped impact work"
            description="No open work in the current organizational scope."
          />
        ) : (
          items.map((item) => (
            <Link
              key={item.task.id}
              href={`/tasks/${item.task.id}`}
              className="block rounded-lg border p-4 space-y-2 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-mono text-muted-foreground">
                    #{item.rank}
                  </p>
                  <p className="font-medium text-sm">{item.task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.assigneeName} · {item.teamName}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 font-mono">
                  {Math.round(item.impactScore)}
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Why it matters: </span>
                  <span className="text-muted-foreground">{item.organizationalWhy}</span>
                </p>
                {item.goalTitle && (
                  <p className="text-xs text-muted-foreground">
                    Goal: {item.goalTitle}
                    {item.goalHealth && item.goalHealth !== "on_track"
                      ? ` (${item.goalHealth.replace("_", " ")})`
                      : ""}
                  </p>
                )}
                {item.downstreamTaskCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Downstream impact: {item.downstreamTaskCount} task
                    {item.downstreamTaskCount === 1 ? "" : "s"} /{" "}
                    {item.downstreamTeamCount} team
                    {item.downstreamTeamCount === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
