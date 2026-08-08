import { getBlockerRadar } from "@/application/services/aerial-view.service";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { LinkButton } from "@/components/shared/LinkButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockerChainView } from "@/components/blockers/BlockerChainView";
import { EmptyState } from "@/components/shared/EmptyState";
import type { BlockerItem } from "@/application/services/aerial-view.service";

function formatBlockedMeta(item: BlockerItem): string {
  const parts: string[] = [];
  if (item.blockedPersonName && item.direction === "im_blocking") {
    parts.push(item.blockedPersonName);
  } else {
    parts.push(item.otherPartyName);
  }
  parts.push(`blocked ${item.daysBlocked} day${item.daysBlocked === 1 ? "" : "s"}`);
  if (item.daysOverdue != null && item.daysOverdue > 0) {
    parts.push(
      `${item.daysOverdue} day${item.daysOverdue === 1 ? "" : "s"} overdue`,
    );
  }
  return parts.join(" · ");
}

export default async function BlockersPage() {
  const personId = await getCurrentPersonId();
  const radar = await getBlockerRadar(personId);

  const Section = ({
    title,
    items,
    empty,
  }: {
    title: string;
    items: BlockerItem[];
    empty: string;
  }) => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <EmptyState
          title="No blockers"
          description={empty}
          className="bg-card"
        />
      ) : (
        items.map((item) => (
          <Card key={item.dependency.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.taskTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatBlockedMeta(item)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.narrative && (
                <p className="text-sm leading-relaxed">{item.narrative}</p>
              )}
              <BlockerChainView chain={item.chain} />
              <p className="text-xs text-muted-foreground border-t pt-2">
                {item.dependency.description}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <main className="mx-auto max-w-4xl w-full px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blocker Radar</h1>
          <p className="text-muted-foreground text-sm">
            {radar.personName} — dependency chains and upstream blockers
          </p>
        </div>
        <LinkButton href="/aerial" variant="outline">
          ← Aerial view
        </LinkButton>
      </div>

      <Section
        title="Blocking me"
        items={radar.blockingMe}
        empty="No one is blocking you."
      />
      <Section
        title="I'm blocking"
        items={radar.imBlocking}
        empty="You're not blocking anyone — nice."
      />
    </main>
  );
}
