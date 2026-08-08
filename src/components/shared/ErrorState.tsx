import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-8 text-center space-y-3 max-w-md mx-auto",
        className,
      )}
      role="alert"
    >
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
