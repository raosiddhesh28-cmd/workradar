import { switchPersona } from "@/app/actions";
import { DEMO_PERSONAS } from "@/infrastructure/seed/people";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/LinkButton";
import type { PersonaRole } from "@/domain/types";

interface PersonaSwitcherProps {
  currentPersonId: string;
  currentRole: PersonaRole;
}

export function PersonaSwitcher({
  currentPersonId,
  currentRole,
}: PersonaSwitcherProps) {
  const showTeam = currentRole === "manager" || currentRole === "executive";
  const showOrganization = currentRole === "manager" || currentRole === "executive";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">View as:</span>
      {DEMO_PERSONAS.map((persona) => (
        <form key={persona.id} action={switchPersona.bind(null, persona.id)}>
          <Button
            type="submit"
            size="sm"
            variant={currentPersonId === persona.id ? "default" : "outline"}
          >
            {persona.label}
          </Button>
        </form>
      ))}
      {showTeam && (
        <LinkButton href="/team" size="sm" variant="ghost">
          Team view
        </LinkButton>
      )}
      {showOrganization && (
        <LinkButton href="/organization" size="sm" variant="ghost">
          Organization
        </LinkButton>
      )}
    </div>
  );
}
