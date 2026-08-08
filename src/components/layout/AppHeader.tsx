import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { LinkButton } from "@/components/shared/LinkButton";
import { getCurrentPerson } from "@/infrastructure/session/mock-session";

export async function AppHeader() {
  const person = await getCurrentPerson();
  const isManager = person.role === "manager";
  const isExecutive = person.role === "executive";
  const showTeam = isManager || isExecutive;
  const showOrganization = isManager || isExecutive;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl w-full px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/aerial" className="text-sm font-semibold tracking-tight shrink-0">
            WorkRadar
          </Link>
          <nav className="hidden sm:flex items-center gap-1 text-sm" aria-label="Main">
            <LinkButton href="/aerial" variant="ghost" size="sm">
              Aerial
            </LinkButton>
            <LinkButton href="/tasks" variant="ghost" size="sm">
              Tasks
            </LinkButton>
            <LinkButton href="/timeline" variant="ghost" size="sm">
              Timeline
            </LinkButton>
            <LinkButton href="/progress" variant="ghost" size="sm">
              Progress
            </LinkButton>
            <LinkButton href="/blockers" variant="ghost" size="sm">
              Blockers
            </LinkButton>
            {showTeam && (
              <LinkButton href="/team" variant="ghost" size="sm">
                Team
              </LinkButton>
            )}
            {showOrganization && (
              <LinkButton href="/organization" variant="ghost" size="sm">
                Organization
              </LinkButton>
            )}
          </nav>
        </div>
        <SearchBar />
      </div>
    </header>
  );
}
