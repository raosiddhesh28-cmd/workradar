import { notFound } from "next/navigation";
import { getGraphStore } from "@/infrastructure/store";
import { LinkButton } from "@/components/shared/LinkButton";
import { Badge } from "@/components/ui/badge";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getGraphStore();
  const person = store.getPerson(id);
  if (!person) notFound();

  const teams = store.getTeams();
  const team = teams.find((t) => t.id === person.teamId);
  const openTasks = store
    .getGraph()
    .tasks.filter(
      (t) =>
        t.ownerId === person.id &&
        (t.status === "open" || t.status === "in_progress"),
    );

  return (
    <main className="mx-auto max-w-3xl w-full px-4 py-8 space-y-6">
      <LinkButton href="/aerial" variant="ghost" size="sm">
        ← Back to aerial view
      </LinkButton>

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {person.role}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold">{person.name}</h1>
        <p className="text-sm text-muted-foreground">
          {person.title} · {team?.name ?? "Unknown team"}
        </p>
      </header>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-medium">Open work</h2>
        {openTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open tasks assigned.</p>
        ) : (
          <ul className="space-y-2">
            {openTasks.map((task) => (
              <li key={task.id}>
                <LinkButton href={`/tasks/${task.id}`} variant="link" className="h-auto p-0 text-sm">
                  {task.title}
                </LinkButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
