import Link from "next/link";
import { LinkButton } from "@/components/shared/LinkButton";
import type { TaskListDto } from "@/application/tasks/task-list.service";
import type { TaskListScope } from "@/domain/tasks/scope";

interface TaskListFiltersProps {
  data: TaskListDto;
  currentScope: TaskListScope;
  searchParams: Record<string, string | undefined>;
  canChangeScope: boolean;
}

function buildHref(
  scope: TaskListScope,
  params: Record<string, string | undefined>,
): string {
  const qs = new URLSearchParams();
  qs.set("scope", scope);
  for (const [key, value] of Object.entries(params)) {
    if (key === "scope" || !value) continue;
    qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `/tasks?${query}` : "/tasks";
}

export function TaskListFiltersBar({
  data,
  currentScope,
  searchParams,
  canChangeScope,
}: TaskListFiltersProps) {
  const filterParams = { ...searchParams };
  delete filterParams.scope;

  return (
    <div className="space-y-3">
      {canChangeScope && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Task scope">
          {(["mine", "team", "organization"] as const).map((scope) => (
            <LinkButton
              key={scope}
              href={buildHref(scope, searchParams)}
              variant={currentScope === scope ? "default" : "outline"}
              size="sm"
            >
              {scope === "mine"
                ? "My tasks"
                : scope === "team"
                  ? "Team"
                  : "Organization"}
            </LinkButton>
          ))}
        </div>
      )}

      <form className="flex flex-wrap gap-2 items-end" method="get">
        <input type="hidden" name="scope" value={currentScope} />
        <label className="text-xs space-y-1">
          <span className="text-muted-foreground">Assignee</span>
          <select
            name="assignee"
            defaultValue={searchParams.assignee ?? ""}
            className="block rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {data.availableAssignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs space-y-1">
          <span className="text-muted-foreground">Status</span>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="block rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
            <option value="deferred">Deferred</option>
          </select>
        </label>
        <label className="text-xs space-y-1">
          <span className="text-muted-foreground">Team</span>
          <select
            name="team"
            defaultValue={searchParams.team ?? ""}
            className="block rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {data.availableTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs space-y-1">
          <span className="text-muted-foreground">Goal</span>
          <select
            name="goal"
            defaultValue={searchParams.goal ?? ""}
            className="block rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {data.availableGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs space-y-1">
          <span className="text-muted-foreground">Due</span>
          <select
            name="due"
            defaultValue={searchParams.due ?? ""}
            className="block rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="overdue">Overdue</option>
            <option value="due_today">Due today</option>
            <option value="due_soon">Due soon</option>
            <option value="on_track">On track</option>
          </select>
        </label>
        <label className="text-xs flex items-center gap-2 pb-1.5">
          <input
            type="checkbox"
            name="blocked"
            value="true"
            defaultChecked={searchParams.blocked === "true"}
          />
          <span className="text-muted-foreground">Blocked only</span>
        </label>
        <label className="text-xs flex items-center gap-2 pb-1.5">
          <input
            type="checkbox"
            name="atRisk"
            value="true"
            defaultChecked={searchParams.atRisk === "true"}
          />
          <span className="text-muted-foreground">At-risk goal</span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm"
        >
          Apply
        </button>
        <Link
          href={`/tasks?scope=${currentScope}`}
          className="text-sm text-muted-foreground hover:underline pb-1.5"
        >
          Clear
        </Link>
      </form>
    </div>
  );
}
