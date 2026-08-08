import { LinkButton } from "@/components/shared/LinkButton";
import type { TaskListScope } from "@/domain/tasks/scope";

interface ScopeSwitcherProps {
  basePath: "/timeline" | "/progress";
  currentScope: TaskListScope;
  canChangeScope: boolean;
}

export function ScopeSwitcher({
  basePath,
  currentScope,
  canChangeScope,
}: ScopeSwitcherProps) {
  if (!canChangeScope) return null;

  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {(["mine", "team", "organization"] as const).map((scope) => (
        <LinkButton
          key={scope}
          href={`${basePath}?scope=${scope}`}
          variant={currentScope === scope ? "default" : "outline"}
          size="sm"
        >
          {scope === "mine"
            ? "My work"
            : scope === "team"
              ? "Team"
              : "Organization"}
        </LinkButton>
      ))}
    </div>
  );
}
