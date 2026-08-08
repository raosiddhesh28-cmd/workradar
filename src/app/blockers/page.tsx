import { getBlockerRadar } from "@/application/services/aerial-view.service";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { BlockerChainView } from "@/components/blockers/BlockerChainView";
import { EmptyState } from "@/components/shared/EmptyState";
import { LinkButton } from "@/components/shared/LinkButton";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SectionCard } from "@/components/design-system/SectionCard";
import { StatusLabel } from "@/components/design-system/StatusLabel";
import type { BlockerItem } from "@/application/services/aerial-view.service";

function formatBlockedMeta(item: BlockerItem): string {
  const parts: string[] = [];
  if (item.blockedPersonName && item.direction === "im_blocking") {
    parts.push(item.blockedPersonName);
  } else {
    parts.push(item.otherPartyName);
  }
  parts.push(`${item.daysBlocked}d blocked`);
  if (item.daysOverdue != null && item.daysOverdue > 0) {
    parts.push(`${item.daysOverdue}d overdue`);
  }
  return parts.join(" · ");
}

function BlockerSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: BlockerItem[];
  empty: string;
}) {
  return (
    <section className="space-y-4" aria-labelledby={title.replace(/\s/g, "-")}>
      <h2 id={title.replace(/\s/g, "-")} className="text-lg font-semibold flex items-center gap-2">
        {title}
        {items.length > 0 && (
          <StatusLabel variant="warning">{items.length}</StatusLabel>
        )}
      </h2>
      {items.length === 0 ? (
        <EmptyState title="No blockers" description={empty} className="bg-card" />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <SectionCard
              key={item.dependency.id}
              title={item.taskTitle ?? "Unknown task"}
              description={formatBlockedMeta(item)}
            >
              {item.narrative && (
                <p className="text-sm leading-relaxed mb-4">{item.narrative}</p>
              )}
              <BlockerChainView chain={item.chain} />
              <p className="wr-metadata mt-4 pt-3 border-t border-border">
                {item.dependency.description}
              </p>
            </SectionCard>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function BlockersPage() {
  const personId = await getCurrentPersonId();
  const radar = await getBlockerRadar(personId);

  return (
    <main id="main-content" className="wr-page space-y-8">
      <PageHeader
        eyebrow="Dependency intelligence"
        title="Blocker Radar"
        description={`${radar.personName} — root causes and downstream impact`}
        actions={
          <LinkButton href="/aerial" variant="outline" size="sm">
            ← Aerial view
          </LinkButton>
        }
      />

      <BlockerSection
        title="I am blocked by"
        items={radar.blockingMe}
        empty="No one is blocking you."
      />
      <BlockerSection
        title="I am blocking"
        items={radar.imBlocking}
        empty="You're not blocking anyone."
      />
    </main>
  );
}
