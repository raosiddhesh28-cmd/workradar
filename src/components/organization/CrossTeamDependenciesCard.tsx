import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CrossTeamDependencyView } from "@/domain/organization/cross-team-dependencies";
import { EmptyState } from "@/components/shared/EmptyState";
import { LinkButton } from "@/components/shared/LinkButton";

interface CrossTeamDependenciesCardProps {
  items: CrossTeamDependencyView[];
}

export function CrossTeamDependenciesCard({
  items,
}: CrossTeamDependenciesCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Cross-Team Dependencies
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Where teams block each other across the graph
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="No cross-team blockers"
            description="No active cross-team dependency risks detected."
          />
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{item.rootTaskTitle}</p>
                <Badge
                  variant={item.statusLabel === "At risk" ? "outline" : "secondary"}
                  className={
                    item.statusLabel === "At risk" ? "text-amber-600" : undefined
                  }
                >
                  {item.statusLabel}
                </Badge>
              </div>

              <div className="font-mono text-sm space-y-1" aria-label="Dependency chain">
                {item.chain.map((node, index) => (
                  <div key={node.taskId} className="flex flex-col">
                    {index > 0 && (
                      <span className="text-muted-foreground pl-2" aria-hidden>
                        ↓ blocks
                      </span>
                    )}
                    <span>
                      {node.taskTitle}
                      <span className="text-muted-foreground text-xs ml-2">
                        {node.teamName}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Downstream: {item.downstreamTaskCount} task
                {item.downstreamTaskCount === 1 ? "" : "s"} ·{" "}
                {item.downstreamTeamNames.join(" → ")}
              </p>

              {item.goalTitle && (
                <p className="text-xs text-muted-foreground">
                  Goal: {item.goalTitle}
                </p>
              )}

              <LinkButton
                href={`/organization/dependencies/${item.id}`}
                variant="outline"
                size="sm"
              >
                View dependency chain
              </LinkButton>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
