# ROADMAP: Contabiliz Invoice Web — Milestone v1.0

**Created:** 2026-04-04
**Milestone:** v1.0 — Analytics & Batch History

## Summary

| Metric | Value |
|--------|-------|
| Phases | 2 |
| v1 Requirements | 7 |
| Mapped | 7 |
| Unmapped | 0 |

## Phases

| # | Name | Goal | Requirements | Success Criteria |
|---|------|------|-------------|------------------|
| 1 | Analytics Dashboard | 2/2 | Complete    | 2026-04-04 |
| 2 | Batch History | Implement batch history listing with filtering and re-processing | HIST-01, HIST-02, HIST-03 | 3 |

## Phase Details

### Phase 1: Analytics Dashboard

**Goal:** User can view KPIs (total processed, success rate, failures) and time-series charts showing processing volume over time (with MTD default and 7/30/90 day presets), drill into per-document detail, and export data as CSV/PDF.

**Requirements:** ANAL-01, ANAL-02, ANAL-03, ANAL-04

**UI hint:** yes

**Success Criteria:**
1. User lands on `/analytics` and sees KPI cards: total documents, success rate %, failure count
2. User sees a time-series chart defaulting to month-to-date with 7/30 day preset buttons that update the chart
3. User can scroll or toggle to see a breakdown table of individual documents with type, status, processing time, and extraction result
4. User can click an "Export" button and download processing data as CSV
5. All data is scoped to the authenticated user (verified via JWT)

**Dependencies:** Analytics API endpoints must exist on invoice-api — if not, Phase 1 requires backend work

**Notes:**
- Analytics API may not exist yet on the backend — need to verify endpoints
- If endpoints don't exist, Phase 1 includes API endpoint definition, DB queries, AND frontend
- Charts: use lightweight library (e.g., Recharts — React-friendly, no D3 dependency hell)
- KPIs are aggregations — backend should compute to avoid N+1 on frontend

---

### Phase 2: Batch History

**Goal:** User can view a listing of all past batches with status, date, document count, filter by status/date/type, and re-process failed batches.

**Requirements:** HIST-01, HIST-02, HIST-03

**UI hint:** yes

**Success Criteria:**
1. User can view `/batches` route listing all past batches with status badge, creation date, document count
2. User can filter by status (completed, processing, failed, partial failure), date range (datepicker), and document type (checkboxes)
3. User can click a "Re-process" button on a failed batch to trigger re-processing via API
4. Pagination is present (minimum 20 per page)
5. User can click a batch to navigate to its detail page (`/batches/[id]` — already exists)

**Dependencies:** Phase 1 (re-uses batch confirm API which may need listing endpoint)

**Notes:**
- Batch status detail page (`/batches/[id]`) already exists from PRD-03
- Need `GET /batches` listing endpoint with filtering — may not exist
- Re-processing likely requires new API endpoint (`POST /batches/{id}/reprocess`)

---
*Roadmap defined: 2026-04-04 after v1.0 milestone initialization*
