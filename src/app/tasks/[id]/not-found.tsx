import { ErrorState } from "@/components/shared/ErrorState";
import { LinkButton } from "@/components/shared/LinkButton";

export default function TaskNotFound() {
  return (
    <main className="mx-auto max-w-lg w-full px-4 py-16">
      <ErrorState
        title="Task not found"
        description="This work item doesn't exist or is no longer available."
        action={
          <LinkButton href="/aerial">Back to Dashboard</LinkButton>
        }
      />
    </main>
  );
}
