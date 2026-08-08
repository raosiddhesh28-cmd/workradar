import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { LinkButton } from "@/components/shared/LinkButton";

export function AppHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl w-full px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/aerial" className="text-sm font-semibold tracking-tight shrink-0">
            WorkRadar
          </Link>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <LinkButton href="/aerial" variant="ghost" size="sm">
              Aerial
            </LinkButton>
            <LinkButton href="/blockers" variant="ghost" size="sm">
              Blockers
            </LinkButton>
            <LinkButton href="/team" variant="ghost" size="sm">
              Team
            </LinkButton>
            <LinkButton href="/organization" variant="ghost" size="sm">
              Organization
            </LinkButton>
          </nav>
        </div>
        <SearchBar />
      </div>
    </header>
  );
}
