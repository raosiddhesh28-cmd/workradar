import Link from "next/link";
import { getSearchResults } from "@/application/search";
import { EmptyState } from "@/components/shared/EmptyState";
import { LinkButton } from "@/components/shared/LinkButton";
import { Badge } from "@/components/ui/badge";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? getSearchResults(query) : null;
  const hasResults =
    results &&
    (results.tasks.length > 0 ||
      results.people.length > 0 ||
      results.goals.length > 0);

  return (
    <main className="mx-auto max-w-3xl w-full px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Search</h1>
        {query ? (
          <p className="text-sm text-muted-foreground">
            Results for &ldquo;{query}&rdquo;
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Search tasks, people, and goals across WorkRadar.
          </p>
        )}
      </div>

      {!query && (
        <EmptyState
          title="Search WorkRadar"
          description="Enter a task name, person, or goal in the search bar above."
        />
      )}

      {query && !hasResults && (
        <EmptyState
          title="No results found"
          description="Try searching for a task, person, or goal."
        />
      )}

      {hasResults && results && (
        <div className="space-y-8">
          {results.tasks.length > 0 && (
            <ResultSection title="Tasks">
              {results.tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="block rounded-lg border p-4 hover:bg-muted/40 transition-colors"
                  >
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {task.assigneeName} · {task.teamName}
                    </p>
                  </Link>
                </li>
              ))}
            </ResultSection>
          )}

          {results.goals.length > 0 && (
            <ResultSection title="Goals">
              {results.goals.map((goal) => (
                <li key={goal.id}>
                  <Link
                    href={`/goals/${goal.id}`}
                    className="block rounded-lg border p-4 hover:bg-muted/40 transition-colors"
                  >
                    <p className="font-medium text-sm">{goal.title}</p>
                    <Badge variant="outline" className="mt-1 capitalize text-xs">
                      {goal.healthStatus}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ResultSection>
          )}

          {results.people.length > 0 && (
            <ResultSection title="People">
              {results.people.map((person) => (
                <li key={person.id}>
                  <Link
                    href={`/people/${person.id}`}
                    className="block rounded-lg border p-4 hover:bg-muted/40 transition-colors"
                  >
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {person.title} · {person.teamName}
                    </p>
                  </Link>
                </li>
              ))}
            </ResultSection>
          )}
        </div>
      )}

      <LinkButton href="/aerial" variant="outline" size="sm">
        ← Back to aerial view
      </LinkButton>
    </main>
  );
}
