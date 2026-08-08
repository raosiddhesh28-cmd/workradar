import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { LinkButton } from "@/components/shared/LinkButton";
import { getCurrentPerson } from "@/infrastructure/session/mock-session";

const NAV_ITEMS = [
  { href: "/aerial", label: "Aerial" },
  { href: "/tasks", label: "Tasks" },
  { href: "/timeline", label: "Timeline" },
  { href: "/progress", label: "Progress" },
  { href: "/blockers", label: "Blockers" },
] as const;

export async function AppHeader() {
  const person = await getCurrentPerson();
  const isManager = person.role === "manager";
  const isExecutive = person.role === "executive";
  const showTeam = isManager || isExecutive;
  const showOrganization = isManager || isExecutive;

  const navItems = [
    ...NAV_ITEMS,
    ...(showTeam ? [{ href: "/team" as const, label: "Team" }] : []),
    ...(showOrganization
      ? [{ href: "/organization" as const, label: "Organization" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-6xl w-full px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/aerial"
              className="text-sm font-semibold tracking-tight shrink-0 text-foreground hover:text-primary transition-colors"
            >
              WorkRadar
            </Link>
            <span className="hidden sm:inline wr-metadata border-l border-border pl-3">
              Impact intelligence
            </span>
          </div>
          <SearchBar />
        </div>

        <nav
          className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <LinkButton
              key={item.href}
              href={item.href}
              variant="ghost"
              size="sm"
              className="shrink-0"
            >
              {item.label}
            </LinkButton>
          ))}
        </nav>
      </div>
    </header>
  );
}
