# WorkRadar

Systems-thinking operational cockpit that computes what matters from organizational goals, dependencies, and impact — not manually declared task priority.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the **Daily Aerial View**.

## Demo personas

Use the persona switcher on the aerial view:

| Persona | Role | What to notice |
|---------|------|----------------|
| Priya Sharma | IC (Platform) | Ranked top work, cross-team blockers, at-risk goal linkage |
| Devon Walsh | Manager | Team rollup at `/team` |
| Jordan Lee | IC (Mobile) | Blocked by API migration |
| Alex Kim | IC (CS) | SLA escalation attention items |

## Core routes

- `/aerial` — IC Daily Aerial View (four anchors)
- `/tasks/[id]` — Task detail with Impact Score breakdown
- `/blockers` — Blocker Radar
- `/team` — Manager Team Rollup (manager persona only)

## Architecture

- **Next.js 16** (App Router) + TypeScript + Tailwind + shadcn/ui
- **Domain layer** — Impact Graph, deterministic Impact Score engine (PRD §12.2)
- **Mock repositories** — Acme Corp seed data behind clean interfaces
- **No external integrations** — mock adapters simulate task/goal/org data

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run test       # Vitest unit/integration tests
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

## Product spec

See [`docs/WORKRADAR_PRD.md`](docs/WORKRADAR_PRD.md) for the canonical product requirements.

## Impact Score

Deterministic, explainable formula with configurable weights:

```
Score = W1×GoalAlignment + W2×BlockingRadius + W3×Urgency
      + W4×StakeholderTier + W5×RecencyOfRisk − W6×Staleness
```

Every ranked task shows a one-line **"why this matters"** explanation.
