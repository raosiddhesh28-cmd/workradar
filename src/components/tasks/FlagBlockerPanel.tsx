"use client";

import { useState, useTransition } from "react";
import { flagBlocker } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";

interface FlagBlockerPanelProps {
  taskId: string;
  taskTitle: string;
}

export function FlagBlockerPanel({ taskId, taskTitle }: FlagBlockerPanelProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await flagBlocker(taskId, description);
      if (result.ok) {
        setSuccess(true);
        setOpen(false);
        setDescription("");
      } else {
        setError(result.message);
      }
    });
  }

  if (!open) {
    return (
      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="text-sm font-medium">Flag blocker</h2>
        <p className="text-sm text-muted-foreground">
          Record that <span className="font-medium">{taskTitle}</span> is blocking
          downstream work.
        </p>
        {success && (
          <p className="text-sm text-emerald-700" role="status">
            Blocker flagged successfully.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          Flag blocker
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border p-4 space-y-4">
      <h2 className="text-sm font-medium">Flag blocker</h2>
      <label className="block space-y-2 text-sm">
        <span className="text-muted-foreground">
          What is this task blocking?
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="e.g. Blocking mobile release sign-off"
          aria-label="Blocker description"
        />
      </label>

      {error && (
        <ErrorState
          title="Unable to flag blocker"
          description={error}
          className="max-w-none text-left p-4"
        />
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={pending || !description.trim()}
        >
          {pending ? "Saving…" : "Save blocker"}
        </Button>
      </div>
    </section>
  );
}
