---
title: "Phase 1 — Analytics API endpoints"
wave: 1
depends_on: []
files_modified:
  - D:\Contabiliz\invoice-api\app\api\routes\analytics.py
  - D:\Contabiliz\invoice-api\app\api\main.py
  - D:\Contabiliz\invoice-api\app\adapters\database.py
  - src/types/api.ts
  - src/lib/api/analytics-client.ts
autonomous: true
requirements_addressed: [ANAL-01, ANAL-02, ANAL-03]
---

<objective>
Create analytics API endpoints on the FastAPI backend that provide KPIs, time-series data, and per-document breakdown for the authenticated user. Then regenerate frontend API types and create a typed client for consuming analytics data.
</objective>

<waves>

### Wave 1 — Analytics route + KPI endpoint

**1.1 — Create analytics route file**
- Read first: `D:\Contabiliz\invoice-api\app\api\routes\batches.py`, `D:\Contabiliz\invoice-api\app\api\routes\__init__.py`, `D:\Contabiliz\invoice-api\app\core\security.py`
- Acceptance criteria:
  - `D:\Contabiliz\invoice-api\app\api\routes\analytics.py` exists with `AnalyticRouter = APIRouter()`
  - Route has `get_analytics_kpis()` endpoint at `GET /analytics/kpis`
  - Endpoint requires `get_current_user` dependency
  - Returns `AnalyticsKPIResponse` model with `total_documents`, `success_count`, `failure_count`, `success_rate`
- Action: Create the analytics route file with the KPI endpoint, using SQL aggregation queries via `app.state.db`

**1.2 — Create Pydantic response models in invoice-models**
- Read first: `D:\Contabiliz\invoice-models\invoice_models\` existing model files to understand patterns
- Acceptance criteria:
  - `AnalyticsKPIResponse` Pydantic model exists with total_documents (int), success_count (int), failure_count (int), success_rate (float)
  - `AnalyticsTimeSeriesPoint` Pydantic model exists with date (str), total (int), success (int), failure (int)
  - `AnalyticsTimeSeriesResponse` Pydantic model exists with points (list), date_range (str), presets (dict)
  - `AnalyticsDocumentBreakdown` Pydantic model exists with document_id (str), type (str), status (str), processing_time_ms (int), extraction_result (str), created_at (str)
  - `AnalyticsDocumentBreakdownList` Pydantic model exists with items (list), total (int), page (int), page_size (int)
- Action: Create analytics response models in invoice-models following existing model patterns

**1.3 — Register analytics router in API**
- Read first: `D:\Contabiliz\invoice-api\app\api\main.py`, `D:\Contabiliz\invoice-api\app\api\routes\__init__.py`
- Acceptance criteria:
  - `app/api/routes/__init__.py` imports and exports `analytics_router`
  - `api_router.include_router(analytics_router)` is present
  - `GET /analytics/kpis` appears in `/docs` when running locally
- Action: Import and register the analytics router in the API routes

**1.4 — Implement KPI query in database adapter**
- Read first: `D:\Contabiliz\invoice-api\app\adapters\database.py`, Supabase schema at `D:\Contabiliz\invoice-docs\05-database\05.1-schema.md`
- Acceptance criteria:
  - `AsyncpgDatabaseAdapter` has method `get_analytics_kpis(user_id: str, days: int = 30)` returning dict with totals
  - Query filters by `user_id` and date range
  - Query aggregates counts by batch/document status
- Action: Add the KPI aggregation query method to the database adapter

### Wave 2 — Time series + document breakdown endpoints

**2.1 — Time series endpoint**
- Read first: `D:\Contabiliz\invoice-api\app\api\routes\analytics.py`, `D:\Contabiliz\invoice-api\app\adapters\database.py`
- Acceptance criteria:
  - `GET /analytics/timeseries` endpoint exists with optional `preset` query param (values: "7d", "30d", "90d", "mtd")
  - Returns `AnalyticsTimeSeriesResponse` with array of {date, total, success, failure}
  - Default preset is "mtd"
  - Query aggregates documents grouped by date
- Action: Add the timeseries endpoint and corresponding database query method

**2.2 — Document breakdown endpoint**
- Read first: `D:\Contabiliz\invoice-api\app\api\routes\batches.py` (for pagination pattern)
- Acceptance criteria:
  - `GET /analytics/documents` endpoint exists with `page`, `page_size`, `sort_by`, `sort_order` query params
  - Returns paginated `AnalyticsDocumentBreakdownList`
  - Default page_size is 50, max is 200
  - Results ordered by created_at descending
- Action: Add the document breakdown endpoint with pagination

### Wave 3 — Frontend API types + client

**3.1 — Regenerate API types**
- Read first: `src/types/api.ts`, `package.json` (for generate:types script)
- Acceptance criteria:
  - `src/types/api.ts` contains analytics endpoint types (`AnalyticsKPIResponse`, `AnalyticsTimeSeriesResponse`, etc.)
  - Types are generated via `openapi-typescript` from running API
- Action: Run `pnpm generate:types` with local API running

**3.2 — Create analytics API client**
- Read first: `src/lib/api/batch-client.ts`, `src/lib/api/errors.ts`
- Acceptance criteria:
  - `src/lib/api/analytics-client.ts` exists with `AnalyticsClient` class
  - Client uses same Axios instance or pattern as `BatchClient`
  - Methods: `getKPIs()`, `getTimeSeries(preset)`, `getDocuments(page, pageSize)`
  - Methods return typed responses using `src/types/api.ts` types
  - Error handling maps through existing `mapDocumentError()`
- Action: Create the analytics client following the batch-client pattern

</waves>

<must_haves>
- KPI endpoint returns accurate aggregates for the authenticated user
- Time series endpoint supports all 4 presets (7d, 30d, 90d, mtd)
- Document breakdown is paginated and sortable
- All endpoints require valid JWT via `get_current_user`
- Frontend client uses typed responses from `src/types/api.ts`
</must_haves>

<verification_criteria>
- GET /analytics/kpis returns {total_documents, success_count, failure_count, success_rate} for a user with uploaded documents
- GET /analytics/timeseries?preset=7d returns array of daily aggregation points for last 7 days
- GET /analytics/documents?page=1&page_size=10 returns paginated list of documents
- All endpoints return 401 without valid JWT
- `pnpm generate:types` completes without errors
- Analytics client methods exist and return correct types
</verification_criteria>

<threat_model>
| Threat | Severity | Mitigation |
|--------|----------|-----------|
| User sees another user's analytics data | Critical | All queries MUST filter by authenticated user_id from JWT |
| Time series query scans entire table | High | Add date range filter with index on created_at |
| Large page_size DoS on documents endpoint | Medium | Cap page_size at 200, add rate limiting |
| Export endpoint could be abused | Low | Rate limit export requests per user |
</threat_model>

</content>