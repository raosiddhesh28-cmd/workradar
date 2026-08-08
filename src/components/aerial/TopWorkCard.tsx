import Link from "next/link";
import { Button } from "@/components/ui/button";
import { completeTask, deferTask } from "@/app/actions";
import type { TopWorkItem } from "@/application/services/aerial-view.service";
import { LinkButton } from "@/components/shared/LinkButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/design-system/SectionCard";
import { ImpactScoreBadge } from "@/components/design-system/ImpactScoreBadge";
import { Target } from "lucide-react";

interface TopWorkCardProps {
  items: TopWorkItem[];
}

export function TopWorkCard({ items }: TopWorkCardProps) {
  return (
    <SectionCard
      id="top-work"
      variant="impact"
      title="Top Work"
      description="Ranked by organizational impact — the system decides what matters most"
      icon={<Target className="h-4 w-4" />}
    >
      {items.length === 0 ? (
        <EmptyState
          title="No open work"
          description="You're clear for now — no ranked tasks in your queue."
        />
      ) : (
        <ol className="space-y-3" aria-label="Top work ranked by impact">
          {items.map((item, index) => (
            <li
              key={item.task.id}
              className="rounded-lg border border-border/80 bg-background p-4 space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-mono font-semibold text-muted-foreground"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/tasks/${item.task.id}`}
                        className="font-medium text-base hover:text-primary hover:underline leading-snug"
                      >
                        {item.task.title}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        <span className="font-medium text-foreground/80">
                          Why this matters:{" "}
                        </span>
                        {item.impactScore.oneLineWhy}
                      </p>
                    </div>
                    <ImpactScoreBadge score={item.impactScore.score} />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <form action={completeTask.bind(null, item.task.id)}>
                      <Button type="submit" size="sm">
                        Mark done
                      </Button>
                    </form>
                    <form action={deferTask.bind(null, item.task.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Snooze
                      </Button>
                    </form>
                    <LinkButton
                      href={`/tasks/${item.task.id}`}
                      size="sm"
                      variant="ghost"
                    >
                      View impact
                    </LinkButton>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
