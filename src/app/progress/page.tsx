import { notFound } from "next/navigation";
import { getProgressSummary } from "@/application/progress/progress.service";
import { getCurrentPerson } from "@/infrastructure/session/mock-session";
import { ProgressView } from "@/components/progress/ProgressView";
import { ScopeSwitcher } from "@/components/shared/ScopeSwitcher";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";
import type { TaskListScope } from "@/domain/tasks/scope";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const person = await getCurrentPerson();
  const params = await searchParams;
  const scopeParam = params.scope;
  const requestedScope =
    typeof scopeParam === "string" ? (scopeParam as TaskListScope) : undefined;
  const summary = getProgressSummary(person.id, requestedScope);
  if (!summary) notFound();

  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-8 space-y-6">
      <header className="space-y-3 border-b pb-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Progress</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {summary.scopeLabel}
          </h1>
          <p className="text-sm text-muted-foreground">
            Transparent task-count progress — not a productivity score
          </p>
        </div>
        <PersonaSwitcher currentPersonId={person.id} />
        <ScopeSwitcher
          basePath="/progress"
          currentScope={summary.scope}
          canChangeScope={person.role !== "ic"}
        />
      </header>

      <ProgressView summary={summary} />
    </main>
  );
}
