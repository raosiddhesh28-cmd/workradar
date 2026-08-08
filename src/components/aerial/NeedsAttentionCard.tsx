import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { AttentionItem } from "@/application/services/aerial-view.service";
import { EmptyState } from "@/components/shared/EmptyState";

interface NeedsAttentionCardProps {
  items: AttentionItem[];
}

export function NeedsAttentionCard({ items }: NeedsAttentionCardProps) {
  return (
    <Card className="h-full border-amber-200/60 dark:border-amber-900/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
          Needs Immediate Attention
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cost-of-delay is compounding — kept intentionally short
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyState
            title="Nothing requires immediate attention"
            description="You're all clear for now."
          />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={item.severity === "high" ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {item.severity === "high" ? "High" : "Medium"} urgency
                </Badge>
                <span className="text-xs text-muted-foreground uppercase">
                  {item.type}
                </span>
              </div>
              <Link
                href={
                  item.type === "task"
                    ? `/tasks/${item.entityId}`
                    : `/goals/${item.entityId}`
                }
                className="font-medium text-sm hover:underline block"
              >
                {item.title}
              </Link>
              <p className="text-sm text-muted-foreground">{item.reason}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
