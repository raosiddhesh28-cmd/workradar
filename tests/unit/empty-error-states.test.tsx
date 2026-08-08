import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

describe("EmptyState component", () => {
  it("renders title and description", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title="No blockers"
        description="You're not currently blocked by another task."
      />,
    );
    expect(html).toContain("No blockers");
    expect(html).toContain("not currently blocked");
  });
});

describe("ErrorState component", () => {
  it("renders friendly error copy", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        title="Task not found"
        description="This work item doesn't exist or is no longer available."
      />,
    );
    expect(html).toContain("Task not found");
    expect(html).not.toContain("Error:");
    expect(html).not.toContain("stack");
  });
});
