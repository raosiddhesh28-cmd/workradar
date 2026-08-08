import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TaskListItem } from "@/application/tasks/task-list.service";
import { DueDateBadge } from "@/components/scheduling/DueDateBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertCircle } from "lucide-react";

interface TaskListTableProps {
  items: TaskListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TaskListTable({
  items,
  emptyTitle = "No tasks",
  emptyDescription = "No work matches the selected filters.",
}: TaskListTableProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className="p-3 font-medium">Task</th>
            <th className="p-3 font-medium hidden sm:table-cell">Assignee</th>
            <th className="p-3 font-medium hidden md:table-cell">Team</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Due</th>
            <th className="p-3 font-medium hidden lg:table-cell">Impact</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.task.id} className="border-b last:border-b-0 hover:bg-muted/20">
              <td className="p-3">
                <Link
                  href={`/tasks/${item.task.id}`}
                  className="font-medium hover:underline flex items-center gap-2"
                >
                  {item.isBlocked && (
                    <AlertCircle
                      className="h-4 w-4 text-amber-600 shrink-0"
                      aria-label="Blocked"
                    />
                  )}
                  <span>{item.task.title}</span>
                </Link>
                {item.goalTitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.goalTitle}
                  </p>
                )}
              </td>
              <td className="p-3 hidden sm:table-cell text-muted-foreground">
                {item.assigneeName}
              </td>
              <td className="p-3 hidden md:table-cell text-muted-foreground">
                {item.teamName}
              </td>
              <td className="p-3">
                <Badge variant="secondary" className="text-xs capitalize">
                  {item.task.status.replace("_", " ")}
                </Badge>
              </td>
              <td className="p-3">
                <DueDateBadge classification={item.dueDate} />
              </td>
              <td className="p-3 hidden lg:table-cell">
                <Badge variant="outline" className="text-xs">
                  {item.impactLabel}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
