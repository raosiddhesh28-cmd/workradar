import { describe, it, expect, beforeEach } from "vitest";
import { resetGraphStore, getGraphStore } from "@/infrastructure/store";
import { resetAiServices } from "@/infrastructure/ai";
import { NOW } from "@/infrastructure/seed/teams";
import {
  classifyDueDate,
  formatDueDateDisplay,
} from "@/domain/scheduling/due-date";
import {
  getTaskList,
  parseTaskListFilters,
} from "@/application/tasks/task-list.service";
import {
  getTimeline,
  timelineBarStyle,
} from "@/application/timeline/timeline.service";
import {
  getProgressSummary,
  buildProgressHistory,
} from "@/application/progress/progress.service";
import {
  getOrganizationalView,
  getOrganizationalAttention,
} from "@/application/organization/organizational-view.service";
import { resolveOrganizationalScope } from "@/domain/organization/scope";
import { getAerialView } from "@/application/services/aerial-view.service";

describe("due dates", () => {
  it("displays task with due date correctly", () => {
    const result = classifyDueDate(
      "2026-08-14T17:00:00.000Z",
      null,
      "open",
      NOW,
    );
    expect(result.dueDate).toBe("2026-08-14T17:00:00.000Z");
    expect(formatDueDateDisplay(result.dueDate!)).toContain("Aug");
  });

  it("identifies overdue task", () => {
    const result = classifyDueDate(
      "2026-08-05T17:00:00.000Z",
      null,
      "open",
      NOW,
    );
    expect(result.status).toBe("overdue");
    expect(result.label).toBe("Overdue");
  });

  it("identifies due-today task", () => {
    const result = classifyDueDate(
      "2026-08-08T17:00:00.000Z",
      null,
      "open",
      NOW,
    );
    expect(result.status).toBe("due_today");
  });

  it("identifies upcoming / due-soon task", () => {
    const result = classifyDueDate(
      "2026-08-09T17:00:00.000Z",
      null,
      "open",
      NOW,
    );
    expect(result.status).toBe("due_soon");
  });

  it("handles completed task state", () => {
    const result = classifyDueDate(
      "2026-08-07T17:00:00.000Z",
      "2026-08-08T06:30:00.000Z",
      "done",
      NOW,
    );
    expect(result.status).toBe("completed");
  });
});

describe("task lists", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("returns assigned tasks for My Tasks", () => {
    const list = getTaskList("person-priya", "mine", {}, NOW)!;
    expect(list.scope).toBe("mine");
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.items.every((i) => i.task.ownerId === "person-priya")).toBe(true);
  });

  it("returns team scope for manager", () => {
    const list = getTaskList("person-devon", "team", {}, NOW)!;
    expect(list.scope).toBe("team");
    expect(list.items.length).toBeGreaterThan(0);
    const teamIds = new Set(
      list.items.map((i) => {
        const owner = getGraphStore()
          .getGraph()
          .people.find((p) => p.id === i.task.ownerId);
        return owner?.teamId;
      }),
    );
    expect(teamIds.has("team-platform")).toBe(true);
  });

  it("returns organization scope for executive", () => {
    const list = getTaskList("person-vp-eng", "organization", {}, NOW)!;
    expect(list.scope).toBe("organization");
    expect(list.items.length).toBeGreaterThan(5);
  });

  it("filters by status", () => {
    const list = getTaskList(
      "person-priya",
      "mine",
      { status: "done" },
      NOW,
    )!;
    expect(list.items.every((i) => i.task.status === "done")).toBe(true);
  });

  it("filters by assignee", () => {
    const list = getTaskList(
      "person-devon",
      "team",
      { assigneeId: "person-marcus" },
      NOW,
    )!;
    expect(list.items.every((i) => i.task.ownerId === "person-marcus")).toBe(
      true,
    );
  });

  it("filters by due date status", () => {
    const list = getTaskList(
      "person-priya",
      "mine",
      { dueDateStatus: "due_today" },
      NOW,
    )!;
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.items.every((i) => i.dueDate.status === "due_today")).toBe(
      true,
    );
  });

  it("filters by goal", () => {
    const list = getTaskList(
      "person-vp-eng",
      "organization",
      { goalId: "goal-q3-retention" },
      NOW,
    )!;
    expect(list.items.length).toBeGreaterThan(0);
  });

  it("filters by blocked status", () => {
    const list = getTaskList(
      "person-jordan",
      "mine",
      { blocked: true },
      NOW,
    )!;
    expect(list.items.every((i) => i.isBlocked)).toBe(true);
  });

  it("parses URL filters", () => {
    const filters = parseTaskListFilters({
      assignee: "person-priya",
      status: "open",
      blocked: "true",
      atRisk: "true",
      due: "overdue",
    });
    expect(filters.assigneeId).toBe("person-priya");
    expect(filters.status).toBe("open");
    expect(filters.blocked).toBe(true);
    expect(filters.atRisk).toBe(true);
    expect(filters.dueDateStatus).toBe("overdue");
  });
});

describe("timeline", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("includes tasks with start and due dates", () => {
    const timeline = getTimeline("person-priya", "mine", NOW)!;
    expect(timeline.bars.length).toBeGreaterThan(0);
    const api = timeline.bars.find((b) => b.taskId === "task-api-migration");
    expect(api).toBeDefined();
    expect(api!.startDate).toBeTruthy();
    expect(api!.endDate).toBeTruthy();
  });

  it("handles tasks without sufficient dates safely", () => {
    const store = getGraphStore();
    store.updateTask("task-api-migration", {
      startDate: null,
      dueDate: null,
    });
    const timeline = getTimeline("person-priya", "mine", NOW)!;
    const api = timeline.bars.find((b) => b.taskId === "task-api-migration");
    expect(api).toBeUndefined();
    expect(timeline.excludedCount).toBeGreaterThan(0);
  });

  it("respects persona scope", () => {
    const mine = getTimeline("person-priya", "mine", NOW)!;
    const org = getTimeline("person-vp-eng", "organization", NOW)!;
    expect(org.bars.length).toBeGreaterThan(mine.bars.length);
  });

  it("produces bar positions for task detail links", () => {
    const timeline = getTimeline("person-priya", "mine", NOW)!;
    const bar = timeline.bars[0];
    const style = timelineBarStyle(bar, timeline.rangeStart, timeline.rangeEnd);
    expect(style.left).toMatch(/%$/);
    expect(style.width).toMatch(/%$/);
    expect(bar.taskId).toBeTruthy();
  });
});

describe("progress", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("calculates remaining work correctly", () => {
    const summary = getProgressSummary("person-priya", "mine", NOW)!;
    const open = summary.remaining;
    expect(open).toBe(
      summary.total - summary.completed - summary.deferred,
    );
  });

  it("calculates completed work correctly", () => {
    const summary = getProgressSummary("person-elena", "mine", NOW)!;
    expect(summary.completed).toBeGreaterThanOrEqual(1);
  });

  it("respects scope filtering", () => {
    const mine = getProgressSummary("person-devon", "mine", NOW)!;
    const team = getProgressSummary("person-devon", "team", NOW)!;
    expect(team.total).toBeGreaterThanOrEqual(mine.total);
  });

  it("shows empty history when insufficient data", () => {
    const result = buildProgressHistory(
      new Set(["task-a"]),
      new Set(["person-a"]),
      [
        {
          eventType: "task_completed",
          entityId: "task-a",
          timestamp: "2026-08-08T10:00:00.000Z",
          relevantPersonIds: ["person-a"],
        },
      ],
      { remaining: 1, completed: 1 },
      NOW,
    );
    expect(result.hasHistory).toBe(false);
  });

  it("builds history from mock completion events", () => {
    const summary = getProgressSummary("person-devon", "team", NOW)!;
    expect(summary.hasHistory).toBe(true);
    expect(summary.history.length).toBeGreaterThan(1);
  });
});

describe("organizational enhancements", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("includes due date on organizational attention items", () => {
    const store = getGraphStore();
    const graph = store.getGraph();
    const scope = resolveOrganizationalScope(
      graph,
      "person-vp-eng",
      (id) => store.getDirectReports(id),
    )!;
    const attention = getOrganizationalAttention(graph, scope, NOW);
    const withDue = attention.filter((a) => a.dueDateLabel);
    expect(withDue.length).toBeGreaterThan(0);
  });

  it("organizational view still uses Impact Score ranking", () => {
    const view = getOrganizationalView("person-vp-eng", NOW)!;
    const scores = view.topImpact.map((i) => i.impactScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

describe("AI fallback / regression", () => {
  beforeEach(() => {
    resetGraphStore();
    resetAiServices();
  });

  it("core views work without AI", async () => {
    const aerial = await getAerialView("person-priya", NOW);
    expect(aerial.topWork.length).toBeGreaterThan(0);
    const tasks = getTaskList("person-priya", "mine", {}, NOW);
    expect(tasks!.items.length).toBeGreaterThan(0);
    const timeline = getTimeline("person-priya", "mine", NOW);
    expect(timeline!.bars.length).toBeGreaterThan(0);
    const progress = getProgressSummary("person-priya", "mine", NOW);
    expect(progress!.total).toBeGreaterThan(0);
    const org = getOrganizationalView("person-vp-eng", NOW);
    expect(org!.topImpact.length).toBeGreaterThan(0);
  });
});
