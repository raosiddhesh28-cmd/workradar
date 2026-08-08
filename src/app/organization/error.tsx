"use client";

import { ErrorState } from "@/components/shared/ErrorState";
import { LinkButton } from "@/components/shared/LinkButton";
import { Button } from "@/components/ui/button";

export default function OrganizationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg w-full px-4 py-16">
      <ErrorState
        title="Something went wrong"
        description="We couldn't load the organizational view."
        action={
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button type="button" onClick={() => reset()}>
              Try again
            </Button>
            <LinkButton href="/aerial" variant="outline">
              Back to Dashboard
            </LinkButton>
          </div>
        }
      />
    </main>
  );
}
