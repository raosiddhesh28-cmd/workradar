import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BlockerItem } from "@/application/services/aerial-view.service";
import { LinkButton } from "@/components/shared/LinkButton";

interface WhoIsBlockedCardProps {
  blockingMe: BlockerItem[];
  imBlocking: BlockerItem[];
}

function formatBlockedMeta(item: BlockerItem): string {
  const parts: string[] = [item.otherPartyName];
  parts.push(`blocked for ${item.daysBlocked} day${item.daysBlocked === 1 ? "" : "s"}`);
  if (item.daysOverdue != null && item.daysOverdue > 0) {
    parts.push(
      `${item.daysOverdue} day${item.daysOverdue === 1 ? "" : "s"} overdue`,
    );
  }
  return parts.join(" · ");
}

function BlockerList({
  title,
  items,
  empty,
}: {
  title: string;
  items: BlockerItem[];
  empty: string;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.dependency.id}
              className="text-sm rounded-md border p-3 space-y-2"
            >
              <div>
                <p className="font-medium">{item.taskTitle}</p>
                <p className="text-muted-foreground">{formatBlockedMeta(item)}</p>
              </div>
              {item.direction === "blocking_me" && item.narrative && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Why?
                  </p>
                  <p className="text-sm leading-snug">{item.narrative}</p>
                </div>
              )}
              {item.chain.nodes.length > 1 && (
                <LinkButton href="/blockers" variant="ghost" size="sm" className="h-7 px-2">
                  View blocker chain
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Who Is Blocked</CardTitle>
        <p className="text-sm text-muted-foreground">
          Live dependency view across teams
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            You&apos;re not blocking anyone — nice.
          </p>
        ) : (
          <>
            <BlockerList
              title="Blocking me"
              items={blockingMe}
              empty="No one is blocking you."
            />
            <BlockerList
              title="I'm blocking"
              items={imBlocking}
              empty="No one is waiting on you."
            />
          </>
        )}
        <LinkButton href="/blockers" variant="outline" size="sm" className="w-full">
          Open Blocker Radar
        </LinkButton>
      </CardContent>
    </Card>
  );
}
