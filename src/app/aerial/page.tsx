import { getAerialView } from "@/application/services/aerial-view.service";
import { getGroundedWhatHappenedDigest } from "@/application/digest";
import { getCurrentPerson } from "@/infrastructure/session/mock-session";
import { NOW } from "@/infrastructure/seed/teams";
import { TopWorkCard } from "@/components/aerial/TopWorkCard";
import { WhatHappenedCard } from "@/components/aerial/WhatHappenedCard";
import { NeedsAttentionCard } from "@/components/aerial/NeedsAttentionCard";
import { WhoIsBlockedCard } from "@/components/aerial/WhoIsBlockedCard";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";
import { FreshnessIndicator } from "@/components/layout/FreshnessIndicator";
import { PageHeader } from "@/components/design-system/PageHeader";

export default async function AerialPage() {
  const person = await getCurrentPerson();
  const aerial = await getAerialView(person.id, NOW);
  const whatHappenedDigest = await getGroundedWhatHappenedDigest(person.id, NOW);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main id="main-content" className="wr-page space-y-8">
      <PageHeader
        eyebrow="Organizational aerial view"
        title={`Good morning, ${person.name.split(" ")[0]}`}
        description={today}
        meta={<FreshnessIndicator lastUpdated={aerial.lastUpdated} />}
      >
        <PersonaSwitcher
          currentPersonId={person.id}
          currentRole={person.role}
        />
      </PageHeader>

      <div className="space-y-6">
        <TopWorkCard items={aerial.topWork} />

        <div className="grid gap-6 lg:grid-cols-2">
          <NeedsAttentionCard items={aerial.needsAttention} />
          <WhoIsBlockedCard
            blockingMe={aerial.whoIsBlocked.blockingMe}
            imBlocking={aerial.whoIsBlocked.imBlocking}
          />
        </div>

        <WhatHappenedCard digest={whatHappenedDigest} />
      </div>
    </main>
  );
}
