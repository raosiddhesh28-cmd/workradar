import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BlockerItem } from "@/application/services/aerial-view.service";
import { LinkButton } from "@/components/shared/LinkButton";

interface WhoIsBlockedCardProps {
  blockingMe: BlockerItem[];
  imBlocking: BlockerItem[];
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
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.dependency.id}
              className="text-sm rounded-md border p-2 space-y-0.5"
            >
              <p className="font-medium">{item.taskTitle}</p>
              <p className="text-muted-foreground">
                {item.otherPartyName} · {item.daysBlocked}d blocked
              </p>
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
