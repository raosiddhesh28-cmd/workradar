# WorkRadar MVP — Implementation Plan

**Status:** Awaiting approval — do not implement until approved.

**Source of truth:** [`docs/WORKRADAR_PRD.md`](./WORKRADAR_PRD.md)

**Stack (approved direction):** TypeScript, React, Next.js (App Router), Tailwind CSS, shadcn/ui, mock repositories, deterministic Impact Score engine, no external integrations, no production backend.

---

## 1. Proposed Architecture

### High-level pattern

A **client-first Next.js application** with a **domain layer** that mirrors the PRD's Impact Graph architecture, backed by **in-memory mock repositories** behind clean interfaces. The Impact Score engine runs **deterministically on the server** (Next.js Route Handlers or Server Actions) so scoring logic is testable, versionable, and not duplicated in the browser.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Web Client                        │
│  (Role-aware Aerial UI, drill-downs, task actions)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch / server actions
┌──────────────────────────▼──────────────────────────────────┐
│              Application / BFF Layer (Next.js)               │
│  aerial-view.service · blocker.service · digest.service       │
│  (role projections, permission scoping, view shaping)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────────┐
│ Graph Service │  │ Impact Score  │  │ Event / Digest    │
│ (domain CRUD  │◄─┤ Engine        │  │ Service           │
│  + queries)   │  │ (deterministic│  │ (structured events│
└───────┬───────┘  │  formula v1)  │  │  → digest items)  │
        │          └───────────────┘  └───────────────────┘
        ▼
┌─────────────────────────────────────────────────────────────┐
│              Repository Interfaces (ports)                   │
│  ITaskRepo · IGoalRepo · IPersonRepo · IDependencyRepo ·    │
│  IEventRepo · ICalendarRepo                                  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         Mock Adapters (in-memory, seeded JSON)               │
│  Simulates: task tracker · OKR tool · calendar · HRIS/org    │
└─────────────────────────────────────────────────────────────┘
```

### Architectural decisions (MVP)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend | Next.js server layer only (no separate API service) | PRD allows BFF pattern; MVP needs no production backend |
| Data store | In-memory singleton seeded from fixtures | Fast iteration; interfaces allow swap to real DB later |
| Scoring location | Server-side module, cached per request/session | Matches PRD ADR (server-computed, cached); unit-testable |
| Auth | Mock session switcher (persona picker) | Demonstrates role-aware behavior without SSO |
| Digest | **Structured event list** with optional template summaries (no LLM in MVP) | PRD §14.4 prefers LLM but §14.7 mandates raw-event fallback; MVP uses fallback per user constraint |
| Integrations | Mock adapters implementing repository ports | PRD §15.3 lists integrations as Must for pilot; user explicitly defers real integrations — mocks satisfy "behaves as though integrations exist" |
| State | React Server Components + minimal client state for actions | Keeps UI fast; mutations via Server Actions updating in-memory store |

### Domain boundaries

- **`domain/`** — entities, value objects, graph queries, Impact Score pure functions (no React, no Next.js)
- **`application/`** — use cases: `getAerialView`, `getBlockerRadar`, `flagBlocker`, `completeTask`
- **`infrastructure/`** — mock repositories, seed data, session context
- **`app/`** — Next.js routes, layouts, page composition
- **`components/`** — presentational UI only; no business rules

---

## 2. Folder Structure

```
workradar/
├── docs/
│   ├── WORKRADAR_PRD.md
│   └── MVP_IMPLEMENTATION_PLAN.md
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout, fonts, theme
│   │   ├── page.tsx                   # Redirect → /aerial
│   │   ├── aerial/
│   │   │   └── page.tsx               # IC Daily Aerial View (default home)
│   │   ├── team/
│   │   │   └── page.tsx               # Manager Team Rollup (Phase 2 in build)
│   │   ├── tasks/
│   │   │   └── [id]/page.tsx          # Task detail + impact explanation
│   │   ├── blockers/
│   │   │   └── page.tsx               # Full Blocker Radar drill-down
│   │   └── api/
│   │       └── aerial/route.ts        # Optional REST mirror of server actions
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives
│   │   ├── aerial/
│   │   │   ├── AerialView.tsx         # Four-anchor grid shell
│   │   │   ├── TopWorkCard.tsx
│   │   │   ├── WhatHappenedCard.tsx
│   │   │   ├── NeedsAttentionCard.tsx
│   │   │   └── WhoIsBlockedCard.tsx
│   │   ├── impact/
│   │   │   ├── ImpactScoreBadge.tsx
│   │   │   ├── ImpactExplanation.tsx  # Component breakdown + one-line why
│   │   │   └── GoalPathBreadcrumb.tsx
│   │   ├── blockers/
│   │   │   ├── BlockerList.tsx
│   │   │   └── BlockerRow.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── PersonaSwitcher.tsx    # Mock role/session switcher
│   │   │   └── FreshnessIndicator.tsx
│   │   └── shared/
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSkeleton.tsx
│   │       └── RiskBadge.tsx
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── person.ts
│   │   │   ├── goal.ts
│   │   │   ├── initiative.ts
│   │   │   ├── task.ts
│   │   │   ├── dependency.ts
│   │   │   └── event.ts
│   │   ├── graph/
│   │   │   ├── impact-graph.ts        # Graph traversal utilities
│   │   │   └── goal-path.ts           # Task → goal chain resolution
│   │   ├── scoring/
│   │   │   ├── impact-score.ts        # Main compute function
│   │   │   ├── components/
│   │   │   │   ├── goal-alignment.ts
│   │   │   │   ├── blocking-radius.ts
│   │   │   │   ├── urgency-decay.ts
│   │   │   │   ├── stakeholder-tier.ts
│   │   │   │   ├── recency-of-risk.ts
│   │   │   │   └── staleness-penalty.ts
│   │   │   ├── weights.ts             # Default W1–W6
│   │   │   └── explain.ts             # One-line "why" + breakdown DTO
│   │   └── types/
│   │       └── enums.ts               # GoalHealth, TaskStatus, PersonaRole, etc.
│   ├── application/
│   │   ├── services/
│   │   │   ├── aerial-view.service.ts
│   │   │   ├── blocker-radar.service.ts
│   │   │   ├── digest.service.ts
│   │   │   └── attention.service.ts
│   │   └── dto/
│   │       ├── aerial-view.dto.ts
│   │       └── task-detail.dto.ts
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   ├── interfaces.ts          # Port definitions
│   │   │   ├── mock-task.repository.ts
│   │   │   ├── mock-goal.repository.ts
│   │   │   ├── mock-person.repository.ts
│   │   │   ├── mock-dependency.repository.ts
│   │   │   ├── mock-event.repository.ts
│   │   │   └── mock-calendar.repository.ts
│   │   ├── seed/
│   │   │   ├── org-acme.ts              # Single org fixture assembler
│   │   │   ├── people.ts
│   │   │   ├── goals.ts
│   │   │   ├── initiatives.ts
│   │   │   ├── tasks.ts
│   │   │   ├── dependencies.ts
│   │   │   └── events.ts
│   │   ├── session/
│   │   │   └── mock-session.ts          # Current user + role context
│   │   └── container.ts               # DI wiring: repos → services
│   └── lib/
│       ├── utils.ts
│       └── format.ts                    # Relative time, score display
├── tests/
│   ├── unit/
│   │   ├── scoring/                     # Impact Score component tests
│   │   └── graph/
│   └── integration/
│       └── aerial-view.test.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── vitest.config.ts
```

---

## 3. Domain Model

### Entity relationship (Impact Graph)

```
Company (implicit, single tenant in MVP)
  └── StrategicObjective (Goal level: company)
        └── TeamGoal (Goal level: team)
              └── Initiative
                    └── Task ──linked_goal_id──► Goal (any level)
                          │
                          ├── owner_id ──► Person
                          ├── dependencies ──► Dependency edges
                          └── events ──► Event log

Person
  ├── role: IC | MANAGER | EXECUTIVE | OPS | HR | ADMIN
  ├── tier: IC | MANAGER | DIRECTOR | VP | C_LEVEL
  ├── team_id
  └── manager_id (org tree)

Dependency
  ├── blocker: task_id | person_id
  ├── blocked: task_id | person_id
  ├── status: unresolved | resolved
  └── flagged_at, resolved_at

Event
  ├── entity_type: task | goal | dependency | person
  ├── event_type: completed | blocked | unblocked | goal_health_changed | ...
  ├── timestamp
  └── payload (typed JSON)
```

### Core types (sketch)

```typescript
type GoalLevel = 'company' | 'team' | 'individual';
type GoalHealth = 'on_track' | 'at_risk' | 'breached';
type TaskStatus = 'open' | 'in_progress' | 'done' | 'deferred';
type PersonaRole = 'ic' | 'manager' | 'executive' | 'ops' | 'hr' | 'admin';
type StakeholderTier = 'ic' | 'manager' | 'director' | 'vp' | 'c_level' | 'customer';

interface ImpactScoreSnapshot {
  taskId: string;
  score: number;                    // 0–100 clamped
  componentBreakdown: {
    goalAlignment: number;
    blockingRadius: number;
    urgency: number;
    stakeholderTier: number;
    recencyOfRisk: number;
    staleness: number;
  };
  oneLineWhy: string;             // Always present — PRD §16.1
  computedAt: string;
}
```

### Privacy boundary (enforced in model + queries)

- Impact Score attaches to **tasks only**, never to persons.
- No `productivityScore`, `burnoutRisk`, or person rankings.
- Manager views show team rollup and blocker status — not "who is underperforming."

---

## 4. Mock Data Model

### Fictional org: **Acme Corp** (~25 people, 4 teams)

| Team | Focus | Sample narrative |
|------|-------|------------------|
| Platform Engineering | Reliability, infra | Cross-team API dependency blocking Mobile |
| Product / Design | Launch features | Q3 Retention goal at risk |
| Customer Success | Enterprise accounts | SLA-sensitive ticket chain |
| Revenue Ops | Pipeline tooling | Sales blocked on data integration |

### Seed data targets

| Entity | Count | Purpose |
|--------|-------|---------|
| People | ~25 | ICs, 4 managers, 1 VP (exec), mixed tiers |
| Goals | ~8 | 2 company objectives, 4 team goals, 2 at-risk |
| Initiatives | ~6 | Bridge goals → tasks |
| Tasks | ~40–50 | Mix of open/done/deferred; **≥90% goal-linked** (PRD Go/No-Go ≥70%) |
| Dependencies | ~15 | Cross-team blockers, resolved + unresolved |
| Events | ~30 | Last 24–48h: completions, new blockers, goal health shifts |

### Demonstration scenarios (baked into fixtures)

1. **Priya (Senior Engineer)** — 4 top-work items; one blocks 2 people; tied to Q3 Reliability goal; due tomorrow.
2. **Cross-team blocker** — Platform API migration blocks Mobile team's release task (3 days blocked).
3. **At-risk goal** — "Improve Q3 Retention" flips `at_risk` yesterday → boosts RecencyOfRisk on linked tasks.
4. **Completed overnight** — Teammate completes dependency → event unblocks Priya's task (shows in What Happened).
5. **Urgent SLA item** — Customer Success task due in <24h with high UrgencyDecay.
6. **Stale top item** — One task surfaced 5× without action → StalenessPenalty visible in breakdown.
7. **Manager (Devon)** — 3 reports with mixed blocker states for Team Rollup (Phase 2 screen).

### Mock adapter interfaces

```typescript
interface ITaskRepository {
  findByOwner(personId: string): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  findOpen(): Promise<Task[]>;
  updateStatus(id: string, status: TaskStatus): Promise<Task>;
}

interface IGoalRepository {
  findAll(): Promise<Goal[]>;
  findById(id: string): Promise<Goal | null>;
  findActive(): Promise<Goal[]>;
}

// Similar ports for Person, Dependency, Event, Calendar
```

Source system metadata on tasks (`source_system: 'mock-jira' | 'mock-asana'`) preserves PRD's multi-tool dedup story without real integrations.

---

## 5. Impact Score Architecture

### Formula (PRD §12.2 — verbatim weights)

```
ImpactScore(task) =
  0.30 * GoalAlignment
+ 0.25 * BlockingRadius
+ 0.20 * UrgencyDecay
+ 0.10 * StakeholderTier
+ 0.10 * RecencyOfRisk
- 0.05 * StalenessPenalty

→ clamp to [0, 100]
```

### Component implementations

| Component | Normalization (0–1) | MVP implementation |
|-----------|-------------------|-------------------|
| **GoalAlignment** | Inverse hop distance task→nearest active strategic objective; 0 if unlinked | Walk `linked_goal_id` → parent chain; `1 / (1 + hops)`; strategic = company-level active goal |
| **BlockingRadius** | Tier-weighted downstream count, depth-capped | BFS from task via `blocks` edges, `max_depth = 4` (PRD placeholder); weight by blocked person tier |
| **UrgencyDecay** | Non-linear curve | `1 / (1 + daysUntilDue)^2` for due dates; 0.3 baseline if no due date |
| **StakeholderTier** | Max tier among blocked parties + requesters | Map Person.tier → weight table (IC=0.2 … C_LEVEL=1.0) |
| **RecencyOfRisk** | Boost if linked goal or dependency went at_risk/unresolved in 24h | Query Event log for `goal_health_changed` / `blocker_created` |
| **StalenessPenalty** | Penalty for ignored surfacing | `min(1, surfacedCount * 0.15)` from mock session metadata |

### Explainability pipeline

1. Compute all six raw components.
2. Persist `componentBreakdown` on `ImpactScoreSnapshot`.
3. Generate `oneLineWhy` via **template rules** (not LLM):

   > "Blocks 2 people · Tied to Q3 Retention · Due in 1 day"

   Priority of clauses: blocking > goal at risk > goal name > urgency.

4. Task detail page shows full breakdown bars + goal path breadcrumb.

### Recompute strategy (MVP)

- **On-demand:** recompute all open tasks for current user when loading Aerial View.
- **On mutation:** completing task / flagging blocker → recompute affected subgraph.
- No background workers in MVP; in-memory graph is small enough.

### Unit test coverage (required)

- Task with no linked goal → `goalAlignment = 0`, still ranked if blocking radius high.
- Circular dependency → BFS terminates at `max_depth`, no infinite loop.
- Task due today vs. 3 weeks out → urgency ordering correct.
- Newly at-risk goal → recency boost applied.
- Staleness after N surfacing → penalty reduces rank.

---

## 6. Application State Strategy

| Concern | Approach |
|---------|----------|
| **Server state** | Aerial view DTOs fetched in RSC `page.tsx` via application services |
| **Session / persona** | Cookie or URL param `?as=priya` via `PersonaSwitcher`; `mock-session.ts` resolves current `Person` + permissions |
| **Mutations** | Server Actions: `completeTask`, `snoozeTask`, `flagBlocker`, `acknowledgeAttention` → update in-memory repos → `revalidatePath` |
| **Client state** | Minimal: expand/collapse cards, "show more" top work, selected task drawer, persona dropdown |
| **Caching** | React `cache()` wrapper on graph load; no Redis in MVP |
| **Freshness indicator** | `lastUpdated` timestamp from last seed load or mutation — PRD §16.3 |

No global client store (Zustand/Redux) unless interaction complexity demands it in Phase 2.

---

## 7. Page / Screen Structure

| Route | Persona | PRD reference | MVP phase |
|-------|---------|---------------|-----------|
| `/aerial` | IC (default), all | §14.1 Daily Aerial View | **Phase 1** |
| `/tasks/[id]` | All with access | §16.3 Task detail | **Phase 1** |
| `/blockers` | IC, Manager | §14.3 Blocker Radar | **Phase 1** |
| `/team` | Manager | §14.6 Manager Team Rollup | **Phase 2** |
| `/` | — | Redirect to `/aerial` | **Phase 1** |

### `/aerial` layout (2×2 desktop, single column mobile)

```
┌─────────────────────────────────────────────────────────┐
│  WorkRadar · Good morning, Priya · Updated 2m ago        │
│  [Persona Switcher]                                      │
├──────────────────────────┬──────────────────────────────┤
│  TOP WORK (max 5)        │  WHAT HAPPENED TODAY         │
│  ranked by Impact Score  │  event digest + show sources │
├──────────────────────────┼──────────────────────────────┤
│  NEEDS IMMEDIATE         │  WHO IS BLOCKED              │
│  ATTENTION               │  blocking me / I'm blocking  │
└──────────────────────────┴──────────────────────────────┘
```

### Information architecture (MVP subset of PRD §16.2)

```
Home (/aerial)
├── Top Work → /tasks/[id]
├── What Happened → expand raw events
├── Needs Attention → item detail / acknowledge
└── Who Is Blocked → /blockers
```

---

## 8. Component Structure

### Composition hierarchy

```
AerialView
├── FreshnessIndicator
├── TopWorkCard
│   └── TopWorkRow[] → ImpactScoreBadge + oneLineWhy + quick actions
├── WhatHappenedCard
│   └── DigestItem[] → source event links
├── NeedsAttentionCard
│   └── AttentionItem[] → RiskBadge (icon + text, not color alone)
└── WhoIsBlockedCard
    └── BlockerSummary → link to /blockers

TaskDetailPage
├── TaskHeader
├── ImpactExplanation (breakdown chart + weights legend)
├── GoalPathBreadcrumb
├── DependencyList
└── ActionBar (complete / snooze / flag blocked)
```

### Design system

- **shadcn/ui** for Card, Button, Badge, Dialog, Sheet, Skeleton, Tooltip.
- **Tailwind** custom tokens: calm neutral base palette; urgency colors **only** in Needs Attention card (PRD §16.1 "calm by default").
- **Typography:** clear hierarchy — task title > why line > metadata.
- **Accessibility:** WCAG 2.2 AA targets — risk states use icon + label; focus rings on all actions.

### UI states (PRD §16.4 — all required)

Each card: `loading` | `default` | `empty` | `error` | `partial`

Example empty copy (PRD §14.1):
- Who Is Blocked: *"You're not blocking anyone — nice."*
- Needs Attention: *"Nothing requires immediate attention right now."*

---

## 9. MVP Feature Breakdown

### Phase 1 — Core IC loop (user-requested first delivery)

| # | Feature | Acceptance criteria |
|---|---------|---------------------|
| F1 | IC Daily Aerial View | 4 cards, <2s load, responsive 2×2 grid |
| F2 | Top Work | ≤5 items default, expandable; each has one-line why |
| F3 | Impact Score engine | Deterministic; full breakdown on task detail |
| F4 | What Happened Today | Structured digest from events; "show sources" expands raw events |
| F5 | Needs Immediate Attention | Short list; urgency from RecencyOfRisk + UrgencyDecay thresholds |
| F6 | Who Is Blocked | Bidirectional summary on aerial; full view at `/blockers` |
| F7 | Goals & alignment | Goal path visible on tasks; unlinked tasks flagged as data-quality signal |
| F8 | Dependencies | Cross-team edges; flag blocker action (mock) |
| F9 | Task actions | Mark done, snooze (defer), flag blocked |
| F10 | Mock data layer | Repository ports + Acme Corp seed |
| F11 | Persona switcher | Switch between 3–4 demo users (IC, manager, another IC) |
| F12 | Basic role scoping | IC sees own aerial; data filtered server-side |

### Phase 2 — Manager + polish (PRD Must, after IC loop validated)

| # | Feature | Acceptance criteria |
|---|---------|---------------------|
| F13 | Manager Team Rollup | `/team` — roster strip, team top-work status, team blockers |
| F14 | Blocker nudge (mock) | One-click "nudge" logs event, no real notification |
| F15 | Override logging | Snooze/defer logged as visible override (PRD principle #1) |

### Explicitly deferred (PRD alignment)

| Feature | PRD status | Notes |
|---------|------------|-------|
| Executive Org Heat Map | Should | Fast-follow |
| Ops SLA Radar | Should | Fast-follow |
| HR aggregate view | Could | Out of MVP |
| Impact Graph Explorer | Could | Out of MVP |
| Admin weight-tuning UI | Could | Default weights only |
| LLM digest | Optional | MVP uses structured fallback per §14.7 |
| Real integrations | Must in PRD pilot | Replaced by mocks per user direction |
| SSO / SCIM | Enterprise req | Mock session for MVP |

---

## 10. Testing Strategy

### Framework

- **Vitest** for unit + integration tests.
- **@testing-library/react** for component tests (critical paths only).
- **TypeScript** strict mode; `tsc --noEmit` in CI.

### Test layers (mapped to PRD §20.1)

| Layer | Scope | Priority |
|-------|-------|----------|
| **Unit** | Each Impact Score component; `explain.ts` always returns non-empty `oneLineWhy` | P0 |
| **Unit** | Graph traversal: goal path, blocking radius BFS, circular deps | P0 |
| **Integration** | `aerial-view.service` returns correct shape for Priya fixture | P0 |
| **Integration** | Role scoping: IC session never receives other team's task details | P0 |
| **Component** | `ImpactExplanation` renders all 6 breakdown bars | P1 |
| **E2E** | Optional Playwright smoke: aerial loads, top work ≥1 item | P2 (post-MVP) |

### Explainability regression (PRD §20.1)

Automated test: for every task in seed data, `computeImpactScore()` must return `componentBreakdown` with all keys and `oneLineWhy.length > 0`.

### Commands

```bash
npm run test          # vitest
npm run test:coverage # scoring + graph ≥90% coverage target
npm run typecheck     # tsc --noEmit
npm run build         # next build
```

---

## 11. Development Phases

### Phase 0 — Scaffold (½ session)

- `create-next-app` with TypeScript, Tailwind, App Router, ESLint
- shadcn/ui init
- Folder structure, Vitest, path aliases
- Empty repository interfaces

### Phase 1 — Domain + data (1 session)

- Entity types
- Seed data (Acme Corp)
- Mock repositories
- Graph utilities

### Phase 2 — Impact Score (1 session)

- All six components + explain
- Unit tests (edge cases from PRD §20.1)
- Batch scorer for all open tasks

### Phase 3 — Application services (1 session)

- `aerial-view.service`
- `blocker-radar.service`
- `digest.service`
- `attention.service`
- Integration tests

### Phase 4 — UI (1–2 sessions)

- App shell + persona switcher
- Four aerial cards
- Task detail page
- Blocker radar page
- Loading/empty/error states

### Phase 5 — Actions + polish (½ session)

- Server Actions for task mutations
- Revalidation + freshness
- README with demo instructions

### Phase 6 — Manager rollup (follow-on)

- `/team` page per PRD Must
- Manager-scoped queries

---

## 12. Assumptions

| ID | Assumption | Impact if wrong |
|----|------------|-----------------|
| A-MVP-1 | **Mock integrations are acceptable** for this delivery despite PRD §15.3 listing real integrations as Must for pilot | We can add adapter stubs without UI changes; may need your sign-off that MVP demo ≠ pilot deployment |
| A-MVP-2 | **Structured event digest** (no LLM) is acceptable for MVP | PRD §14.7 explicitly allows raw event fallback; upgrade path is Digest Service with LLM later |
| A-MVP-3 | **Single fictional org** (Acme Corp) is sufficient | Demo may not reflect customer's industry; expandable via seed files |
| A-MVP-4 | **Persona switcher** replaces SSO for role demos | Production will need real auth; session interface is swappable |
| A-MVP-5 | **Default PRD weights** (W1–W6) need no admin UI in MVP | Matches PRD Could for weight-tuning |
| A-MVP-6 | **Manager Team Rollup** can ship in Phase 2 immediately after IC aerial | PRD lists it as Must for pilot — sequencing IC first per your request, manager view follows |
| A-MVP-7 | **Product name "WorkRadar"** in UI; PRD retains "Vantage" as working name | Cosmetic only; no requirement conflict |
| A-MVP-8 | **`max_traverse_depth = 4`** for BlockingRadius until pilot data exists | PRD placeholder; tunable constant |
| A-MVP-9 | **UrgencyDecay curve** uses inverse-square of days until due | PRD specifies non-linear but not exact function — proposed formula is deterministic and testable |
| A-MVP-10 | **In-memory state resets on server restart** | Acceptable for MVP demo; persistence is a future concern |

---

## 13. Questions / Ambiguities Found in the PRD

| # | Topic | PRD reference | Question |
|---|-------|---------------|----------|
| Q1 | **Real integrations vs. mocks** | §15.3 Must | PRD requires calendar + task + goal integrations for pilot. You directed mocks only. **Confirm:** mock adapters satisfy MVP; real connectors are a later phase? |
| Q2 | **"What Happened Today" format** | §14.4 vs §14.7 | LLM digest is described as core, but fallback is raw events. **Confirm:** MVP uses structured bullet digest + expandable source events (no API key)? |
| Q3 | **Manager Team Rollup timing** | §15.3 Must | PRD marks manager view as Must. You listed IC Aerial first. **Confirm:** Phase 2 immediately after IC loop is acceptable? |
| Q4 | **Branding** | Title | PRD uses "Vantage"; repo uses "WorkRadar." **Confirm:** UI shows "WorkRadar" with PRD unchanged? |
| Q5 | **UrgencyDecay exact curve** | §12.2 | No formula specified. **Proposed:** `1/(1+days)^2`. Approve or provide preferred curve? |
| Q6 | **BlockingRadius depth cap** | §18.4 | Placeholder value. **Proposed:** `max_depth = 4`. Approve? |
| Q7 | **Attention thresholds** | §14.5 | No numeric thresholds defined. **Proposed:** include if `urgency ≥ 0.7` OR `recencyOfRisk ≥ 0.5` OR linked goal `at_risk`. Approve? |
| Q8 | **Manual priority override** | §6.2 Principle #1 | PRD allows logged overrides. **Confirm:** MVP implements snooze/defer only (no "pin to top")? |
| Q9 | **Executive / Ops personas** | §15.3 Should | No exec heat map in MVP. **Confirm:** persona switcher includes exec user with IC-scoped aerial only until heat map ships? |
| Q10 | **Task editor scope** | §17.3 ADR | Vantage is not task system-of-record. **Confirm:** MVP allows mark-done/snooze/flag-blocker but not create/edit task fields? |
| Q11 | **Multi-tenant** | §17.2 | Row-level `org_id` assumed. **Confirm:** single-tenant Acme Corp for MVP? |
| Q12 | **Calendar data usage** | §15.3 | Calendar integration is Must in PRD but not in your feature list. **Confirm:** defer calendar mock to Phase 2, or include meeting context in aerial header only? |

---

## Approval checklist

Before implementation begins, please confirm:

- [ ] Architecture and folder structure
- [ ] Domain model and mock org scenario
- [ ] Impact Score component formulas
- [ ] Phase 1 vs Phase 2 scope split
- [ ] Answers to questions Q1–Q12 (or defaults as proposed)

**Once approved, implementation will proceed in the order defined in §11.**
