# Contabiliz Invoice Web — Frontend

## What This Is

Contabiliz is a SaaS platform that lets accountants upload Brazilian fiscal documents (NF-e XML, PDF DANFE, cupom térmico images) and have them processed automatically by a backend pipeline. The frontend (`invoice-web`) is a Next.js 15 app that connects to a FastAPI BFF (`invoice-api`) — users log in, upload batches, monitor processing in real time, and review analytics on their own document processing history.

## Core Value

The upload → processing pipeline must never drop data: every document uploaded must be processed and its results reliably available to the user.

## Requirements

### Validated

(shipped and confirming value — to be verified after use)

- ✓ Auth (login/signup with Supabase) — existing
- ✓ Batch upload (drag-and-drop → presign → upload → confirm) — existing
- ✓ Real-time batch processing status — existing

### Active

- [ ] **ANAL-01**: Analytics dashboard with high-level KPIs (total documents, success rate, failures)
- [ ] **ANAL-02**: Time-series charts showing processing volume over time (default month-to-date, with 7/30/90 day presets)
- [ ] **ANAL-03**: Per-document breakdown table (granular detail: type, status, processing time, extraction result)
- [ ] **ANAL-04**: Export capability for processing data (CSV/PDF summary — standard for accountant workflows)
- [ ] **HIST-01**: Batch history listing page — all past batches with status, date, document count
- [ ] **HIST-02**: Batch history filtering (by status, date range, document type)
- [ ] **HIST-03**: Re-process failed batches from history

### Out of Scope

- Profile management / user data editing — deferred to v2, not needed for core invoice workflow
- Social auth (Google, GitHub) — deferred to v2, email/password sufficient now
- Password recovery via email — link visible in UI but inactive in v1
- MFA / 2FA — deferred to v2
- Real-time notifications (push/email) — not part of current scope
- Batch history notifications — no email/webhook on batch completion

## Context

This is a brownfield project with significant existing code. The system spans 6 repos (frontend + 4 backend services + shared types). The frontend already implements auth (PRD-01), batch upload (PRD-02), and batch processing status (PRD-03). The analytics route (`/analytics`) exists in the auth layout but has no implementation.

**Known technical concerns to address during this milestone:**
1. Manual API types alongside generated types — risk of drift
2. Dual auth validation (middleware + layout) — redundant, adds latency
3. shadcn/ui components setup may be incomplete
4. Presigned URL expiry handling — fragile retry logic (only 1 retry)
5. Locale detection in middleware bypasses next-intl
6. Analytics API may not exist yet on backend — need to verify

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Analytics dashboard for individual accountant view (not company/manager) | Product positioning — accountants are the primary users | ✓ Set |
| Month-to-date default with 7/30/90 day presets | Default matches billing/reporting cycles; presets cover common accountant needs | ✓ Set |
| Analytics includes both chart overview and detailed table | Accountants need to see the forest AND inspect individual documents | ✓ Set |
| Batch history is a v1 requirement | Deferred in PRD-03 but needed for "complete the frontend" goal — users need to find past work | ✓ Set |

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

*Last updated: 2026-04-04 after v1.0 roadmap creation and Phase 1 planning*
