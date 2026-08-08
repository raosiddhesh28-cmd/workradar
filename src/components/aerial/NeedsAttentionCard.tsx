import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { AttentionItem } from "@/application/services/aerial-view.service";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/design-system/SectionCard";
import { StatusLabel } from "@/components/design-system/StatusLabel";

interface NeedsAttentionCardProps {
  items: AttentionItem[];
}

export function NeedsAttentionCard({ items }: NeedsAttentionCardProps) {
  return (
    <SectionCard
      id="needs-attention"
      variant="attention"
      title="Needs attention"
      description="Urgent signals where cost-of-delay is compounding"
      icon={<AlertTriangle className="h-4 w-4 text-warning-foreground" />}
    >
      {items.length === 0 ? (
        <EmptyState
          title="Nothing requires immediate attention"
          description="You're all clear for now."
        />
      ) : (
        <ul className="space-y-3" aria-label="Items needing attention">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-warning/25 bg-background p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusLabel variant={item.severity === "high" ? "critical" : "warning"}>
                  {item.severity === "high" ? "High urgency" : "Medium urgency"}
                </StatusLabel>
                {item.type === "goal" && (
                  <StatusLabel variant="warning">Goal at risk</StatusLabel>
                )}
                <span className="wr-metadata uppercase">{item.type}</span>
              </div>
              <Link
                href={
                  item.type === "task"
                    ? `/tasks/${item.entityId}`
                    : `/goals/${item.entityId}`
                }
                className="font-medium text-sm hover:text-primary hover:underline block"
              >
                {item.title}
              </Link>
              <p className="text-sm text-muted-foreground">{item.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
