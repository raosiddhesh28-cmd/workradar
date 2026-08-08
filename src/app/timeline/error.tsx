"use client";

import { ErrorState } from "@/components/shared/ErrorState";

export default function TimelineError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-6xl w-full px-4 py-8">
      <ErrorState
        title="Unable to load timeline"
        description="Something went wrong while loading the timeline."
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
