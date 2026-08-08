import { notFound } from "next/navigation";
import { getTimeline } from "@/application/timeline/timeline.service";
import { getCurrentPerson } from "@/infrastructure/session/mock-session";
import { TimelineView } from "@/components/timeline/TimelineView";
import { ScopeSwitcher } from "@/components/shared/ScopeSwitcher";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";
import type { TaskListScope } from "@/domain/tasks/scope";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const person = await getCurrentPerson();
  const params = await searchParams;
  const scopeParam = params.scope;
  const requestedScope =
    typeof scopeParam === "string" ? (scopeParam as TaskListScope) : undefined;
  const timeline = getTimeline(person.id, requestedScope);
  if (!timeline) notFound();

  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-8 space-y-6">
      <header className="space-y-3 border-b pb-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Timeline</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {timeline.scopeLabel}
          </h1>
          <p className="text-sm text-muted-foreground">
            Lightweight schedule view — start and due dates from task data
          </p>
        </div>
        <PersonaSwitcher
          currentPersonId={person.id}
          currentRole={person.role}
        />
        <ScopeSwitcher
          basePath="/timeline"
          currentScope={timeline.scope}
          canChangeScope={person.role !== "ic"}
        />
      </header>

      <TimelineView timeline={timeline} />
    </main>
  );
}
