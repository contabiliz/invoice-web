# Milestones

## v1.0 Analytics & Batch History (Shipped: 2026-04-04)

**Phases completed:** 2 phases, 3 plans, 0 tasks

**Key accomplishments:**

- Analytics dashboard — KPI cards, time-series chart (7/30/90 day/MTD presets), document table, CSV export (mock data)
- Batch history listing — paginated table with status badges, filters (status/date), reprocess button for failed batches (mock)
- Sidebar navigation — all links wired to real routes (/upload, /analytics, /batches)
- Full i18n — all component strings via next-intl, pt-BR/en translations aligned and verified
- TypeScript clean — no `any` types, all components type-safe with generated API types
- Tech debt documented — analytics API and batch list API deferred to backend (see `invoice-docs/tech-debt/`)

**Git stats:** 24 commits, 48 files changed, 3575 insertions(+), 203 deletions(-)

**Technical note:** Backend analytics API was implemented then reverted to technical debt. Frontend uses mock data with compatible types — swap to real API when backend endpoints are ready. Same pattern for batch list API (pending backend endpoint).

---
