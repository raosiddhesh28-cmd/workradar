import { notFound, redirect } from "next/navigation";
import {
  canAccessOrganizationalView,
  getOrganizationalView,
} from "@/application/organization/organizational-view.service";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { NOW } from "@/infrastructure/seed/teams";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";
import { FreshnessIndicator } from "@/components/layout/FreshnessIndicator";
import { LinkButton } from "@/components/shared/LinkButton";
import { OrganizationalAttentionCard } from "@/components/organization/OrganizationalAttentionCard";
import { TopOrganizationalImpactCard } from "@/components/organization/TopOrganizationalImpactCard";
import { CrossTeamDependenciesCard } from "@/components/organization/CrossTeamDependenciesCard";
import { GoalHealthCard } from "@/components/organization/GoalHealthCard";

export default async function OrganizationPage() {
  const personId = await getCurrentPersonId();

  if (!canAccessOrganizationalView(personId)) {
    redirect("/aerial");
  }

  const view = getOrganizationalView(personId, NOW);
  if (!view) notFound();

  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-8 space-y-6">
      <header className="space-y-3 border-b pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Organizational Aerial View
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {view.scopeMode === "executive" ? "Organization" : "Team & Cross-Team"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {view.scopeLabel} · {view.viewerName}
            </p>
          </div>
          <FreshnessIndicator lastUpdated={view.lastUpdated} />
        </div>
        <PersonaSwitcher currentPersonId={personId} />
        {view.briefing && (
          <p className="text-sm leading-relaxed rounded-lg border bg-muted/30 p-3">
            {view.briefing}
          </p>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <OrganizationalAttentionCard items={view.attention} />
        <TopOrganizationalImpactCard items={view.topImpact} />
        <CrossTeamDependenciesCard items={view.crossTeamDependencies} />
        <GoalHealthCard items={view.goalHealth} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <LinkButton href="/aerial" variant="outline" size="sm">
          ← IC Aerial View
        </LinkButton>
        {view.scopeMode === "manager" && (
          <LinkButton href="/team" variant="outline" size="sm">
            Team Rollup
          </LinkButton>
        )}
      </div>
    </main>
  );
}
