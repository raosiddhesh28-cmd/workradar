import { DUE_SOON_THRESHOLD_DAYS } from "./config";

export type DueDateStatus =
  | "completed"
  | "overdue"
  | "due_today"
  | "due_soon"
  | "on_track"
  | "none";

export interface DueDateClassification {
  status: DueDateStatus;
  label: string;
  dueDate: string | null;
}

function startOfDay(iso: string): Date {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export function classifyDueDate(
  dueDate: string | null | undefined,
  completedAt: string | null | undefined,
  status: string,
  now: Date,
): DueDateClassification {
  if (status === "done" || completedAt) {
    return { status: "completed", label: "Completed", dueDate: dueDate ?? null };
  }

  if (!dueDate) {
    return { status: "none", label: "No due date", dueDate: null };
  }

  const today = startOfDay(now.toISOString());
  const due = startOfDay(dueDate);
  const diff = daysBetween(today, due);

  if (diff < 0) {
    return { status: "overdue", label: "Overdue", dueDate };
  }
  if (diff === 0) {
    return { status: "due_today", label: "Due today", dueDate };
  }
  if (diff <= DUE_SOON_THRESHOLD_DAYS) {
    return { status: "due_soon", label: "Due soon", dueDate };
  }
  return { status: "on_track", label: "On track", dueDate };
}

export function formatDueDateDisplay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDueDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
