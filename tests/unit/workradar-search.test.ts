import { describe, it, expect, beforeEach } from "vitest";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import {
  searchWorkRadar,
  hasSearchResults,
} from "@/domain/search/workradar-search";
import { getSearchResults } from "@/application/search";

describe("WorkRadar search", () => {
  beforeEach(() => {
    resetGraphStore();
  });

  it("finds tasks by title", () => {
    const graph = getGraphStore().getGraph();
    const results = searchWorkRadar(graph, "API");
    expect(results.tasks.some((t) => t.title.toLowerCase().includes("api"))).toBe(
      true,
    );
    expect(results.tasks[0].id).toBeTruthy();
  });

  it("finds people by name", () => {
    const graph = getGraphStore().getGraph();
    const results = searchWorkRadar(graph, "Priya");
    expect(results.people.some((p) => p.name === "Priya Sharma")).toBe(true);
  });

  it("finds tasks assigned to a matched person", () => {
    const graph = getGraphStore().getGraph();
    const results = searchWorkRadar(graph, "Priya");
    expect(
      results.tasks.some((t) => t.assigneeName === "Priya Sharma"),
    ).toBe(true);
  });

  it("finds goals by title", () => {
    const graph = getGraphStore().getGraph();
    const results = searchWorkRadar(graph, "Retention");
    expect(
      results.goals.some((g) => g.title.includes("Customer Retention")),
    ).toBe(true);
  });

  it("returns empty results for unknown query", () => {
    const graph = getGraphStore().getGraph();
    const results = searchWorkRadar(graph, "zzzznotfound12345");
    expect(hasSearchResults(results)).toBe(false);
  });

  it("is case-insensitive", () => {
    const graph = getGraphStore().getGraph();
    const lower = searchWorkRadar(graph, "api");
    const upper = searchWorkRadar(graph, "API");
    expect(lower.tasks.map((t) => t.id)).toEqual(upper.tasks.map((t) => t.id));
  });

  it("search service returns correct task destinations", () => {
    const results = getSearchResults("API");
    const task = results.tasks.find((t) => t.id === "task-api-migration");
    expect(task).toBeDefined();
    expect(`/tasks/${task!.id}`).toBe("/tasks/task-api-migration");
  });
});
