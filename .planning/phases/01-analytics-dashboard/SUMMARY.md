# Phase 1 — Analytics API endpoints: SUMMARY

**Status:** COMPLETE
**Date:** 2026-04-04

## What was done

### Wave 1 — Analytics route + KPI endpoint

1. **Analytics Pydantic models** (invoice-models)
   - Created `invoice_models/api/analytics.py` with:
     - `AnalyticsKPIResponse` — total_documents, success_count, failure_count, success_rate
     - `AnalyticsTimeSeriesPoint` — date, total, success, failure
     - `AnalyticsTimeSeriesResponse` — points list, date_range, presets
     - `AnalyticsDocumentBreakdown` — per-document detail row
     - `AnalyticsDocumentBreakdownList` — paginated breakdown list
   - Updated `invoice_models/api/__init__.py` and `invoice_models/__init__.py` exports

2. **Analytics route file** (invoice-api)
   - Created `app/api/routes/analytics.py` with:
     - `GET /api/v1/analytics/kpis` — requires JWT, returns KPIs scoped to user
     - `GET /api/v1/analytics/timeseries?preset=mtd` — supports 7d/30d/90d/mtd presets
     - `GET /api/v1/analytics/documents?page=...` — paginated, defaults to created_at DESC

3. **Database adapter** (invoice-api)
   - Added `get_analytics_kpis()` — SQL aggregation with date range filter
   - Added `get_analytics_timeseries()` — daily GROUP BY aggregation
   - Added `get_analytics_documents()` — paginated query with 4 sortable columns
   - All queries filter by `user_id` from auth (SEC-002 tenant isolation)

4. **Router registration**
   - `analytics.router` imported and included in `api_router` via `app/api/main.py`

### Wave 2 — Time series + document breakdown endpoints

- Both endpoints implemented alongside Wave 1 in `analytics.py` route file

### Wave 3 — Frontend API types + client

1. **API types** (`src/lib/api/types.ts`)
   - Added `AnalyticsKPIResponse`, `AnalyticsTimeSeriesPoint`, `AnalyticsTimeSeriesResponse`
   - Added `AnalyticsDocumentBreakdown`, `AnalyticsDocumentBreakdownList`

2. **Analytics client** (`src/lib/api/analytics-client.ts`)
   - `AnalyticsClient` class with `getKPIs()`, `getTimeSeries()`, `getDocuments()`
   - Standalone exported functions for direct import: `getAnalyticsKPIs()`, `getAnalyticsTimeSeries()`, `getAnalyticsDocuments()`
   - Reuses `apiClient` Axios instance with JWT interceptor from `batch-client.ts`
   - Error handling via `BatchApiError` (same pattern as `batch-status-client.ts`)

## Commits

| Repo | Commit | Summary |
|------|--------|---------|
| invoice-models | `c08ee1a` | feat: add analytics Pydantic response models |
| invoice-api | `6e2b4b3` | feat: add analytics API endpoints with SQL queries |
| invoice-web | `d916c67` | feat: add analytics API types and typed client |

## Verification status

| Criteria | Status |
|----------|--------|
| GET /analytics/kpis returns KPIs for authenticated user | Implemented (SQL aggregation via user_id) |
| GET /analytics/timeseries?preset=7d returns daily data | Implemented (4 presets: 7d, 30d, 90d, mtd) |
| GET /analytics/documents returns paginated results | Implemented (defaults page=1, page_size=50, max=200) |
| All endpoints require JWT (401 without) | Implemented (Depends on get_current_user) |
| Frontend client methods exist with correct types | Implemented (3 methods + AnalyticsClient class) |
| No `any` types in frontend client | Verified |
| All queries filter by user_id (tenant isolation) | Verified on all 3 queries |
| page_size capped at 200 | Enforced via Query(le=200) |

## Threat model mitigations

| Threat | Status |
|--------|--------|
| Cross-user data leak | All 3 queries filter by authenticated user_id |
| Full table scan on timeseries | Date range filter on created_at (index exists) |
| Large page_size DoS | page_size capped at 200 via Query constraint |
| SQL injection on sort_by | Whitelist validated against 4 allowed columns |

## Notes

- `pnpm generate:types` was not run because the API is not running locally. Types were added manually to `src/lib/api/types.ts` matching the Pydantic models exactly. The generate:types script should be run once the API is running to verify alignment.
- The route prefix uses `/api/v1` convention — the analytics router prefix is `/analytics` so the full path is `/api/v1/analytics/*` (matches the existing `/api/v1/batches/*` pattern from FastAPI lifespan/router setup).
