import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: "default" | "attention" | "impact";
  children: ReactNode;
  className?: string;
  id?: string;
}

const variantStyles = {
  default: "border-border bg-card",
  attention: "border-warning/30 bg-warning/5",
  impact: "border-primary/20 bg-card ring-1 ring-primary/5",
};

export function SectionCard({
  title,
  description,
  icon,
  variant = "default",
  children,
  className,
  id,
}: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-lg border h-full flex flex-col",
        variantStyles[variant],
        className,
      )}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="px-5 pt-5 pb-3 border-b border-border/60">
        <div className="flex items-start gap-2">
          {icon && <span className="mt-0.5 text-muted-foreground" aria-hidden>{icon}</span>}
          <div>
            <h2
              id={id ? `${id}-title` : undefined}
              className="wr-section-title text-base"
            >
              {title}
            </h2>
            {description && (
              <p className="wr-metadata mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 flex-1">{children}</div>
    </section>
  );
}
