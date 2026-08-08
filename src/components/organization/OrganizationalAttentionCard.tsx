import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { OrganizationalAttentionItem } from "@/application/organization/organizational-view.service";
import { EmptyState } from "@/components/shared/EmptyState";

interface OrganizationalAttentionCardProps {
  items: OrganizationalAttentionItem[];
}

export function OrganizationalAttentionCard({
  items,
}: OrganizationalAttentionCardProps) {
  return (
    <Card className="h-full border-amber-200/60 dark:border-amber-900/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
          Organizational Attention
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} require attention
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyState
            title="No organizational risks"
            description="Nothing currently requires organizational attention."
          />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/tasks/${item.taskId}`}
              className="block rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1 hover:bg-amber-50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={item.severity === "high" ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {item.severity === "high" ? "High" : "Medium"} priority
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Urgency: {item.urgencyLabel}
                </span>
              </div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.context}</p>
              {item.goalTitle && (
                <p className="text-xs text-muted-foreground">
                  Connected to {item.goalTitle}
                </p>
              )}
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
