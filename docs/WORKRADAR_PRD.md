# Vantage — A Systems-Thinking Day Planner for the Enterprise

**Product Requirements Document (PRD)**

**Working name:** Vantage (placeholder — pick a name that survives trademark/domain check)

**Document type:** End-to-end PRD — problem through metrics, populated with real product thinking for this specific concept

**Category:** Enterprise SaaS — operational cockpit / systems-thinking day planner

**Core bet:** Individual daily task lists optimize for the wrong unit. Vantage treats the company as one interconnected system and shows every employee — IC, manager, executive, ops, HR — the small number of things that, if done today, move the organization's actual goals and unblock other people. Priority is not self-declared; it is computed from how each unit of work connects to organizational goals, deadlines, and other people's ability to move.

---

## Document Control

| Field | Value |
|-------|-------|
| Product / Initiative Name | Vantage (working name) |
| Document Owner (PM) | [PLACEHOLDER] |
| Status | Draft — v1.0 |
| Version | 1.0 |
| Last Updated | 2026-08-08 |
| Reviewers / Approvers | [PLACEHOLDER — Eng lead, Design lead, Security, Exec sponsor] |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Key Pain Points](#4-key-pain-points)
5. [Market & Competitive Research](#5-market--competitive-research)
6. [Vision & Product Principles](#6-vision--product-principles)
7. [Business Objectives & Success Metrics](#7-business-objectives--success-metrics)
8. [Personas](#8-personas)
9. [Jobs-To-Be-Done](#9-jobs-to-be-done)
10. [User Journey](#10-user-journey)
11. [Assumptions](#11-assumptions)
12. [Solution Overview — The Impact Graph](#12-solution-overview--the-impact-graph)
13. [User Value Proposition by Persona](#13-user-value-proposition-by-persona)
14. [Core Feature Set](#14-core-feature-set)
15. [MVP Scope & Prioritization (MoSCoW / RICE / Kano)](#15-mvp-scope--prioritization-moscow--rice--kano)
16. [UX / UI Design](#16-ux--ui-design)
17. [System Architecture](#17-system-architecture)
18. [Technical Implementation Plan ("Code")](#18-technical-implementation-plan-code)
19. [Non-Functional Requirements](#19-non-functional-requirements)
20. [Testing Strategy & QA](#20-testing-strategy--qa)
21. [Deployment & Release Plan](#21-deployment--release-plan)
22. [Metrics to Track Performance](#22-metrics-to-track-performance)
23. [Risks & Mitigations](#23-risks--mitigations)
24. [Roadmap](#24-roadmap)
25. [Open Questions](#25-open-questions)
26. [Appendix](#26-appendix)

---

## 1. Executive Summary

Every enterprise already has dozens of tools that hold a piece of the picture: a task manager for individual to-dos, a calendar for time, an OKR tool for quarterly goals, a chat tool for what's on fire right now, and a spreadsheet or dashboard for "what happened." None of them answer the question an employee actually asks at 9am: **"Out of everything I could do today, what's the handful of things that actually matters to the business — and to the people waiting on me?"**

Vantage is a web application that sits across an organization's existing tools (calendar, task/project trackers, OKR/goal system, HRIS, chat) and computes — rather than lets each person guess — a daily, role-aware view built on four anchors:

1. **Top work for the day** — the small set of tasks/decisions with the highest computed organizational impact, not just the ones with the nearest deadline or loudest requester.
2. **What happened today** — a synthesized, role-appropriate digest of what changed in the system overnight/today (completed work, missed deadlines, new blockers, goal-health shifts) so nobody starts the day blind.
3. **What requires immediate attention** — items where cost-of-delay is compounding right now (SLA breach risk, exec escalation, at-risk goal, dependency about to cascade).
4. **Who is blocked** — a live view of who is waiting on you, and who you are waiting on, so the org's actual bottlenecks are visible instead of discovered in a status meeting three days later.

The differentiator is **systems thinking**: Vantage models the organization as a graph — **Goals → Initiatives → Team Objectives → Tasks → People → Dependencies** — and computes an **Impact Score** for every unit of work from its position in that graph, not from a manually assigned priority flag. The same underlying graph then re-projects into different views for an IC (my day), a manager (my team's day and blockers I must clear), an executive (org-wide risk and goal health), and Ops/HR (operational and people-risk signals). One system of record for "what matters," many honest views of it.

This PRD covers the end-to-end plan: problem, research, solution architecture, prioritization, UX, technical implementation, testing/deployment, and the metrics that will tell us whether this actually changes how the company works — not just whether people logged in.

---

## 2. Problem Statement

### 2.1 The problem, precisely

Employees across all levels start the day with fragmented, self-declared, locally-optimized priority lists that are disconnected from (a) organizational goals, (b) what changed since they last looked, and (c) who else's work depends on theirs. The result is an organization where individuals are busy, teams report "green" status, and yet strategic goals slip and cross-team blockers surface late — because no tool shows the system, only the parts.

### 2.2 Evidence this is a real, unsolved problem

| Source | Type | Finding |
|--------|------|---------|
| Competitive landscape scan (Section 5) | Qualitative / market | The daily-planner category (Motion, Sunsama, Reclaim, Any.do, Akiflow, Todoist) is built almost entirely around individual schedules and self-declared task priority — none compute priority from organizational goal graphs. |
| OKR/strategy-execution category scan (Section 5) | Qualitative / market | Goal-alignment tools (Perdoo, Quantive/Workboard, Mooncamp) connect strategy to objectives, but stop at the quarterly/team level — they don't reach into a person's actual day-to-day task list. |
| Internal research (to be run — see Section 5.4) | Quantitative / qualitative | [PLACEHOLDER — org's own data: % of employees who say they don't know if today's work maps to a company goal; average time to surface a cross-team blocker; % of 1:1/status-meeting time spent just synchronizing "what's happening"] |

### 2.3 Root cause

Using a 5-Whys pass:

1. Strategic goals slip → because work that matters isn't reliably prioritized above work that's merely visible or urgent-feeling.
2. Why? → Because priority is self-declared per tool, per person, with no shared definition of "impact."
3. Why? → Because no system holds the relationship between an individual task and the organizational goal it serves.
4. Why? → Because goal-tracking tools (OKRs) and execution tools (task managers, calendars) are separate products with, at best, shallow integrations.
5. Why (root cause)? → There is no shared, computed, continuously-updated model of "what matters and to whom" that spans from company strategy down to an individual's Tuesday.

### 2.4 Cost of inaction

- Strategic initiatives quietly stall because no single view surfaces "goal at risk because task X, owned by person Y, is 6 days late."
- Cross-functional blockers are discovered in the next status meeting instead of the same day, adding days-to-weeks of latency to every dependent workstream.
- Managers and executives spend disproportionate time in status-gathering meetings that exist only because there's no shared, trusted, systems-level view.
- ICs experience "busy but not sure it mattered" fatigue, a known driver of disengagement.

### 2.5 Definition of "solved"

An employee, on opening Vantage, can answer in under 60 seconds: what should I do today that matters most, what changed since yesterday, what's on fire, and who's waiting on me — and that answer is demonstrably consistent with the company's actual current goals and dependency graph, not just their own to-do list.

---

## 3. Target Users

Vantage is built for every employee in a mid-size-to-large enterprise, not a single functional team — this is a deliberate scope decision (see Product Principles, Section 6) since the core thesis only works if the goal-to-task graph spans the whole org, not one department's slice of it.

| Target user group | Who they are | Why they're in scope for MVP |
|-------------------|--------------|------------------------------|
| Individual Contributors (ICs) | Engineers, designers, analysts, sales reps, support agents, and similar hands-on roles | They generate and complete the tasks the whole graph is built from — without their daily use, there's no data and no value loop |
| People Managers / Team Leads | First-line and mid-level managers with direct reports | They are the first beneficiaries of reduced status-meeting load and early blocker visibility (Business Objectives, Section 7.1) |
| Executives (VP / C-level) | Functional and company-wide leaders accountable for strategic goals | They are the economic buyer's proxy in most enterprise deals and the primary consumer of the org heat-map |
| Operations Leads | Process, SLA, and cross-functional throughput owners | They need a systemic, cross-team view that today doesn't exist in any single tool (validated gap, Section 5.3) |
| HR / People Partners | Org-health and workload stewards | Aggregate-only view for early-warning signals (see Privacy boundary, Section 19.2) |
| IT / Platform Admins | Enable and govern the deployment | Not end-value users, but a required enabling persona for any enterprise rollout |

**Not in target scope for MVP:** individual contributors' personal/non-work task management (Vantage is a work-systems tool, not a personal life planner); organizations without any existing goal/OKR structure to connect to (see Go/No-Go criteria, Section 21.3, and Assumption A1 in Section 11).

**Buyer vs. user distinction:** the economic buyer is typically a COO, CIO, or VP Operations sponsoring an org-wide rollout; the end users are every employee in scope above. This split matters for adoption strategy (Section 14 general template pattern) — the tool must deliver visible day-one value to ICs, not just reporting value to the buyer, or bottom-up adoption will stall.

---

## 4. Key Pain Points

Consolidated from the Problem Statement (Section 2) and Personas (Section 8) research — every feature in this PRD should trace back to at least one of these.

| # | Pain point | Who feels it most | Evidence source |
|---|------------|-------------------|-----------------|
| P1 | Priority is self-declared per tool, per person — no shared definition of "what matters" across the org | ICs, Managers | Problem Statement 2.1; market research shows no competitor computes priority from a goal graph (Section 5.3) |
| P2 | Cross-team blockers are discovered late, typically in the next scheduled status meeting rather than same-day | ICs, Managers, Ops | Problem Statement 2.4; JTBD "block a teammate" (Section 9) |
| P3 | Strategic goals slip silently because no system connects an individual task to the goal it serves | Executives, Managers | Root-cause analysis 2.3; validated by Perdoo field example (Section 5.2) |
| P4 | Status reporting requires manual synthesis and meetings because there's no trusted async shared view | Managers, Executives | Problem Statement 2.4; JTBD "team status without asking" (Section 9) |
| P5 | Operational/SLA risk is scattered across ticketing and workflow tools with no unified early-warning view | Operations | Persona: Operations Lead (Section 8) |
| P6 | Workload and burnout risk signals are anecdotal until someone resigns or complains — no early, respectful visibility | HR / People Partners | Persona: HR / People Partner (Section 8) |
| P7 | Being "busy" and being "valuable to the business" feel disconnected, contributing to disengagement | ICs | Problem Statement 2.4; JTBD "know it mattered" (Section 9) |

---

## 5. Market & Competitive Research

### 5.1 Category landscape

The relevant market splits into two categories that currently don't talk to each other — Vantage's opportunity is the seam between them.

#### A. AI daily planners / personal task schedulers — optimize an individual's calendar and task list.

| Tool | Core mechanic | Gap vs. Vantage |
|------|---------------|-----------------|
| Motion | Auto-schedules tasks into calendar by deadline/duration. Motion's AI scheduler rebuilds schedules based on task priority and deadlines, fitting tasks into the calendar around existing meetings. | Priority is user-declared per task; no notion of organizational goal linkage or cross-person blocking. Has no native integrations for tools like Notion or ClickUp, forcing teams to duplicate effort. |
| Reclaim.ai | Capacity-aware scheduling; for teams, helps coordinate availability and prioritize work based on real-time workload data. | Optimizes calendar capacity, not organizational impact; no goal graph. |
| Sunsama | Calm, ritual-based daily planning; a guided morning session where the user chooses tasks, estimates time, and decides when to tackle them. | Deliberately manual/intentional — the opposite bet of "compute it for me from the system." No org-wide view. |
| Todoist / Any.do | Natural-language task capture with AI-assisted prioritization and scheduling. | Personal-productivity framing; a daily task limit functions as a prioritization decision, capping commitment rather than deriving it from organizational value. Still self-declared priority. |
| Akiflow | Pulls tasks from multiple tools into one daily command center for power users. | An aggregation layer, not a computation layer — still surfaces what each source tool already decided was "priority." |

#### B. OKR / strategy-execution platforms — connect company strategy to team-level objectives.

| Tool | Core mechanic | Gap vs. Vantage |
|------|---------------|-----------------|
| Workboard (formerly merged with Quantive) | Connects multi-year strategy to OKRs and daily work with a heavy focus on business reviews and scorecards; offers an OKR heatmap for visual overview of objective progress across the org, drillable to departments to spot risk before it escalates. | Strongest existing analog to Vantage's exec heat-map view — but it's built for companies with 200+ employees and data teams, with enterprise pricing reflecting analytics strength rather than individual daily-work guidance. Stops at team/initiative level, not individual task view. |
| Quantive | Connects strategic goals directly to live metrics from more than 160 business systems, tracking outcomes without manual reporting. | Deep on metrics automation, shallow on "what should I personally do today." |
| Perdoo | Strategy Map shows how objectives cascade from company level down to teams so people can see at a glance how everything connects; lets the CEO, department leads, and ICs open the same view and see how each key result rolls into an objective and each objective ties to company vision, which stopped teams from duplicating effort. | Validates the core Vantage thesis (shared visibility of goal cascade changes behavior) but Perdoo's unit of work is the key result, not the daily task, and it has no blocker/dependency layer. |
| Worxmate | Bridges the gap between OKRs and daily work, linking tasks, projects, and CRM data for ops-heavy teams that want goals connected to reality. | Closest existing competitor to Vantage's core thesis; worth deeper teardown before build (see Open Questions). |

### 5.2 What the research validates

- **Daily commitment caps work.** Capping the number of committed tasks per day is itself a prioritization decision, and the common failure pattern is capturing dozens of tasks and hoping to reach the important ones instead of committing to a realistic, ranked handful — supports Vantage's "small ranked list, not a backlog dump" design for the daily view.
- **Shared visibility changes coordination behavior, not just individual planning.** Perdoo's field example shows that once a strategy map made goal-to-work connections visible company-wide, teams stopped duplicating effort and started making decisions that supported each other — this is the strongest existing evidence for Vantage's cross-persona, shared-graph bet.
- **Automated linkage to live data beats manual status reporting.** Platforms that connect goals directly to live metrics from many business systems let organizations track outcomes without manual reporting — reinforces that Vantage's "what happened today" digest must be computed from real system events, not self-reported check-ins.

### 5.3 White space / differentiation

No researched competitor currently:

1. Computes a single Impact Score for an individual task from its position in a live goal-and-dependency graph (existing tools either let the user rank tasks themselves, or stop at the team/OKR level).
2. Surfaces a "who is blocked" graph that spans across teams and tool boundaries in real time.
3. Projects one underlying model into role-specific daily views for IC through executive, so the org has one system of record for "what matters" instead of a chain of manually synced status updates.

This is Vantage's differentiated bet: not a better calendar, not a better OKR tool — the connective layer between them.

### 5.4 Research still required before/during build (not yet run — log in Section 25 Open Questions)

- Internal discovery interviews across all 6 target personas (min. 5 per persona) to validate the four core anchors and surface anchors we're missing.
- Card sort / tree test on the proposed information architecture (Section 16).
- Teardown of Worxmate and Workboard's heatmap/blocker features specifically, since they are the closest adjacent competitors.
- Willingness-to-pay and buyer-vs-user research with economic buyers (likely COO/CIO/VP Ops) vs. end users (all employees).

---

## 6. Vision & Product Principles

### 6.1 Vision

In three years, no employee at a customer company opens a spreadsheet or asks "wait, is this actually a priority?" in a status meeting. Instead, everyone — from a new IC to the CEO — opens one shared, honest, continuously-updated view of how today's work connects to what the organization is actually trying to achieve, and where the real bottlenecks are. Strategy stops being a slide that's re-explained every quarter and becomes a live structure that shapes everyone's Tuesday.

### 6.2 Product principles (ranked; used to resolve trade-offs)

| # | Principle ("X over Y") | Rationale | Example trade-off it resolves |
|---|------------------------|-----------|-------------------------------|
| 1 | Computed priority over declared priority | Self-declared priority reproduces the exact fragmentation problem we're solving. | When a manager wants a manual "pin to top" override vs. trusting the Impact Score — default to computed, allow explainable, logged overrides, don't allow silent overrides. |
| 2 | One graph, many views over many products, one dashboard | The value is a shared model; forking the data model per persona recreates the fragmentation problem at a different layer. | When Exec view wants aggregated org-health metrics the IC view doesn't need — build as a projection of the same graph, not a separate data pipeline. |
| 3 | Transparency of scoring over black-box AI magic | In a system that tells people what matters most, trust requires the "why" to be inspectable, especially for HR/performance-adjacent signals. | When a fancier ML ranking model would outperform a transparent weighted formula slightly — prefer the explainable formula (v1), reserve ML for advisory surfacing (Section 14.7), not final ranking. |
| 4 | Reduce meetings over add another dashboard | If Vantage becomes "one more thing to check" without removing status-sync meetings, it has failed its own thesis. | Prioritize features that make async status visibility good enough to cancel a recurring sync, over features that just look impressive in a demo. |
| 5 | Signal over noise, always | An operational cockpit that pages people constantly becomes wallpaper within two weeks. | When it's tempting to surface every event — filter aggressively; require every "requires immediate attention" item to justify interrupting someone's day. |
| 6 | Org-shared truth over role-based spin | Executives, managers, and ICs must see consistent facts (even if summarized differently), or trust collapses. | Resist any feature that would let a manager present a rosier picture upward than the underlying data supports. |

**Precedence when principles conflict:** Trust and transparency (#3, #6) outrank velocity/automation (#1) which outrank feature richness (#4, #5).

---

## 7. Business Objectives & Success Metrics

### 7.1 Business objectives

| Objective | Business Owner | Baseline | Target | Timeframe |
|-----------|----------------|----------|--------|-----------|
| Reduce time-to-surface cross-team blockers | VP Operations | [PLACEHOLDER — e.g., median 4.2 days, from internal research] | Reduce median time-to-surface by 50% | Within 2 quarters of full rollout |
| Reduce recurring status-sync meeting load | COO / VP Eng | [PLACEHOLDER — hours/week spent in status meetings per team] | Reduce by 30% for pilot teams | Within 2 quarters |
| Improve goal-to-work traceability | CEO / Chief of Staff | [PLACEHOLDER — % of active tasks with no linked goal] | <10% of active tasks unlinked to a goal | Within 3 quarters |
| Drive daily active, habitual use (adoption proxy for value) | Head of Product (Vantage) | 0% (pre-launch) | 70%+ weekly-active among licensed seats by end of pilot | 90 days post-pilot-launch |

### 7.2 North Star Metric

**North Star:** "Aligned Actions Completed" — the number of daily top-work items (from the computed Impact list) that are marked complete and are traceably linked to an active organizational goal, per week, org-wide.

**Formula:**

```
COUNT(tasks WHERE status = complete
  AND completed_in_period
  AND linked_goal_id IS NOT NULL
  AND was_in_users_daily_top_list)
```

**Why this and not "daily active users":** DAU can be gamed by people merely checking the app. Aligned Actions Completed only increases when the system's core promise — surfacing and completing the highest-impact, goal-linked work — is actually happening.

**Data source:** Vantage task/event store (Section 17).

**Baseline:** 0 (new metric; no prior system captures this).

### 7.3 Supporting KPIs

| KPI | Formula | Owner | Target (post-pilot) |
|-----|---------|-------|---------------------|
| Blocker time-to-resolution | median(time from blocker flagged → blocker cleared) | Ops/Eng lead | ≤ 2 business days |
| Goal-linkage coverage | % of active tasks with a non-null linked goal | Product | ≥ 90% |
| Daily plan adoption | % of users who open and act on (complete/defer/reassign) at least 1 top-work item per workday | Product | ≥ 60% |
| Weekly active managers viewing team blocker view | % of managers opening team view ≥ 3x/week | Product | ≥ 75% |
| Exec heat-map weekly engagement | % of execs viewing org heat-map ≥ 1x/week | Product | ≥ 80% |
| Status-meeting time reduction (self-reported + calendar audit) | avg. hrs/week in recurring status meetings, pilot vs. baseline | Ops | −30% |

### 7.4 OKRs — first two quarters post-pilot (illustrative; to be finalized with sponsor)

| Objective | Key Result | Owner | Confidence |
|-----------|------------|-------|------------|
| Prove the Impact Graph changes daily behavior, not just visibility | KR1: 60%+ of pilot users complete ≥1 computed top-work item/day by week 6 | Product | Medium |
| | KR2: Goal-linkage coverage reaches 90% for pilot teams | Product/Eng | Medium |
| Prove blockers surface faster | KR3: Median blocker time-to-surface drops 50% vs. pre-pilot baseline | Ops | Medium-Low (needs baseline instrumentation first) |
| Prove trust in computed priority | KR4: <15% of computed top-work items are manually overridden/dismissed without action | Product/Design | Medium |

### 7.5 Guardrail metrics (must not regress while chasing the above)

| Metric | Threshold | Owner |
|--------|-------------|-------|
| Perceived priority accuracy (in-app pulse survey, "did today's top list feel right?") | ≥ 70% positive | Design/Research |
| Notification/interrupt fatigue (unsubscribe or mute rate from "requires attention" alerts) | < 10% of users mute within 30 days | Product |
| Data freshness (lag between source-system event and Vantage reflecting it) | p95 < 5 minutes | Engineering |

---

## 8. Personas

Each persona below is ranked by priority for the MVP pilot and includes goals, context, pain points, and what "a good day in Vantage" looks like for them.

### Persona: Individual Contributor (IC) — Primary

- **Summary:** Does the hands-on work (engineering, design, analysis, sales execution, support, etc.). Juggles tasks from multiple sources: their manager, tickets, Slack requests, and their own backlog.
- **Primary goals:** Know what to work on first without guessing; avoid being the reason someone else is stuck; not feel like "busy" and "valuable" are different things.
- **Context of use:** Checks first thing in the morning (desktop) and periodically on mobile; high task volume, low tolerance for extra data entry.
- **Key pain points today:** Priorities come from five different channels with no shared ranking; often doesn't know their work maps to a larger goal; discovers they've blocked a teammate only when asked directly.
- **Decisions made with the product:** What to work on next; whether to flag a blocker; whether to defer/reassign a task.
- **Technical proficiency:** Varies widely — must not assume power-user comfort.
- **Definition of success (session):** Opens Vantage, sees 3–5 ranked items with a one-line "why this matters," acts on at least one, done in under 2 minutes.
- **Conflicts with other personas:** Wants autonomy over their list; managers want visibility/control — resolved via principle #1 (computed priority, logged manual overrides only).

### Persona: Manager (People Manager / Team Lead) — Primary

- **Summary:** Owns a team's output and is accountable for both the team's goals and each person's workload/wellbeing.
- **Primary goals:** See the team's day at a glance; catch blockers before they cascade; avoid needing a status meeting to know this.
- **Context of use:** Checks multiple times/day; before 1:1s and standups specifically.
- **Key pain points today:** Status meetings exist because there's no reliable async substitute; blockers surface late; hard to tell "busy" from "productive on what matters."
- **Decisions made with the product:** Whether to intervene/reprioritize; whether to escalate a blocker; how to represent team status upward.
- **Definition of success (session):** Can answer "is my team on track and who needs help" without asking anyone directly.
- **Conflicts:** With execs (wants to control the narrative upward) — resolved via principle #6 (shared truth).

### Persona: Executive (VP / C-level) — Primary

- **Summary:** Owns strategic goals across multiple teams/functions; needs early warning on risk, not raw task lists.
- **Primary goals:** See which goals are at risk before the quarterly review; understand systemic bottlenecks (not individual task minutiae).
- **Context of use:** Weekly/bi-weekly deep look, ad hoc checks before board/leadership meetings; often mobile.
- **Key pain points today:** Status rolls up through layers of managers, losing fidelity and timeliness; risk is discovered too late to act on.
- **Decisions made with the product:** Where to intervene, reallocate resources, or ask pointed questions in reviews.
- **Definition of success (session):** A heat-map of goal health and org-wide blocker density in under a minute, with drill-down available but not required.
- **Conflicts:** With managers, who may prefer to smooth over risk — resolved via principle #6.

### Persona: Operations Lead — Secondary

- **Summary:** Owns cross-functional process health — SLAs, throughput, operational risk.
- **Primary goals:** Spot systemic (not individual) bottlenecks; keep operational SLAs from breaching.
- **Context of use:** Frequent, process/queue-oriented views rather than personal task views.
- **Key pain points today:** Operational risk is scattered across ticketing/workflow tools with no unified "what's about to breach" view.
- **Decisions made with the product:** Where to add resourcing; which process to redesign; when to escalate.
- **Definition of success (session):** Sees "what requires immediate attention" filtered to operational/SLA-risk items across teams.

### Persona: HR / People Partner — Secondary

- **Summary:** Monitors workload distribution, burnout risk signals, and cross-team collaboration health — without doing individual performance surveillance.
- **Primary goals:** Spot systemic overload or under-engagement patterns early; support managers with data, not judge individuals.
- **Context of use:** Periodic (weekly/monthly) aggregate views.
- **Key pain points today:** Workload/burnout signals are anecdotal until someone resigns or complains.
- **Decisions made with the product:** Where to recommend workload rebalancing or manager coaching — at the aggregate/team level only (see Section 19 Privacy — individual-level burnout inference is explicitly out of scope for MVP; see Open Questions).
- **Definition of success (session):** Aggregate, anonymized-where-required workload/health signals by team, not individual task-level surveillance.

### Persona: IT / Platform Admin — Tertiary (enabling persona)

- **Summary:** Configures SSO, integrations, permission models, and data governance for the org.
- **Primary goals:** Deploy safely; ensure the right people see the right data; minimal ongoing maintenance burden.
- **Context of use:** Heavy involvement at setup/rollout, light-touch afterward.
- **Decisions made with the product:** Integration configuration, role/permission mapping, data retention settings.
- **Definition of success (session):** Can configure and audit access without engineering support.

### Persona conflict matrix

| Persona A | Persona B | Nature of conflict | Resolution approach |
|-----------|-----------|-------------------|---------------------|
| IC | Manager | Autonomy vs. visibility/control | Computed priority is the default; manager can request but not silently override an IC's list — overrides are visible to the IC. |
| Manager | Executive | Local optimism vs. org-wide honesty | Single shared data model (principle #2); manager's rollup view and exec's heat-map both read the same underlying graph. |
| HR | IC/Manager | Aggregate people-risk visibility vs. individual privacy | HR sees team/aggregate signals only in MVP; no individual burnout scoring exposed to HR (see Privacy, Section 19.2). |

---

## 9. Jobs-To-Be-Done

| Persona | JTBD statement | Functional outcome | Emotional outcome | Social outcome | Frequency | Importance | Satisfaction gap (today) |
|---------|----------------|-------------------|-------------------|----------------|-----------|------------|--------------------------|
| IC | When I start my workday, I want to instantly know the few things that matter most, so I can spend my limited hours on real impact instead of guessing. | Ranked, small daily list | Feel in control, not overwhelmed | Be seen as someone who moves the needle | Daily | High | High |
| IC | When my work would block a teammate, I want the system to surface that automatically, so I can act before it becomes a fire. | Proactive blocker flagging | Feel responsible, not blindsided | Avoid being "that bottleneck" | Weekly+ | High | High |
| Manager | When I start my day, I want to see my team's status and blockers without asking, so I can intervene early instead of during a scheduled sync. | Async team status view | Feel on top of things, not chasing | Be seen as a proactive, effective manager | Daily | High | High |
| Executive | When I prepare for a leadership review, I want to see which goals are actually at risk and why, so I can act before the quarter is lost. | Goal-health heat map with drill-down | Feel confident, not blindsided in the room | Be seen as strategically in control | Weekly | High | High |
| Ops Lead | When operational SLAs are trending toward breach, I want to know today, so I can reallocate before customers/stakeholders are impacted. | SLA/risk radar | Feel ahead of problems | Be seen as reliable operations owner | Daily | High | Medium |
| HR Partner | When a team shows early signs of systemic overload, I want an aggregate signal, so I can support the manager before attrition happens. | Aggregate workload-health view | Feel proactive, not reactive | Be a trusted strategic partner, not "the compliance office" | Monthly | Medium | High |

---

## 10. User Journey

Rather than one generic journey, each primary persona has a distinct "day in the life" — this is the clearest way to validate that the Daily Aerial View (Section 14.1) actually resolves the Key Pain Points (Section 4) in practice.

### 10.1 IC journey — "Priya, Senior Engineer"

| Step | Touchpoint | What happens | Pain point addressed |
|------|------------|--------------|---------------------|
| 1. Start of day | Opens Vantage home (desktop) | Sees Top Work: 4 ranked items, each with a one-line "why" (e.g., "Blocks 2 people, tied to Q3 Reliability goal, due tomorrow") | P1, P7 |
| 2. Orientation | What Happened Today card | Sees that a teammate finished a dependency overnight, unblocking one of her tasks — she didn't have to ask in standup | P2, P4 |
| 3. Mid-morning | A teammate's PR review request lands; Vantage flags it as high-impact because it blocks someone else | She reprioritizes without a Slack nudge from her manager | P1, P2 |
| 4. Blocker discovered | She realizes a dependency on another team is stuck; flags it via Blocker Radar in two clicks | Her manager and the blocking party's manager see it same-day, not at next sync | P2, P3 |
| 5. End of day | Marks 3 of 4 top-work items complete; Vantage logs this toward the org's North Star metric | She leaves knowing today's work was traceably meaningful | P7 |

### 10.2 Manager journey — "Devon, Engineering Manager"

| Step | Touchpoint | What happens | Pain point addressed |
|------|------------|--------------|---------------------|
| 1. Pre-standup | Opens Team Aerial rollup instead of asking "any blockers?" live | Sees who's on track, who's flagged a blocker, and how it maps to team goals | P4, P2 |
| 2. Standup (shortened) | Uses the 2 minutes saved to actually unblock the one real issue instead of collecting status | | P4 |
| 3. Blocker escalation | Sees a cross-team blocker Priya flagged; one click nudges the other team's manager | | P2, P3 |
| 4. Weekly | Reviews team goal-linkage coverage before it becomes an exec-review surprise | | P3 |

### 10.3 Executive journey — "Marisol, VP Product"

| Step | Touchpoint | What happens | Pain point addressed |
|------|------------|--------------|---------------------|
| 1. Before leadership review | Opens Org Heat Map; sees one goal trending amber. Drills down two clicks to the specific task and team driving the risk | | P3, P4 |
| 2. In the room | Raises the specific, evidenced risk instead of asking generic status questions | | P4 |
| 3. Follow-up | Assigns attention without waiting for the next full reporting cycle | | P3 |

### 10.4 Journey-level acceptance criteria

- Every persona's journey above must be demonstrably supported end-to-end in the Phase 1 pilot (see Go/No-Go criteria, Section 21.3) — not just individually testable features.
- No journey step requires manual data entry that duplicates what a source system (calendar, task tool, OKR tool) already holds (Product Principle: connective layer, Section 5.3).

---

## 11. Assumptions

| Assumption | Impact if wrong | Confidence | Validation method | Status |
|------------|-----------------|------------|-------------------|--------|
| **A1:** Target pilot organizations already have some structured goal/OKR practice for tasks to link against | High — without this, Goal-linkage coverage (Section 7.3) can't reach the Go/No-Go threshold and the Impact Score has too little signal | Medium | Confirm during pilot-org selection (Open Questions, Section 25 #1) | Untested |
| **A2:** Employees will trust a computed score more than they trust their own judgment, if the "why" is always visible | High — this is the central product bet (Principle #3, Section 6.2) | Medium | Pilot pulse survey on perceived priority accuracy (Guardrail metric, Section 7.5) | Untested |
| **A3:** Reducing status-meeting load is something managers actively want, not something that threatens their perceived value | Medium — could face manager-level resistance despite IC/exec enthusiasm | Medium | Manager interviews during discovery (User Research, general template pattern) | Untested |
| **A4:** Source systems' APIs/webhooks provide sufficient real-time signal to hit the data-freshness SLA (Section 19.1) | High — technical feasibility of the whole product depends on this | Medium-High | Technical spike against pilot org's actual task-tool and calendar APIs before architecture lock | Untested |
| **A5:** Aggregate-only HR views (no individual scoring) will still be perceived as valuable enough to justify a dedicated HR persona/view | Medium — HR view could be deprioritized if aggregate data is judged too coarse to act on | Low-Medium | HR partner interviews once Phase 2 scoping begins | Untested |
| **A6:** A single set of default Impact Score weights (Section 12.2) will produce reasonable rankings across meaningfully different org functions (engineering vs. sales vs. support) without per-team tuning | Medium — could require earlier investment in Admin weight configuration (currently a "Could," Section 15.1) | Low | Test default weights against pilot org's real, varied task mix before Phase 1 launch | Untested |

---

## 12. Solution Overview — The Impact Graph

### 12.1 Core concept

Vantage models the organization as a directed graph rather than a set of independent lists:

Every node (task, person, goal) carries edges that let Vantage answer graph-level questions no single existing tool answers today: **"If this task slips, which goals are put at risk, and how many people down the dependency chain get blocked?"**

### 12.2 The Impact Score (v1 — transparent, explainable formula)

Per product principle #3 (transparency over black-box), v1 uses a weighted, inspectable formula, not an opaque ML ranker. Every score is shown to the user with a one-line "why," and the weights are configurable per org (with sane enterprise defaults) by an Admin.

```
Company Vision
│
▼
Strategic Objectives (annual/quarterly)
│
▼
Team / Department Goals (OKRs, KPIs)
│
▼
Initiatives / Projects
│
▼
Tasks ◄──────────────► People (owners, reviewers, blockers)
│                      │
▼                      ▼
Dependencies           Events/Signals (completions,
(task→task,             slips, comments, escalations)
 task→person,
 cross-team)
```

**Impact Score formula:**

```
ImpactScore(task) =
  W1 * GoalAlignment(task)       // how directly this task ladders to an active strategic goal
+ W2 * BlockingRadius(task)       // how many people/tasks are downstream-blocked if this slips
+ W3 * UrgencyDecay(task)         // proximity to deadline / SLA, non-linear as deadline approaches
+ W4 * StakeholderTier(task)      // weight boost if a blocked party or requester is exec-tier / customer-facing
+ W5 * RecencyOfRisk(task)        // boosts tasks tied to a goal or blocker that *newly* went red/at-risk
- W6 * StalenessPenalty(task)     // slight decay if a "top item" has been surfaced and ignored repeatedly (avoid nagging fatigue)
```

**Default weights (tunable per org):** W1=0.30, W2=0.25, W3=0.20, W4=0.10, W5=0.10, W6=0.05

**Component definitions:**

- **GoalAlignment:** distance in the graph from task → nearest active Strategic Objective, inverse-weighted (fewer hops = stronger alignment); tasks with no linked goal score 0 here (surfaced separately as a data-quality signal, not silently dropped).
- **BlockingRadius:** count and tier-weighted sum of tasks/people directly and transitively dependent on this task's completion (capped depth to avoid runaway graph walks — see Section 18.4).
- **UrgencyDecay:** a curve (not linear) so items 1 day from deadline spike sharply vs. items 3 weeks out.
- **StakeholderTier:** configurable org chart / customer-tier weighting (e.g., blocking a VP or a top-tier customer commitment raises the score) — exposed transparently, never used to infer or score a person's individual performance (see Privacy, Section 19.2).
- **RecencyOfRisk:** rewards newly at-risk items over long-standing but stable ones — avoids the list going stale.
- **StalenessPenalty:** prevents the same unaddressed item from permanently dominating the list and crowding out everything else (a known failure mode observed in the "capture 30 tasks, never reach the important ones" pattern noted in market research).

### 12.3 Why a formula, not just an LLM ranking call

- **Explainability:** every user-facing score must show its "why" (e.g., "High impact: blocks 3 people, tied to Q3 Retention Objective, due in 2 days") — a black-box ranker undermines principle #3 and #6 (shared trust in a single truth).
- **Auditability:** HR/Legal must be able to confirm the algorithm does not use protected-class or individual-performance data as inputs (see Privacy, Section 19.2).
- **Stability:** a deterministic formula is testable (Section 20) and won't silently drift between releases the way a fine-tuned ranking model might.

AI/LLM capability is still used — see Section 14.7 (AI Opportunities carried over) — but for summarization and narrative generation ("What happened today" digest, blocker explanations), not for the ranking decision itself.

### 12.4 The four core anchors, reframed as graph queries

| Anchor | What it really is | Graph query (conceptual) |
|--------|-------------------|--------------------------|
| Top work for the day | Top-N tasks owned by me ranked by Impact Score, deduplicated across source tools | `SELECT tasks WHERE owner = me AND status = open ORDER BY impact_score DESC LIMIT 5` |
| What happened today | Delta of graph state since last session, summarized by role | `events WHERE timestamp > last_session AND relevance(role) = true → LLM-summarized digest` |
| What requires immediate attention | Items where RecencyOfRisk or UrgencyDecay crossed a threshold in the last N hours, scoped to role | `tasks/goals WHERE risk_state changed_to 'at_risk' OR 'breached' in last 24h AND scope(role)` |
| Who is blocked | Direct edges blocks(me → other) and blocks(other → me) in the dependency graph | `dependencies WHERE (blocker = me OR blocked = me) AND status = unresolved` |

---

## 13. User Value Proposition by Persona

| Persona | Value proposition |
|---------|-------------------|
| IC | "I always know the 3–5 things worth doing today, and I never find out I blocked someone the hard way." |
| Manager | "I know my team's real status and blockers without a status meeting, and I can act same-day instead of next-standup." |
| Executive | "I see which goals are actually at risk — with evidence, not just a green/yellow/red gut-check — before it's a quarterly surprise." |
| Operations | "I see systemic bottlenecks and SLA risk across teams in one place, instead of stitching together five tools." |
| HR / People | "I see aggregate workload and collaboration-health signals early enough to support a team before burnout or attrition happens — without individual surveillance." |
| IT / Admin | "I can configure, govern, and audit one integration layer instead of managing ad hoc access across a dozen tools." |

---

## 14. Core Feature Set

### 14.1 Daily Aerial View (home screen — all personas, role-projected)

The four anchors rendered as a single scannable screen: Top Work, What Happened, Needs Attention, Who's Blocked — each a card with drill-down, not a wall of data.

**Acceptance criteria:** loads in <2s (p95); shows no more than 5 top-work items by default (expandable); every item shows a one-line "why" from the Impact Score; empty states are meaningful ("You're not blocking anyone — nice.") not blank.

### 14.2 Impact Graph Explorer

Visual, filterable graph view (goal → initiative → task → person) for power users (managers, ops, execs) to drill from a goal down to the exact task/person causing risk.

**Acceptance criteria:** any node navigable to its detail in ≤2 clicks; supports filtering by team, goal, risk state; performant to at least [PLACEHOLDER — org size target] nodes without degrading interaction.

### 14.3 Blocker Radar ("Who is blocked")

Live, bidirectional dependency view: who's waiting on me, who I'm waiting on, aggregated at team/org level for managers/execs/ops.

**Acceptance criteria:** a new blocker is reflected within the data-freshness SLA (p95 < 5 min, Section 7.5); resolving a blocker clears it from all affected views in real time.

### 14.4 What Happened Today (digest)

Role-aware synthesized summary of overnight/today's changes (completions, new risks, resolved blockers, goal-health shifts), generated via LLM summarization over structured events (not free-form hallucination — grounded strictly in graph events).

**Acceptance criteria:** digest generation always cites the underlying event(s) it summarizes; a "show sources" affordance is always available; no digest item may state something not traceable to a logged event.

### 14.5 Needs Immediate Attention

Cross-source escalation feed: SLA-risk, newly at-risk goals, exec-tier blockers, anything crossing a defined urgency threshold — deliberately kept short (principle #5, signal over noise).

**Acceptance criteria:** false-positive rate (items dismissed as "not actually urgent") tracked and kept under [PLACEHOLDER target]; users can tune sensitivity per team without engineering involvement.

### 14.6 Team & Org Health Views (Manager / Exec / Ops / HR)

Role-scoped rollups: manager sees team; exec sees org-wide goal-health heat map (visual pattern directly informed by the Workboard/Perdoo heat-map and strategy-map patterns validated in market research, Section 5); ops sees SLA/process risk; HR sees aggregate workload signals only.

**Acceptance criteria:** every rollup is a projection of the same underlying graph (principle #2) — no separately-maintained "manager version of the truth."

### 14.7 AI Opportunities (carried forward from general template, applied here)

| Opportunity | User problem solved | Risk tier | Human-in-the-loop point | Fallback if AI unavailable |
|-------------|---------------------|-----------|-------------------------|---------------------------|
| "What happened today" digest generation | Manually reading dozens of updates | Assistive | User can always expand to raw source events | Show raw event list, unsummarized |
| Blocker root-cause narrative ("why is this blocked, plainly") | Understanding tangled dependency chains | Assistive | Always links to underlying graph path | Show the raw dependency path without narrative |
| Natural-language task capture ("remind the design team about X by Friday") | Fast input without navigating forms | Assistive | Parsed result always shown for confirmation before creating | Manual form entry |
| Suggested weight-tuning for Impact Score (advisory only) | Orgs unsure how to weight goal-alignment vs. urgency | Advisory | Admin must explicitly accept any suggested weight change | Default weights remain unless admin changes them |
| **Explicitly excluded from MVP:** individual burnout/performance inference from behavioral data | — | Autonomous/high-risk | — | N/A — not built (see Privacy, Section 19.2 and Open Questions) |

---

## 15. MVP Scope & Prioritization

### 15.1 MVP Scope Statement

**In scope for MVP (Phase 1 pilot):** the core computed-priority loop for ICs and Managers — Daily Aerial View, Impact Score engine (default weights only), Blocker Radar, one calendar integration, one task-tracker integration, one goal/OKR-source integration, and the Manager Team Rollup view. This is the minimum set that can prove the North Star metric (Aligned Actions Completed, Section 7.2) moves and that computed priority is trusted over self-declared priority (Assumption A2, Section 11).

**Explicitly out of scope for MVP:** Executive Org Heat Map and Ops SLA Radar (fast-follow, "Should" below), HR aggregate workload view, Impact Graph Explorer, Admin weight-tuning UI, native mobile app, and — as a hard product-principle boundary rather than a sequencing choice — any individual-level performance or burnout inference (see Privacy, Section 19.2).

### 15.2 Features: Must-have vs. Nice-to-have (quick-reference summary)

| Must-have (MVP) | Nice-to-have (fast-follow or later) |
|-----------------|-------------------------------------|
| Daily Aerial View (4 anchors) for IC | Executive Org Heat Map |
| Impact Score engine v1 (transparent, default weights) | Ops SLA / Process Radar |
| Blocker Radar (IC + Manager) | HR aggregate workload view |
| Calendar + 1 task-tracker + 1 goal-source integration | Impact Graph Explorer (visual power-user view) |
| Manager Team Rollup view | Admin weight-tuning UI |
| — | Native mobile app |
| — | "What Happened Today" AI digest (judgment call — see MoSCoW below; strong candidate to pull into Must if Phase 1 timeline allows, given it directly resolves Key Pain Point P4, Section 4) |

*(This table is a simplified summary for stakeholder communication; the authoritative, rationale-backed scope decision is the full MoSCoW table in Section 15.3.)*

### 15.3 MoSCoW — MVP release scope (detailed, with rationale)

| Requirement | Must / Should / Could / Won't | Rationale |
|-------------|-------------------------------|-----------|
| Daily Aerial View (4 anchors) for IC | **Must** | Core value proposition; nothing ships without this |
| Impact Score engine (transparent formula, v1 weights) | **Must** | The differentiator; without it Vantage is just another dashboard |
| Blocker Radar (IC + Manager view) | **Must** | Second pillar of "systems thinking" bet |
| Calendar + one task-tracker integration (e.g., Jira or Asana) + one goal-tool integration (OKR system or native goal entry) | **Must** | Without real data in, the graph is empty and untrustworthy |
| Manager team rollup view | **Must** | Needed to prove cross-persona value in pilot |
| Executive org heat-map | **Should** | High value but can follow 2–4 weeks after IC/Manager MVP if needed to hit pilot date |
| Ops SLA/process radar | **Should** | Valuable but pilot can start with IC/Manager/Exec proving the core loop first |
| HR aggregate workload view | **Could** | Sensitive; benefits from extra design/legal review — can follow after trust is established |
| Impact Graph Explorer (visual power-user view) | **Could** | Nice for adoption/trust-building but not required to prove core loop |
| Admin weight-tuning UI | **Could** | Default weights may suffice for pilot; full configurability can follow |
| Individual burnout/performance inference | **Won't** | Out of scope — see Privacy, Section 19.2 |
| Native mobile app (v1 is responsive web only) | **Won't (MVP)** | Responsive web covers "quick check" use case; native app is a fast-follow candidate (Roadmap) |

### 15.4 RICE — backlog ranking (illustrative top items)

| Feature | Reach (users/mo) | Impact (1–3) | Confidence (%) | Effort (person-months) | RICE Score | Rationale |
|---------|------------------|--------------|----------------|------------------------|------------|-----------|
| Daily Aerial View | [PLACEHOLDER — all pilot users] | 3 | 90% | [PLACEHOLDER] | [PLACEHOLDER] | Core loop; everything else depends on it |
| Impact Score engine v1 | [PLACEHOLDER] | 3 | 80% | [PLACEHOLDER] | [PLACEHOLDER] | Without it there's no differentiation from existing planners |
| Blocker Radar | [PLACEHOLDER] | 2 | 75% | [PLACEHOLDER] | [PLACEHOLDER] | Second pillar of the thesis; validated as a gap in market research |
| Exec heat-map | [PLACEHOLDER] | 2 | 70% | [PLACEHOLDER] | [PLACEHOLDER] | High visibility for buyer/sponsor, moderate build cost given graph already exists |
| HR aggregate view | [PLACEHOLDER] | 1 | 50% | [PLACEHOLDER] | [PLACEHOLDER] | Sensitive; lower confidence until privacy/legal design is finalized |

*(RICE numeric inputs are placeholders — populate with real reach/effort estimates once pilot org size and engineering estimates are known.)*

### 15.5 Kano — feature classification (illustrative)

| Feature | Basic / Performance / Delighter | Evidence |
|---------|-----------------------------------|----------|
| Task list shows something today (any list at all) | Basic | Table stakes vs. every competitor in Section 5 |
| Computed, explainable Impact Score | Performance | More accurate/trustworthy ranking = directly proportional satisfaction, per market research on trust/transparency |
| Cross-team Blocker Radar | Performance | Directly addresses validated pain point (late-discovered blockers) |
| "What happened today" AI digest | Delighter | Not offered by any researched competitor; high potential to surprise/delight if grounded and accurate |
| Impact Graph Explorer visual | Delighter (for power users) / irrelevant for casual IC users | Segment appropriately — don't force it into the default IC daily view |

### 15.6 Decision framework for future feature requests

Any new feature request is evaluated against, in order: (1) does it strengthen the computed-vs-declared priority thesis (principle #1), (2) does it stay a projection of the one graph (principle #2) rather than a new silo, (3) RICE score, (4) Kano classification. Requests that fail (1) or (2) are declined regardless of RICE score, per the precedence order in Section 6.2.

---

## 16. UX / UI Design

### 16.1 Design principles (specific to Vantage, complementing Section 6.2)

- **Scannable in under a minute.** The daily view must be readable at a glance — a busy exec or IC should never need to "dig" to answer "what matters today."
- **Every number has a "why."** No score, ranking, or flag appears without a one-line, click-to-expand explanation grounded in the graph.
- **Same skeleton, different lens.** IC, Manager, and Exec views share the same four-anchor layout skeleton; only the scope and density of data change — this reinforces "one shared truth, many views" visually, not just architecturally.
- **Calm by default, urgent only when earned.** Visual urgency (color, motion, badges) is reserved strictly for the "Needs Immediate Attention" anchor — everything else uses a calm, low-chroma palette so real urgency isn't lost in visual noise.

### 16.2 Information architecture

```
Home (role-aware Aerial View)
├── Top Work for Today
│   └── Task detail (why it's ranked here, graph path, related people)
├── What Happened Today
│   └── Expand → raw source events
├── Needs Immediate Attention
│   └── Item detail → escalate / acknowledge / resolve
├── Who Is Blocked
│   ├── Blocking me
│   └── I'm blocking
├── Team View (Manager+)
│   ├── Team Aerial rollup
│   └── Team Blocker Radar
├── Org Health (Exec/Ops)
│   ├── Goal Heat Map
│   ├── SLA / Process Radar (Ops)
│   └── Impact Graph Explorer
├── People & Workload (HR — aggregate only)
└── Admin (IT)
    ├── Integrations
    ├── Roles & Permissions
    └── Impact Score weight configuration
```

### 16.3 Key screens (described at wireframe level — not final visual design)

#### Home / Daily Aerial View (IC default)

- Header: date, one-line greeting, "last updated Xm ago" freshness indicator (reinforces trust per principle #3).
- Four cards in a single-column-on-mobile / 2x2-on-desktop grid: Top Work, What Happened, Needs Attention, Who's Blocked.
- Top Work card: ranked list (max 5 visible, "show more" for the rest), each row = task name, one-line "why," quick actions (mark done / snooze / flag blocked).
- Empty/zero states are written deliberately (not "No data") to reinforce the product's voice and avoid feeling broken.

#### Manager Team View

- Same skeleton, scoped to team; adds a roster strip showing each report's top-work completion status and any blockers they're flagging, without exposing granular task-level surveillance language.

#### Exec Org Heat Map

- Grid/treemap of goals colored by health (on-track / at-risk / breached), sized by strategic weight; click-through to the specific tasks/people driving risk. Directly informed by the heat-map pattern validated in Workboard/Perdoo research (Section 5.1).

#### Blocker Radar (all personas, scoped)

- Two-column layout: "Blocking me" / "I'm blocking," each row shows the other party, the task, days blocked, and a one-click nudge/escalate action.

### 16.4 UI guidelines (data-density and states)

- Every component must define: default, loading, empty, error, partial-data (e.g., one integration synced but another failed), and no-permission states — no exceptions (see Section 19 checklist).
- Data-dense views (heat map, graph explorer) must offer a "focus mode" that reduces to just the current risk items, for cognitive-load management (per general UX-strategy pattern of progressive disclosure).

### 16.5 Accessibility

WCAG 2.2 AA target. Special attention items for this product specifically: the Impact Score and heat-map color coding must never rely on color alone (pair with icon/text labels — e.g., "At risk" label plus icon, not just red fill); the graph explorer must have a data-table fallback view for screen-reader users (per general accessibility checklist pattern).

---

## 17. System Architecture

### 17.1 High-level architecture

```
┌──────────────────────────┐
│      Web Client          │
│ (Role-aware Aerial UI)   │
└────────────┬─────────────┘
             │ HTTPS/GraphQL
┌────────────▼─────────────┐
│   API Gateway / BFF      │
└────────────┬─────────────┘
             │
┌────────────┼─────────────────────────────────────────────┐
│            │                                             │
┌───────▼────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
│ Graph Service  │  │ Impact Score Engine│  │ Digest/Narrative   │
│ (goals, tasks, │◄─┤ (scoring workers, │  │ Service (LLM-      │
│ people, deps)  │  │ batch + on-demand) │  │ grounded summary)  │
└───────┬────────┘  └─────────┬─────────┘  └─────────┬─────────┘
        │                     │                      │
        │            ┌────────▼─────────┐            │
        │            │ Event/Signal Bus │◄───────────┘
        │            │ (change data capture)│
        │            └────────┬─────────┘
        │                     │
┌───────▼─────────────────────▼──────────────────────────────┐
│              Integration Layer (connectors)                 │
│ Calendar │ Task/PM tools │ OKR/Goal tools │ HRIS │ Chat    │
└────────────────────────────────────────────────────────────┘
```

### 17.2 Data model (core entities)

| Entity | Key attributes | Source of truth |
|--------|----------------|-----------------|
| Person | id, name, role, team, manager_id, tier | Synced from HRIS/IdP (system-of-record external) |
| Goal | id, title, level (Company/Team/Individual), parent_goal_id, health_status, owner_id | Native (or synced from OKR tool if integrated) |
| Task | id, title, owner_id, linked_goal_id, due_date, status, source_system, impact_score (computed, cached) | Synced from task/PM tool(s); Vantage is not the primary task editor in v1 |
| Dependency | id, blocker_task_id or blocker_person_id, blocked_task_id or blocked_person_id, status, flagged_at, resolved_at | Native (user-flagged + inferred from linked systems where available) |
| Event | id, entity_type, entity_id, event_type, timestamp, payload | Native — append-only event log, drives digest + recency scoring |
| ImpactScoreSnapshot | task_id, score, component_breakdown (json), computed_at | Native — recomputed on relevant graph changes, versioned for auditability |

**Multi-tenancy:** row-level tenant isolation (`org_id` on every table) as the default strategy for v1, given moderate per-tenant scale expectations at pilot stage; revisit schema-per-tenant if a large regulated customer requires stronger isolation guarantees (flag in Open Questions).

### 17.3 Key architecture decisions (ADR summary)

| Decision | Context | Alternatives considered | Rationale |
|----------|---------|------------------------|-----------|
| Event-sourced signal bus feeding both scoring engine and digest service | Need consistent "what changed" data for both ranking and summarization | Point-to-point sync between each integration and each consumer service | Single source of truth for "what happened," avoids N×M integration complexity, matches principle #2 |
| Impact Score computed server-side, cached, recomputed on relevant graph mutation (not purely on-request) | Score must be fast to render (p95 targets, Section 19) but also fresh | Compute entirely on-request; compute purely on a fixed schedule | Hybrid gives freshness (Section 7.5 SLA) without paying full computation cost on every page load |
| Vantage is not the primary system-of-record for tasks in v1 (reads/writes back to source tools via API) | Avoid becoming "yet another tool" employees must duplicate-enter into | Build native task management from scratch | Faster time-to-value, lower adoption friction, consistent with "connective layer" positioning (Section 5.3) |
| BFF (Backend-for-Frontend) layer per role-projection rather than one generic API | Different personas need different shaped, differently-scoped data from the same graph | Single generic REST API with client-side filtering | Keeps permission-scoping and payload size correct server-side; avoids leaking org-wide data to a client that then just hides it in the UI (security risk) |

---

## 18. Technical Implementation Plan ("Code")

This section translates the architecture into a concrete build plan: stack choices, module breakdown, API surface, and the core scoring algorithm — enough for engineering to scope and begin design without dictating implementation details that belong to engineering's own technical design docs.

### 18.1 Suggested technology stack (proposal — confirm with engineering during architecture review, Section 17.3 decisions assumed)

| Layer | Suggested approach | Rationale |
|-------|-------------------|-----------|
| Web client | Component-based SPA framework (e.g., React) with a design-system component library (see general Design System Considerations) | Enterprise SaaS standard; supports the role-projected, componentized UI in Section 16 |
| API layer | GraphQL BFF per persona-projection, or a single GraphQL schema with role-based field resolution | Matches ADR in Section 17.3 — lets each view request exactly the shaped data it needs from one graph |
| Graph/domain service | Service with a graph-friendly data store or a relational store with well-indexed adjacency tables, depending on org-size scale needs | Confirm with engineering: a dedicated graph database may be justified at large multi-tenant scale; relational may suffice for pilot scale — this is an explicit build-vs-buy/tech decision to validate, not assumed (Open Questions) |
| Event bus | Managed event-streaming/message-queue service | Decouples integrations from scoring/digest consumers per ADR |
| Impact Score engine | Background worker pool triggered by relevant graph-mutation events + a light on-demand recompute path for freshness edge cases | Matches hybrid caching ADR |
| Digest/narrative service | LLM API call constrained to a structured-event context window with citation requirements (no free-generation) | Enforces principle #3 (transparency); prevents hallucinated "what happened" content |
| Integration layer | Connector framework (calendar, task/PM tools, OKR tools, HRIS, chat) built to a common internal event schema | Enables adding new integrations without re-plumbing scoring/digest logic |
| Auth | Enterprise SSO (SAML/OIDC), SCIM for provisioning | Standard enterprise SaaS requirement; feeds Person entity sync |

### 18.2 Module breakdown

1. **Integration Connectors** — one module per external system; responsible for auth, polling/webhook ingestion, and mapping external data to Vantage's internal event schema.
2. **Graph Service** — owns Goal/Task/Person/Dependency entities and their relationships; exposes internal APIs for read/write by other services.
3. **Event/Signal Bus** — append-only event log; single point of truth for "what changed" consumed by both scoring and digest modules.
4. **Impact Score Engine** — implements the formula in Section 12.2; recomputes affected scores on relevant events; stores versioned snapshots for auditability.
5. **Digest/Narrative Service** — generates the "What Happened Today" and blocker-explanation content, strictly grounded in Event Bus data with citations back to source events.
6. **BFF / API Layer** — role-aware projections of the graph into the shapes each persona's UI needs; enforces permission scoping server-side.
7. **Admin/Config Service** — integration setup, role/permission mapping, Impact Score weight configuration, audit log access.
8. **Web Client** — the role-projected UI described in Section 16.

### 18.3 Core Impact Score computation — pseudocode

**Explainability requirement:** `component_breakdown` is always persisted and always surfaced in the UI's "why this matters" expansion (Section 16.3) — never computed and then discarded, per principle #3.

```javascript
function computeImpactScore(task, graph, weights):
  goal_alignment    = graphDistanceScore(task, graph.nearestActiveGoal(task))
  blocking_radius   = weightedDownstreamCount(task, graph, max_depth=CONFIG.max_traverse_depth)
  urgency           = urgencyDecayCurve(task.due_date, now())
  stakeholder_tier  = maxTierOf(graph.blockedParties(task) union graph.requesters(task))
  recency_of_risk   = recentRiskTransitionBoost(task, graph.eventsSince(task, hours=24))
  staleness         = stalenessPenalty(task, graph.surfacedButIgnoredCount(task))

  score = (weights.W1 * goal_alignment
         + weights.W2 * blocking_radius
         + weights.W3 * urgency
         + weights.W4 * stakeholder_tier
         + weights.W5 * recency_of_risk
         - weights.W6 * staleness)

  return ImpactScoreSnapshot(
    task_id = task.id,
    score = clamp(score, 0, 100),
    component_breakdown = {goal_alignment, blocking_radius, urgency,
                           stakeholder_tier, recency_of_risk, staleness},
    computed_at = now()
  )
```

### 18.4 Performance/scale guardrails baked into the algorithm

- `max_traverse_depth` is a configurable cap on graph-walk depth for BlockingRadius to bound computation cost as org graphs grow — default [PLACEHOLDER, to be tuned against pilot org's actual graph density].
- Recompute triggers are event-driven and scoped (only affected subgraphs recompute), not a full nightly recompute of every task in the org, to keep the freshness SLA (p95 < 5 min, Section 7.5) achievable at scale.

### 18.5 API design summary (representative endpoints — full spec belongs in a separate OpenAPI/GraphQL schema document)

| Operation | Purpose | Auth scope |
|-----------|---------|------------|
| `GET /me/aerial-view` | Returns the current user's four-anchor daily view | User (self) |
| `GET /teams/{team_id}/aerial-view` | Manager rollup | Manager of team or above |
| `GET /orgs/{org_id}/goal-health` | Exec heat-map data | Exec/Ops role |
| `GET /tasks/{task_id}/impact-explanation` | Component breakdown for a given task's score | Anyone with view access to the task |
| `POST /dependencies` | Flag a new blocker relationship | User (self, for tasks they own or are blocked by) |
| `POST /admin/integrations` | Configure a new connector | Admin |
| `PATCH /admin/impact-weights` | Adjust org-level scoring weights | Admin (logged, versioned change) |

### 18.6 Build sequencing (maps to Roadmap, Section 24)

1. Graph Service + one calendar + one task-tool connector + Event Bus (foundation — nothing else works without real data flowing).
2. Impact Score Engine v1 (default weights) + Daily Aerial View (IC) — prove the core loop end-to-end.
3. Dependency flagging + Blocker Radar (IC/Manager).
4. Manager Team Rollup view.
5. Digest/Narrative Service ("What Happened Today").
6. Exec Org Heat Map.
7. Admin weight configuration, Ops/HR views, Impact Graph Explorer (fast-follow per MoSCoW Should/Could).

---

## 19. Non-Functional Requirements

### 19.1 Performance, scalability, reliability

| Category | Requirement | Target | Verification |
|----------|-------------|--------|--------------|
| Performance | Daily Aerial View load time | p95 < 2s | Synthetic + RUM monitoring |
| Performance | Impact Score freshness | p95 < 5 min from triggering event | Event-to-score-update latency monitoring |
| Scalability | Concurrent org size supported (v1) | [PLACEHOLDER — e.g., orgs up to 5,000 employees] | Load testing against realistic graph density, not just node count |
| Reliability | Platform availability | 99.9% | Uptime monitoring, incident postmortems |
| Reliability | Degraded-mode behavior when an integration is down | Show last-known-good data with a visible staleness indicator, never a blank screen | Manual + automated failure-injection testing |

### 19.2 Security & Privacy (elevated importance — this product touches org-wide work and people data)

- **Permission model:** role- and scope-based access; an IC never sees another IC's individual task-level detail unless explicitly a stakeholder/blocker relationship exists; managers see their direct/indirect reports' scoped data only; HR sees aggregate, team-level signals only — no individual-level workload or "burnout risk" scoring is computed or exposed in v1.
- **Explicit non-goal:** Vantage does **not** compute individual performance scores, productivity rankings, or burnout-risk inferences from behavioral data. The Impact Score ranks **tasks**, not people. This is a product principle boundary, not just a feature gap — reconfirm with Legal/HR before any future roadmap item touches this line (see Open Questions).
- **Data classification:** Person, Goal, Task, Dependency, and Event data classified per the general Privacy framework (Public/Internal/Confidential/Restricted); HRIS-sourced fields (e.g., compensation, if ever synced) are explicitly out of scope for v1 ingestion.
- **Encryption:** at rest and in transit, per standard enterprise SaaS baseline.
- **Auth:** SSO/SAML/OIDC required for enterprise deployment; SCIM provisioning to keep the Person graph in sync with HRIS as the source of truth for org structure.
- **Audit logging:** all admin actions (weight changes, integration config, permission changes) logged and reviewable.
- **Compliance:** SOC 2 Type II readiness required before any GA enterprise sale; data residency requirements to be assessed per target customer geography (Section 34 pattern from general template applies here).

### 19.3 Accessibility

WCAG 2.2 AA, with the specific attention items noted in Section 16.5 (color-independent status indicators, data-table fallback for the graph explorer).

---

## 20. Testing Strategy & QA

### 20.1 Test approach by layer

| Test type | Scope | Notes specific to Vantage |
|-----------|-------|----------------------------|
| Unit | Impact Score formula components, urgency decay curve, staleness penalty | Formula must be unit-tested for edge cases (task with no linked goal, task with circular dependency, task with no due date) |
| Integration | Connector → Event Bus → Graph Service → Score Engine pipeline | Test with realistic, messy source data (missing fields, duplicate tasks across tools) not just clean fixtures |
| End-to-end | Full daily-view render for each persona role | Verify role-scoping — an IC test account must never receive another team's data in any response payload |
| Permission/security | Cross-persona access boundary testing | Explicit test matrix: every persona pair × every view, confirming scope enforcement (see Section 43 general pattern) |
| Explainability regression | Every surfaced score/ranking must have a non-empty, accurate component_breakdown | Automated check that no score ships without its explanation payload |
| Load/performance | Realistic org-graph density at target scale (Section 19.1) | Synthetic org generator that produces realistic (not toy) dependency density for load testing |
| Digest grounding | LLM-generated "What Happened Today" content | Automated + manual check that every generated sentence traces to a cited source event; flag/block ungrounded generation |

### 20.2 Pre-release QA checklist (release-specific additions to the general checklist)

- Impact Score explainability payload present and accurate for a sample of real pilot-org tasks
- Cross-persona permission boundaries verified for all 6 personas
- Digest content spot-checked against source events for grounding accuracy
- Degraded-mode (integration-down) behavior verified for each connector
- HR aggregate view confirmed to expose no individual-level data (manual security review sign-off required)
- Accessibility checklist (Section 16.5 / Section 23 general pattern) completed for new/changed UI

---

## 21. Deployment & Release Plan

### 21.1 Phased rollout

| Phase | Scope | Goal |
|-------|-------|------|
| Phase 0 — Internal dogfood | Vantage's own product/eng team | Validate core loop end-to-end before any customer sees it |
| Phase 1 — Design partner pilot | 1–2 teams (mixed IC/Manager/Exec) at a single design-partner org, 1 task-tool + 1 calendar integration | Prove the North Star metric (Aligned Actions Completed) moves and trust in computed priority holds |
| Phase 2 — Single-org expansion | Full org rollout at the design-partner company, all personas including Ops/HR views | Prove cross-persona value and reduced status-meeting load (Business Objectives, Section 7.1) |
| Phase 3 — Multi-tenant GA | Additional enterprise customers | Requires SOC 2 readiness, admin self-service integration setup, documented onboarding |

### 21.2 Deployment approach

- Canary/staged rollout per tenant (never all customers simultaneously), consistent with general Deployment Strategy pattern.
- Feature-flag every major surface (Blocker Radar, Digest, Exec Heat Map) to allow per-org staged enablement and fast kill-switch if an integration or scoring issue is discovered.
- **Migration/rollback:** since Vantage is not the primary system-of-record for tasks (Section 17.3), rollback risk is lower than a typical system-of-record migration — worst case is disabling Vantage's UI/scoring while source systems remain unaffected. Document this explicitly in the rollback runbook so on-call responders know the blast radius is contained.

### 21.3 Go/No-Go criteria (Phase 1 pilot)

- Goal-linkage coverage ≥ 70% in pilot org's synced data (below this, the Impact Score has too little signal to be trustworthy)
- Data freshness SLA met in staging against pilot org's real integration volume
- Security/permission boundary testing (Section 20.1) passed for all pilot personas
- Pilot sponsor and at least one representative from each pilot persona has reviewed and accepted the "why this matters" explanation quality in a live walkthrough

---

## 22. Metrics to Track Performance

(Consolidates and operationalizes Section 7; this is the dashboard spec for ongoing tracking post-launch.)

### 22.1 North Star dashboard

- **Aligned Actions Completed** (weekly trend, org-wide and per-team) — the single number the pilot sponsor and product team watch first.

### 22.2 Supporting KPI dashboard (per Section 7.3)

Tracked weekly, segmented by team and by persona role, with week-over-week trend lines:

- Blocker time-to-resolution
- Goal-linkage coverage
- Daily plan adoption
- Manager team-view engagement
- Exec heat-map engagement

### 22.3 Guardrail dashboard (per Section 7.5)

Tracked continuously with alert thresholds:

- Perceived priority accuracy (pulse survey)
- Notification mute rate
- Data freshness p95

### 22.4 Instrumentation requirements

Every metric above must have: a named event or computed field in the Event/Graph store (Section 17.2), a defined owner, and QA verification before the metric is trusted in a leadership review (per general Analytics section pattern) — no metric ships as "directional only" without being explicitly labeled as such.

### 22.5 Review cadence

| Cadence | Audience | Content |
|---------|----------|---------|
| Weekly | Product/Eng team | North Star + KPI trend, bug/defect review |
| Bi-weekly | Pilot sponsor + Ops lead | Business Objectives progress (Section 7.1), qualitative pilot feedback |
| Quarterly | Executive sponsor / steering committee | OKR progress (Section 7.4), Risk register review (Section 23), Roadmap check-in |

---

## 23. Risks & Mitigations

| Risk | Category | Likelihood | Impact | Mitigation | Owner |
|------|----------|------------|--------|------------|-------|
| Employees distrust a computed priority score and revert to self-declared lists | Adoption | Medium | High | Transparent "why" on every score (principle #3); pilot walkthroughs before rollout; allow logged, visible overrides rather than forcing blind trust | Product/Design |
| Integration data is too messy/incomplete for the Impact Score to be meaningful (low goal-linkage coverage) | Technical/Data | Medium-High | High | Go/No-Go gate on goal-linkage coverage (Section 21.3); start pilot with orgs that already have reasonably mature OKR hygiene | Product/Eng |
| Perceived as a surveillance/monitoring tool by ICs, causing resistance | Adoption/Trust | Medium | High | Explicit non-goal on individual performance scoring (Section 19.2), communicated clearly during rollout; HR view strictly aggregate | Product/HR partner |
| "Needs Immediate Attention" becomes noisy and gets muted, undermining the core value prop | Product | Medium | Medium | Guardrail metric on mute rate (Section 7.5); conservative default thresholds, org-tunable sensitivity | Product |
| Scoring formula games poorly against edge cases (e.g., tasks with no goal link dominate or vanish unfairly) | Technical | Medium | Medium | Formula unit testing on edge cases (Section 20.1); staged rollout catches issues before org-wide exposure | Engineering |
| Graph-walk performance degrades at large org scale | Technical | Medium | Medium | Max-depth caps and event-scoped recompute (Section 18.4); load testing before Phase 3 GA | Engineering |
| Regulatory/compliance requirement (data residency, SOC 2) blocks a target customer post-pilot | Compliance | Medium | High | Begin SOC 2 readiness work in parallel with Phase 1/2, not after (Section 19.2) | Compliance/Eng |

---

## 24. Roadmap

**Now (MVP / Phase 1 pilot — committed):** Daily Aerial View (IC), Impact Score engine v1, Blocker Radar (IC/Manager), one calendar + one task-tool + one goal-source integration, Manager Team Rollup.

**Next (Phase 2, directional):** What Happened Today digest, Exec Org Heat Map, Ops SLA Radar, Admin weight configuration.

**Later (exploratory, contingent on Phase 1/2 learnings):** HR aggregate workload view (contingent on privacy/legal sign-off), Impact Graph Explorer, native mobile app, additional integrations (chat tools, CRM, ticketing systems), ML-assisted (advisory-only) weight tuning.

| Roadmap item | Horizon | Confidence | Linked objective |
|--------------|---------|------------|------------------|
| Daily Aerial View + Impact Score v1 | Now | Committed | North Star: Aligned Actions Completed |
| Blocker Radar | Now | Committed | Business Objective: reduce blocker surfacing time |
| Digest + Exec Heat Map | Next | Directional | Business Objective: reduce status-meeting load |
| HR aggregate view | Later | Exploratory — contingent on legal/privacy review | JTBD: HR early-warning without surveillance |
| Native mobile | Later | Exploratory | Adoption strategy fast-follow |

---

## 25. Open Questions

| # | Question | Owner | Needed by | Impact if unresolved |
|---|----------|-------|-----------|---------------------|
| 1 | Should the initial pilot org be selected based on existing OKR/goal-tracking maturity, given the goal-linkage-coverage Go/No-Go gate (Section 21.3)? | Product/Sales | Before pilot org selection | Low-maturity pilot org risks an unfairly weak first impression of the Impact Score |
| 2 | Is a dedicated graph database justified at pilot scale, or does a well-indexed relational model suffice (Section 18.1)? | Engineering | Before architecture finalization | Wrong choice adds either premature complexity or costly re-architecture later |
| 3 | What is the final legal/HR-approved boundary for any future HR-facing feature — confirm the "aggregate only, never individual" line is acceptable long-term product strategy, not just an MVP simplification | Legal/HR/Product | Before Phase 2 HR view scoping | Risk of building toward a feature that legal ultimately blocks |
| 4 | Multi-tenancy isolation strategy — is row-level isolation sufficient for target enterprise customers' security requirements, or will a large prospect require schema-per-tenant? | Engineering/Security/Sales | Before Phase 3 GA architecture lock | Retrofitting stronger isolation later is expensive |
| 5 | Worxmate and Workboard blocker/heatmap feature teardown (Section 5.4) — not yet completed | Product/Design | Before Phase 1 UI finalization | Risk of unknowingly under- or over-differentiating from the closest competitors |
| 6 | Internal baseline data collection (time-to-surface blockers, status-meeting hours) — not yet run | Ops/Product | Before Business Objectives baselines can be finalized (Section 7.1) | Cannot prove ROI without a real baseline |

---

## 26. Appendix

### 26.1 Glossary

| Term | Definition |
|------|------------|
| Impact Score | The computed, transparent numeric ranking of a task's organizational importance (Section 12.2) |
| Aerial View | The role-projected daily home screen showing the four core anchors |
| Blocker Radar | The bidirectional dependency view showing who is blocked by whom |
| Impact Graph | The underlying goal → initiative → task → person → dependency data model (Section 12.1) |
| Aligned Actions Completed | The product's North Star metric (Section 7.2) |
| Goal-linkage coverage | % of active tasks with a non-null link to an active organizational goal |

### 26.2 Related research (sources cited in Section 5)

- Saner.AI — "Planning AI Apps: We tested the Best 6 in 2026" (saner.ai)
- Sintra — "Best Planner Apps for 2026" (sintra.ai)
- Lifestack — "Best AI Planner Apps in 2026: 7 Tools Tested" (lifestack.ai)
- Morgen — "10 Best AI Planning Assistants in 2026" (morgen.so)
- Any.do — "The Best AI Daily Planner App in 2026" (any.do)
- Goals & Progress — "Best Prioritization Apps: 10 Tools Compared (2026)" (goalsandprogress.com)
- Tempo — "Best OKR software to align goals and track progress" (tempo.io)
- BusinessMap — "15 Best OKR Software to Use in 2026" (businessmap.io)
- Planisware — "Top OKR and Strategy Execution Software for 2026" (planisware.com)
- Mooncamp — "27 Best OKR Software in 2026: My Honest Review" (mooncamp.com)
- OKRsTool — "OKR Software: 37 Tools Compared" and "14 Best Goal Setting Software and OKR Platforms" (okrstool.com)
- PeopleGoal — "11 Best OKR Software for Goal Alignment and Performance" (peoplegoal.com)

### 26.3 Version history

| Version | Date | Author | Summary of changes |
|---------|------|--------|-------------------|
| v1.0 | 2026-08-08 | [PLACEHOLDER] | Initial end-to-end PRD for Vantage concept |
| v1.1 | 2026-08-08 | [PLACEHOLDER] | Added Target Users (3), Key Pain Points (4), User Journey (10), and Assumptions (11) as explicit sections; restructured Section 15 into MVP Scope & Prioritization with an explicit MVP Scope Statement and a Must-have/Nice-to-have summary table; renumbered all sections and cross-references accordingly |
