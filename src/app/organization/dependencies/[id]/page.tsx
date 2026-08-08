import { notFound, redirect } from "next/navigation";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { getGraphStore } from "@/infrastructure/store";
import { resolveOrganizationalScope } from "@/domain/organization/scope";
import { getCrossTeamDependencyById } from "@/domain/organization/cross-team-dependencies";
import { buildBlockerChainForDependency } from "@/domain/graph/blocker-chain";
import { explainBlockerChain } from "@/application/blocker/blocker-narrative.service";
import { canAccessOrganizationalView } from "@/application/organization/organizational-view.service";
import { BlockerChainView } from "@/components/blockers/BlockerChainView";
import { LinkButton } from "@/components/shared/LinkButton";
import { Badge } from "@/components/ui/badge";
import { NOW } from "@/infrastructure/seed/teams";

export default async function DependencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const personId = await getCurrentPersonId();
  if (!canAccessOrganizationalView(personId)) {
    redirect("/aerial");
  }

  const { id } = await params;
  const store = getGraphStore();
  const graph = store.getGraph();
  const scope = resolveOrganizationalScope(
    graph,
    personId,
    (mid) => store.getDirectReports(mid),
  );
  if (!scope) notFound();

  const dependencyView = getCrossTeamDependencyById(graph, scope, id);
  if (!dependencyView) notFound();

  const primaryDepId = dependencyView.dependencyIds[0];
  const dependency = primaryDepId
    ? graph.dependencies.find((d) => d.id === primaryDepId)
    : null;

  let narrative: string | null = null;
  let chain = null;
  if (dependency) {
    chain = buildBlockerChainForDependency(
      graph,
      dependency,
      "blocking_me",
      NOW,
    );
    try {
      const explained = await explainBlockerChain(dependency.id, personId, NOW);
      narrative = explained.narrative;
    } catch {
      narrative = null;
    }
  }

  return (
    <main className="mx-auto max-w-3xl w-full px-4 py-8 space-y-6">
      <LinkButton href="/organization" variant="ghost" size="sm">
        ← Organizational view
      </LinkButton>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{dependencyView.rootTaskTitle}</h1>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{dependencyView.statusLabel}</Badge>
          {dependencyView.goalTitle && (
            <Badge variant="secondary">Goal: {dependencyView.goalTitle}</Badge>
          )}
        </div>
      </header>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-medium">Cross-team chain</h2>
        <div className="font-mono text-sm space-y-1">
          {dependencyView.chain.map((node, index) => (
            <div key={node.taskId}>
              {index > 0 && (
                <span className="text-muted-foreground pl-2">↓ blocks</span>
              )}
              <p>
                <LinkButton
                  href={`/tasks/${node.taskId}`}
                  variant="link"
                  className="h-auto p-0 font-medium"
                >
                  {node.taskTitle}
                </LinkButton>
                <span className="text-muted-foreground text-xs ml-2">
                  {node.teamName} · {node.assigneeName}
                </span>
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Downstream: {dependencyView.downstreamTaskCount} tasks across{" "}
          {dependencyView.downstreamTeamNames.join(", ")}
        </p>
      </section>

      {narrative && (
        <section className="rounded-lg border p-4 space-y-2">
          <h2 className="text-sm font-medium">Why this matters</h2>
          <p className="text-sm leading-relaxed">{narrative}</p>
        </section>
      )}

      {chain && (
        <section className="rounded-lg border p-4 space-y-2">
          <h2 className="text-sm font-medium">Blocker chain detail</h2>
          <BlockerChainView chain={chain} />
        </section>
      )}

      <LinkButton href={`/tasks/${dependencyView.rootTaskId}`} variant="outline">
        View root task
      </LinkButton>
    </main>
  );
}
