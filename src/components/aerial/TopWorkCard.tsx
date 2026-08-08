import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { completeTask, deferTask } from "@/app/actions";
import type { TopWorkItem } from "@/application/services/aerial-view.service";
import { LinkButton } from "@/components/shared/LinkButton";
import { EmptyState } from "@/components/shared/EmptyState";

interface TopWorkCardProps {
  items: TopWorkItem[];
}

export function TopWorkCard({ items }: TopWorkCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Top Work</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ranked by organizational impact — not manual priority
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyState
            title="No open work"
            description="You're clear for now — no ranked tasks in your queue."
          />
        ) : (
          items.map((item, index) => (
            <div
              key={item.task.id}
              className="rounded-lg border p-3 space-y-2 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Link
                      href={`/tasks/${item.task.id}`}
                      className="font-medium text-sm hover:underline truncate"
                    >
                      {item.task.title}
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {item.impactScore.oneLineWhy}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 font-mono">
                  {Math.round(item.impactScore.score)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <form action={completeTask.bind(null, item.task.id)}>
                  <Button type="submit" size="sm" variant="default">
                    Done
                  </Button>
                </form>
                <form action={deferTask.bind(null, item.task.id)}>
                  <Button type="submit" size="sm" variant="outline">
                    Snooze
                  </Button>
                </form>
                <LinkButton href={`/tasks/${item.task.id}`} size="sm" variant="ghost">
                  Why?
                </LinkButton>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
