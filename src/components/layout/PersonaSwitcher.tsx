import { switchPersona } from "@/app/actions";
import { DEMO_PERSONAS } from "@/infrastructure/seed/people";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/LinkButton";

interface PersonaSwitcherProps {
  currentPersonId: string;
}

export function PersonaSwitcher({ currentPersonId }: PersonaSwitcherProps) {
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
      <LinkButton href="/team" size="sm" variant="ghost">
        Team view
      </LinkButton>
      <LinkButton href="/organization" size="sm" variant="ghost">
        Organization
      </LinkButton>
    </div>
  );
}
