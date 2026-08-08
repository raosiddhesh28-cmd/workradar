import { getAerialView } from "@/application/services/aerial-view.service";
import { getCurrentPerson, getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { TopWorkCard } from "@/components/aerial/TopWorkCard";
import { WhatHappenedCard } from "@/components/aerial/WhatHappenedCard";
import { NeedsAttentionCard } from "@/components/aerial/NeedsAttentionCard";
import { WhoIsBlockedCard } from "@/components/aerial/WhoIsBlockedCard";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";
import { FreshnessIndicator } from "@/components/layout/FreshnessIndicator";

export default async function AerialPage() {
  const personId = await getCurrentPersonId();
  const person = await getCurrentPerson();
  const aerial = getAerialView(personId);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-8 space-y-6">
      <header className="space-y-3 border-b pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">WorkRadar</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Good morning, {person.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
          <FreshnessIndicator lastUpdated={aerial.lastUpdated} />
        </div>
        <PersonaSwitcher currentPersonId={personId} />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <TopWorkCard items={aerial.topWork} />
        <WhatHappenedCard items={aerial.whatHappened} />
        <NeedsAttentionCard items={aerial.needsAttention} />
        <WhoIsBlockedCard
          blockingMe={aerial.whoIsBlocked.blockingMe}
          imBlocking={aerial.whoIsBlocked.imBlocking}
        />
      </div>
    </main>
  );
}
