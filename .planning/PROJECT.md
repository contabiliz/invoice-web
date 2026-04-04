# Contabiliz Invoice Web — Frontend

## What This Is

Contabiliz is a SaaS platform that lets accountants upload Brazilian fiscal documents (NF-e XML, PDF DANFE, cupom térmico images) and have them processed automatically by a backend pipeline. The frontend (`invoice-web`) is a Next.js 15 app that connects to a FastAPI BFF (`invoice-api`) — users log in, upload batches, monitor processing in real time, and review analytics on their own document processing history.

## Core Value

The upload → processing pipeline must never drop data: every document uploaded must be processed and its results reliably available to the user.

## Requirements

### Validated

(shipped and confirming value — to be verified after use)

- ✓ Auth (login/signup with Supabase) — v1.0
- ✓ Batch upload (drag-and-drop → presign → upload → confirm) — v1.0
- ✓ Real-time batch processing status — v1.0
- ✓ Analytics dashboard with KPIs, charts, table, export — v1.0 (mock data)
- ✓ Batch history listing with filters and reprocessing — v1.0 (mock data)

### Active

(None — v1.0 complete. Run `/gsd-new-milestone` for next planning cycle)

## Context

**v1.0 shipped 2026-04-04.** Frontend complete for auth, upload, batch monitoring, analytics dashboard (mock), and batch history (mock). System spans 6 repos (frontend + 4 backend services + shared types).

**Outstanding technical debt:**
1. Manual API types alongside generated types — risk of drift
2. Dual auth validation (middleware + layout) — redundant, adds latency
3. shadcn/ui components setup may be incomplete
4. Presigned URL expiry handling — fragile retry logic (only 1 retry)
5. Locale detection in middleware bypasses next-intl
6. Analytics API backend endpoints — mock frontend, backend pending (see `invoice-docs/tech-debt/`)
7. Batch list API backend endpoints — mock frontend, backend pending

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Analytics dashboard for individual accountant view (not company/manager) | Product positioning — accountants are the primary users | ✓ Set |
| Month-to-date default with 7/30/90 day presets | Default matches billing/reporting cycles; presets cover common accountant needs | ✓ Set |
| Analytics includes both chart overview and detailed table | Accountants need to see the forest AND inspect individual documents | ✓ Set |
| Batch history is a v1 requirement | Deferred in PRD-03 but needed for "complete the frontend" goal — users need to find past work | ✓ Set |
| Mock data on frontend, defer backend analytics API to tech debt | Frontend UI/UX validation needed first — backend endpoints can be added incrementally | ✓ Set |
| Mock data for batch list API — same pattern | Consistency with analytics pattern — swap to real API when backend is ready | ✓ Set |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-04 after v1.0 milestone*
