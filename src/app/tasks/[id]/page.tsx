import { LinkButton } from "@/components/shared/LinkButton";
import { notFound } from "next/navigation";
import { getTaskBlockerContext } from "@/application/services/aerial-view.service";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { getGoalPath } from "@/domain/graph/impact-graph";
import { getGraphStore } from "@/infrastructure/store";
import { ImpactExplanation } from "@/components/impact/ImpactExplanation";
import { BlockerChainView } from "@/components/blockers/BlockerChainView";
import { Button } from "@/components/ui/button";
import { completeTask, deferTask } from "@/app/actions";
import { Badge } from "@/components/ui/badge";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const personId = await getCurrentPersonId();
  const detail = await getTaskBlockerContext(id, personId);
  if (!detail) notFound();

  const { task, impactScore, blockerChains } = detail;
  const goalPath = getGoalPath(getGraphStore().getGraph(), task.linkedGoalId);

  return (
    <main className="mx-auto max-w-3xl w-full px-4 py-8 space-y-6">
      <LinkButton href="/aerial" variant="ghost" size="sm">
        ← Back to aerial view
      </LinkButton>

      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{task.sourceSystem}</Badge>
          <Badge variant="secondary">{task.status}</Badge>
        </div>
        <h1 className="text-2xl font-semibold">{task.title}</h1>
        <p className="text-muted-foreground">{task.description}</p>
      </header>

      {blockerChains.length > 0 && (
        <section className="rounded-lg border p-4 space-y-4">
          <h2 className="text-sm font-medium">Blocking chain</h2>
          {blockerChains.map(({ dependency, chain, narrative }) => (
            <div key={dependency.id} className="space-y-2 border-t first:border-t-0 pt-3 first:pt-0">
              {narrative && <p className="text-sm">{narrative}</p>}
              <BlockerChainView chain={chain} compact />
            </div>
          ))}
        </section>
      )}

      {goalPath.length > 0 && (
        <section className="rounded-lg border p-4 space-y-2">
          <h2 className="text-sm font-medium">Goal alignment path</h2>
          <ol className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {goalPath.map((g, i) => (
              <li key={g.id} className="flex items-center gap-2">
                {i > 0 && <span>→</span>}
                <span
                  className={
                    g.healthStatus !== "on_track" ? "text-amber-600 font-medium" : ""
                  }
                >
                  {g.title}
                </span>
              </li>
            ))}
          </ol>
          {!task.linkedGoalId && (
            <p className="text-sm text-amber-600">
              No linked goal — surfaced as data quality signal
            </p>
          )}
        </section>
      )}

      <section className="rounded-lg border p-4">
        <ImpactExplanation
          breakdown={impactScore.componentBreakdown}
          oneLineWhy={impactScore.oneLineWhy}
          score={impactScore.score}
        />
      </section>

      <div className="flex gap-2">
        <form action={completeTask.bind(null, task.id)}>
          <Button type="submit">Mark done</Button>
        </form>
        <form action={deferTask.bind(null, task.id)}>
          <Button type="submit" variant="outline">
            Snooze / defer
          </Button>
        </form>
      </div>
    </main>
  );
}
