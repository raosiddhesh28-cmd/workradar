import { formatRelativeTime } from "@/lib/format";

export function FreshnessIndicator({ lastUpdated }: { lastUpdated: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      Updated {formatRelativeTime(lastUpdated)} ago
    </p>
  );
}
