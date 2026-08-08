import { ErrorState } from "@/components/shared/ErrorState";
import { LinkButton } from "@/components/shared/LinkButton";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg w-full px-4 py-16">
      <ErrorState
        title="Page not found"
        description="This page doesn't exist or is no longer available."
        action={
          <LinkButton href="/aerial">Back to Dashboard</LinkButton>
        }
      />
    </main>
  );
}
