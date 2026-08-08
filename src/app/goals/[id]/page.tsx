import { notFound } from "next/navigation";
import { getGraphStore } from "@/infrastructure/store";
import { LinkButton } from "@/components/shared/LinkButton";
import { Badge } from "@/components/ui/badge";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getGraphStore();
  const goal = store.getGoal(id);
  if (!goal) notFound();

  const graph = store.getGraph();
  const owner = store.getPerson(goal.ownerId);
  const linkedTasks = graph.tasks.filter((t) => t.linkedGoalId === goal.id);

  return (
    <main className="mx-auto max-w-3xl w-full px-4 py-8 space-y-6">
      <LinkButton href="/aerial" variant="ghost" size="sm">
        ← Back to aerial view
      </LinkButton>

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {goal.level}
          </Badge>
          <Badge
            variant={goal.healthStatus === "on_track" ? "secondary" : "outline"}
            className="capitalize"
          >
            {goal.healthStatus.replace("_", " ")}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold">{goal.title}</h1>
        {owner && (
          <p className="text-sm text-muted-foreground">Owner: {owner.name}</p>
        )}
      </header>

      {linkedTasks.length > 0 && (
        <section className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-medium">Linked tasks</h2>
          <ul className="space-y-2">
            {linkedTasks.map((task) => (
              <li key={task.id}>
                <LinkButton href={`/tasks/${task.id}`} variant="link" className="h-auto p-0 text-sm">
                  {task.title}
                </LinkButton>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
