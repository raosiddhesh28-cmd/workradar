"use client";

import { useState, useTransition } from "react";
import { assignTask } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";

export interface AssignablePerson {
  id: string;
  name: string;
}

interface AssignTaskPanelProps {
  taskId: string;
  currentAssigneeId: string;
  currentAssigneeName: string;
  candidates: AssignablePerson[];
}

export function AssignTaskPanel({
  taskId,
  currentAssigneeId,
  currentAssigneeName,
  candidates,
}: AssignTaskPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(currentAssigneeId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAssign() {
    setError(null);
    startTransition(async () => {
      const result = await assignTask(taskId, selectedId);
      if (result.ok) {
        setOpen(false);
        setError(null);
      } else {
        setError(result.message);
      }
    });
  }

  if (!open) {
    return (
      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="text-sm font-medium">Assignee</h2>
        <p className="text-sm">{currentAssigneeName}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedId(currentAssigneeId);
            setError(null);
            setOpen(true);
          }}
        >
          Change assignee
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border p-4 space-y-4">
      <h2 className="text-sm font-medium">Assign task</h2>
      <fieldset className="space-y-2">
        <legend className="sr-only">Select assignee</legend>
        {candidates.map((person) => (
          <label
            key={person.id}
            className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2 hover:bg-muted/40"
          >
            <input
              type="radio"
              name="assignee"
              value={person.id}
              checked={selectedId === person.id}
              onChange={() => setSelectedId(person.id)}
              className="accent-primary"
            />
            <span>{person.name}</span>
          </label>
        ))}
      </fieldset>

      {error && (
        <ErrorState
          title="Unable to assign task"
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
        <Button type="button" size="sm" onClick={handleAssign} disabled={pending}>
          {pending ? "Assigning…" : "Assign"}
        </Button>
      </div>
    </section>
  );
}
