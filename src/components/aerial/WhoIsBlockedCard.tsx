import { GitBranch } from "lucide-react";
import type { BlockerItem } from "@/application/services/aerial-view.service";
import { LinkButton } from "@/components/shared/LinkButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/design-system/SectionCard";
import { StatusLabel } from "@/components/design-system/StatusLabel";

interface WhoIsBlockedCardProps {
  blockingMe: BlockerItem[];
  imBlocking: BlockerItem[];
}

function formatBlockedMeta(item: BlockerItem): string {
  const parts: string[] = [item.otherPartyName];
  parts.push(`blocked ${item.daysBlocked}d`);
  if (item.daysOverdue != null && item.daysOverdue > 0) {
    parts.push(`${item.daysOverdue}d overdue`);
  }
  return parts.join(" · ");
}

function BlockerList({
  title,
  items,
  emptyTitle,
  emptyDescription,
  direction,
}: {
  title: string;
  items: BlockerItem[];
  emptyTitle: string;
  emptyDescription: string;
  direction: "blocking_me" | "im_blocking";
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium flex items-center gap-2">
        {title}
        {items.length > 0 && (
          <StatusLabel variant="warning">{items.length} active</StatusLabel>
        )}
      </h3>
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} className="p-4" />
      ) : (
        <ul className="space-y-2" aria-label={title}>
          {items.map((item) => (
            <li
              key={item.dependency.id}
              className="text-sm rounded-md border border-border bg-background p-3 space-y-2"
            >
              <div>
                <p className="font-medium">{item.taskTitle}</p>
                <p className="wr-metadata mt-0.5">{formatBlockedMeta(item)}</p>
              </div>
              {direction === "blocking_me" && item.narrative && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-primary hover:underline list-none">
                    Why am I blocked?
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground pl-0">
                    {item.narrative}
                  </p>
                </details>
              )}
              {item.chain.nodes.length > 1 && (
                <LinkButton href="/blockers" variant="ghost" size="sm" className="h-7 px-2">
                  View chain
                </LinkButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WhoIsBlockedCard({ blockingMe, imBlocking }: WhoIsBlockedCardProps) {
  const total = blockingMe.length + imBlocking.length;

  return (
    <SectionCard
      id="who-is-blocked"
      title="Who is blocked"
      description="Dependency relationships across teams"
      icon={<GitBranch className="h-4 w-4" />}
    >
      {total === 0 ? (
        <EmptyState
          title="No blockers"
          description="You're not currently blocked by another task."
        />
      ) : (
        <div className="space-y-5">
          <BlockerList
            title="I am blocked by"
            items={blockingMe}
            emptyTitle="No one is blocking you"
            emptyDescription="No upstream dependencies are holding up your work."
            direction="blocking_me"
          />
          <BlockerList
            title="I am blocking"
            items={imBlocking}
            emptyTitle="No one is waiting on you"
            emptyDescription="You're not blocking anyone else's work."
            direction="im_blocking"
          />
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-border/60">
        <LinkButton href="/blockers" variant="outline" size="sm" className="w-full">
          Open Blocker Radar
        </LinkButton>
      </div>
    </SectionCard>
  );
}
