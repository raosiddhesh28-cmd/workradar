import { notFound } from "next/navigation";
import { getTeamRollup } from "@/application/services/aerial-view.service";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { LinkButton } from "@/components/shared/LinkButton";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SectionCard } from "@/components/design-system/SectionCard";
import { StatusLabel } from "@/components/design-system/StatusLabel";

export default async function TeamPage() {
  const personId = await getCurrentPersonId();
  const rollup = await getTeamRollup(personId);
  if (!rollup) notFound();

  return (
    <main id="main-content" className="wr-page space-y-8">
      <PageHeader
        eyebrow="Manager view"
        title="Team health"
        description={`${rollup.manager.name} — highest-impact work and blockers without a status meeting`}
        actions={
          <LinkButton href="/aerial" variant="outline" size="sm">
            ← My aerial view
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rollup.reports.map((report) => (
          <SectionCard
            key={report.person.id}
            title={report.person.name}
            description={report.person.title}
          >
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="wr-metadata">Top work</dt>
                <dd className="font-medium">
                  {report.topTask ?? "None ranked"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <StatusLabel variant="neutral">
                  {report.topWorkCount} open tasks
                </StatusLabel>
                {report.hasBlocker && (
                  <StatusLabel variant="warning">
                    {report.blockerCount} blocker
                    {report.blockerCount === 1 ? "" : "s"}
                  </StatusLabel>
                )}
              </div>
            </dl>
          </SectionCard>
        ))}
      </div>

      {rollup.teamBlockers.length > 0 && (
        <SectionCard
          title="Team blockers"
          description="Cross-team dependencies affecting your reports"
        >
          <ul className="space-y-3">
            {rollup.teamBlockers.map((b) => (
              <li
                key={b.dependency.id}
                className="rounded-md border border-border bg-background p-4 space-y-2 text-sm"
              >
                <p className="font-medium">{b.taskTitle}</p>
                <p className="wr-metadata">
                  {b.blockedPersonName ?? b.otherPartyName} · {b.daysBlocked}d
                  blocked
                  {b.daysOverdue != null && b.daysOverdue > 0
                    ? ` · ${b.daysOverdue}d overdue`
                    : ""}
                </p>
                {b.narrative && (
                  <p className="leading-relaxed text-muted-foreground">
                    {b.narrative}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </main>
  );
}
