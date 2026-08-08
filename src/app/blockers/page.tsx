import { getBlockerRadar } from "@/application/services/aerial-view.service";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { LinkButton } from "@/components/shared/LinkButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BlockersPage() {
  const personId = await getCurrentPersonId();
  const radar = getBlockerRadar(personId);

  const Section = ({
    title,
    items,
    empty,
  }: {
    title: string;
    items: typeof radar.blockingMe;
    empty: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((item) => (
            <div key={item.dependency.id} className="rounded-lg border p-4 space-y-1">
              <p className="font-medium">{item.taskTitle}</p>
              <p className="text-sm text-muted-foreground">
                {item.otherPartyName} · blocked {item.daysBlocked} day
                {item.daysBlocked === 1 ? "" : "s"}
              </p>
              <p className="text-sm">{item.dependency.description}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <main className="mx-auto max-w-4xl w-full px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blocker Radar</h1>
          <p className="text-muted-foreground text-sm">
            {radar.personName} — who is waiting on whom
          </p>
        </div>
        <LinkButton href="/aerial" variant="outline">
          ← Aerial view
        </LinkButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
    </main>
  );
}
