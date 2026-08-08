"use client";

import { ErrorState } from "@/components/shared/ErrorState";

export default function TasksError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-8">
      <ErrorState
        title="Unable to load tasks"
        description="Something went wrong while loading your task list."
        action={
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
          >
            Try again
          </button>
        }
      />
    </main>
  );
}
