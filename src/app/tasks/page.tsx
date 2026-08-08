import { notFound } from "next/navigation";
import {
  getTaskList,
  parseTaskListFilters,
} from "@/application/tasks/task-list.service";
import { getCurrentPerson } from "@/infrastructure/session/mock-session";
import { TaskListTable } from "@/components/tasks/TaskListTable";
import { TaskListFiltersBar } from "@/components/tasks/TaskListFiltersBar";
import type { TaskListScope } from "@/domain/tasks/scope";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const person = await getCurrentPerson();
  const params = await searchParams;
  const scopeParam = params.scope;
  const requestedScope =
    typeof scopeParam === "string" ? (scopeParam as TaskListScope) : undefined;
  const filters = parseTaskListFilters(params);
  const data = getTaskList(person.id, requestedScope, filters);
  if (!data) notFound();

  const flatParams: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    flatParams[key] = typeof value === "string" ? value : undefined;
  }

  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-8 space-y-6">
      <header className="space-y-3 border-b pb-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Task lists</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.scopeLabel}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.items.length} task{data.items.length === 1 ? "" : "s"}
          </p>
        </div>
        <PersonaSwitcher
          currentPersonId={person.id}
          currentRole={person.role}
        />
      </header>

      <TaskListFiltersBar
        data={data}
        currentScope={data.scope}
        searchParams={flatParams}
        canChangeScope={person.role !== "ic"}
      />

      <TaskListTable items={data.items} />
    </main>
  );
}
