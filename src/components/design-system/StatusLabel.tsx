import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusVariant = "critical" | "warning" | "info" | "success" | "neutral";

interface StatusLabelProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const config: Record<
  StatusVariant,
  { icon: typeof AlertTriangle; className: string }
> = {
  critical: {
    icon: ShieldAlert,
    className: "bg-critical/10 text-critical border-critical/25",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-warning/15 text-warning-foreground border-warning/30",
  },
  info: {
    icon: Info,
    className: "bg-info/10 text-info-foreground border-info/25",
  },
  success: {
    icon: Info,
    className: "bg-success/10 text-success-foreground border-success/25",
  },
  neutral: {
    icon: Info,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusLabel({ variant, children, className }: StatusLabelProps) {
  const { icon: Icon, className: variantClass } = config[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClass,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {children}
    </span>
  );
}
