import { LinkButton } from "@/components/shared/LinkButton";
import { notFound } from "next/navigation";
import { getTaskBlockerContext } from "@/application/services/aerial-view.service";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { getGoalPath } from "@/domain/graph/impact-graph";
import { getGraphStore } from "@/infrastructure/store";
import { DEMO_PERSONAS } from "@/infrastructure/seed/people";
import { ImpactExplanation } from "@/components/impact/ImpactExplanation";
import { BlockerChainView } from "@/components/blockers/BlockerChainView";
import { AssignTaskPanel } from "@/components/tasks/AssignTaskPanel";
import { FlagBlockerPanel } from "@/components/tasks/FlagBlockerPanel";
import { DueDateBadge } from "@/components/scheduling/DueDateBadge";
import { classifyDueDate, formatDueDateLong } from "@/domain/scheduling/due-date";
import { NOW } from "@/infrastructure/seed/teams";
import { Button } from "@/components/ui/button";
import { completeTask, deferTask } from "@/app/actions";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SectionCard } from "@/components/design-system/SectionCard";
import { StatusLabel } from "@/components/design-system/StatusLabel";
import { ImpactScoreBadge } from "@/components/design-system/ImpactScoreBadge";

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
  const store = getGraphStore();
  const goalPath = getGoalPath(store.getGraph(), task.linkedGoalId);
  const assignee = store.getPerson(task.ownerId);
  const assignCandidates = DEMO_PERSONAS.map((p) => ({
    id: p.id,
    name: store.getPerson(p.id)?.name ?? p.label.split(" — ")[0] ?? p.id,
  }));
  const dueDate = classifyDueDate(
    task.dueDate,
    task.completedAt,
    task.status,
    NOW,
  );

  return (
    <main id="main-content" className="wr-page-narrow space-y-6">
      <LinkButton href="/aerial" variant="ghost" size="sm">
        ← Back to aerial view
      </LinkButton>

      <PageHeader
        eyebrow={task.sourceSystem}
        title={task.title}
        description={task.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusLabel variant="neutral">{task.status.replace("_", " ")}</StatusLabel>
            <ImpactScoreBadge score={impactScore.score} size="sm" />
          </div>
        }
      />

      <div className="grid gap-6">
        <SectionCard title="Impact evidence" description="Deterministic ranking explanation">
          <ImpactExplanation
            breakdown={impactScore.componentBreakdown}
            oneLineWhy={impactScore.oneLineWhy}
            score={impactScore.score}
          />
        </SectionCard>

        <div className="grid gap-6 sm:grid-cols-2">
          <SectionCard title="Schedule">
            <DueDateBadge classification={dueDate} />
            <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
              {task.startDate && (
                <div>
                  <dt className="inline font-medium text-foreground">Start: </dt>
                  <dd className="inline">{formatDueDateLong(task.startDate)}</dd>
                </div>
              )}
              {task.dueDate && (
                <div>
                  <dt className="inline font-medium text-foreground">Due: </dt>
                  <dd className="inline">{formatDueDateLong(task.dueDate)}</dd>
                </div>
              )}
              {task.completedAt && (
                <div>
                  <dt className="inline font-medium text-foreground">Completed: </dt>
                  <dd className="inline">{formatDueDateLong(task.completedAt)}</dd>
                </div>
              )}
            </dl>
          </SectionCard>

          <div className="space-y-6">
            <AssignTaskPanel
              taskId={task.id}
              currentAssigneeId={task.ownerId}
              currentAssigneeName={assignee?.name ?? "Unassigned"}
              candidates={assignCandidates}
            />
            <FlagBlockerPanel taskId={task.id} taskTitle={task.title} />
          </div>
        </div>

        {blockerChains.length > 0 && (
          <SectionCard
            title="Blocking chain"
            description="Upstream dependencies from the impact graph"
          >
            {blockerChains.map(({ dependency, chain, narrative }) => (
              <div
                key={dependency.id}
                className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0"
              >
                {narrative && (
                  <p className="text-sm leading-relaxed">{narrative}</p>
                )}
                <BlockerChainView chain={chain} compact />
              </div>
            ))}
          </SectionCard>
        )}

        {goalPath.length > 0 && (
          <SectionCard title="Organizational path" description="Goal alignment chain">
            <ol className="flex flex-wrap gap-2 text-sm">
              {goalPath.map((g, i) => (
                <li key={g.id} className="flex items-center gap-2">
                  {i > 0 && (
                    <span className="text-muted-foreground" aria-hidden>
                      →
                    </span>
                  )}
                  <LinkButton
                    href={`/goals/${g.id}`}
                    variant="link"
                    className="h-auto p-0"
                  >
                    <span className="flex items-center gap-2">
                      {g.title}
                      {g.healthStatus !== "on_track" && (
                        <StatusLabel variant="warning">
                          {g.healthStatus.replace("_", " ")}
                        </StatusLabel>
                      )}
                    </span>
                  </LinkButton>
                </li>
              ))}
            </ol>
          </SectionCard>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <form action={completeTask.bind(null, task.id)}>
            <Button type="submit">Mark done</Button>
          </form>
          <form action={deferTask.bind(null, task.id)}>
            <Button type="submit" variant="outline">
              Snooze / defer
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
