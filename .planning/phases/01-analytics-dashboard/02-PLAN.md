---
title: "Phase 1 — Analytics Dashboard UI"
wave: 2
depends_on: ["01-PLAN.md"]
files_modified:
  - src/app/(auth)/analytics/page.tsx
  - src/components/analytics/KPICards.tsx
  - src/components/analytics/TimeSeriesChart.tsx
  - src/components/analytics/DocumentTable.tsx
  - src/components/analytics/ExportButton.tsx
  - src/hooks/useAnalytics.ts
autonomous: true
requirements_addressed: [ANAL-01, ANAL-02, ANAL-03, ANAL-04]
---

<objective>
Build the analytics dashboard frontend page with KPI cards, time-series chart with date presets, per-document breakdown table, and CSV export functionality. The page uses TanStack Query to fetch data from the analytics API client created in 01-PLAN.md.
</objective>

<waves>

### Wave 1 — Analytics page shell + KPI component

**1.1 — Create analytics page entry point**
- Read first: `src/app/(auth)/upload/page.tsx` (page pattern), `src/app/(auth)/layout.tsx` (layout context)
- Acceptance criteria:
  - `src/app/(auth)/analytics/page.tsx` exists as a Client Component
  - Page uses `useAnalytics` hook for data fetching
  - Page displays KPI cards at the top
  - Page displays time-series chart with preset buttons
  - Page displays document breakdown table below
- Action: Create the analytics page component with full layout

**1.2 — Create useAnalytics hook**
- Read first: `src/hooks/useBatchStatus.ts` (TanStack Query pattern), `src/lib/api/analytics-client.ts` (from 01-PLAN.md)
- Acceptance criteria:
  - `src/hooks/useAnalytics.ts` exists
  - Exports `useAnalyticsKPIs()` hook using TanStack Query with `getKPIs()`
  - Exports `useAnalyticsTimeSeries(preset)` hook with `getTimeSeries(preset)`
  - Exports `useAnalyticsDocuments(page, pageSize)` hook with `getDocuments()`
  - Each hook returns `{data, isLoading, error}` pattern
  - Query keys are properly namespaced: `['analytics', 'kpis']`, `['analytics', 'timeseries', preset]`, etc.
- Action: Create the hook wrapping the analytics client with TanStack Query

**1.3 — Create KPI Cards component**
- Read first: `src/components/ui/card.tsx`, `DESIGN.md` tokens
- Acceptance criteria:
  - `src/components/analytics/KPICards.tsx` exists
  - Displays 3 cards: Total Documents, Success Rate, Failures
  - Success Rate formatted as percentage with `%` symbol
  - Uses Geist Mono for numeric values with `tabular-nums` class
  - Cards show loading skeleton state during data fetch
  - Accepts `{total, successRate, failures}` props
- Action: Create the KPI cards component with shadcn Card component

### Wave 2 — Time series chart + document table

**2.1 — Create Time Series Chart component**
- Read first: `package.json` (check if recharts installed), `src/components/upload/` (existing component patterns)
- Acceptance criteria:
  - `src/components/analytics/TimeSeriesChart.tsx` exists
  - Chart renders time-series data as line or bar chart
  - Preset buttons: "7 dias", "30 dias", "90 dias", "Mês atual"
  - Default selection is "Mês atual" (month-to-date)
  - Changing preset triggers new data fetch with correct date range
  - Chart shows loading state during data fetch
  - Y-axis labels use Geist Mono, Portuguese locale for date labels
- Action: Install recharts if needed, create chart component with preset buttons

**2.2 — Create Document Breakdown Table**
- Read first: `src/app/(auth)/batches/[id]/page.tsx` (existing table patterns), `DESIGN.md` table section
- Acceptance criteria:
  - `src/components/analytics/DocumentTable.tsx` exists
  - Table columns: Type, Status, Processing Time, Extraction Result, Created At
  - Uses Geist Mono for numeric columns (processing time) with `tabular-nums`
  - Supports pagination with 20 items per page default
  - Status badges use appropriate colors (success=green, failure=red, processing=yellow)
  - Loading skeleton rows during data fetch
- Action: Create the document breakdown table component

**2.3 — Create Export Button + CSV export**
- Read first: `src/lib/utils/` (utility patterns)
- Acceptance criteria:
  - `src/components/analytics/ExportButton.tsx` exists
  - On click, downloads current document list as CSV with headers: Tipo, Status, Tempo (ms), Resultado, Data
  - CSV file named `analytics-YYYY-MM-DD.csv`
  - Button shows "Exportando" text and disabled state during export
  - CSV uses `,` separator (standard for spreadsheet apps)
  - Export works with currently paginated data or all data (prefer all data via dedicated endpoint)
- Action: Create export component with CSV generation

</waves>

<must_haves>
- Analytics page at `/analytics` is accessible to authenticated users
- KPIs display: total documents, success rate %, failure count
- Time series chart defaults to month-to-date with 7/30/90 day presets
- Document table shows type, status, processing time, extraction result
- CSV export downloads a file with processing data
- All numeric data uses Geist Mono with `tabular-nums`
- No hardcoded values — all data fetched from analytics API
</must_haves>

<verification_criteria>
- Navigating to `/analytics` as authenticated user shows the dashboard with KPIs, chart, and table
- KPI cards show correct values matching actual data from the API
- Clicking date preset buttons updates the chart with correct date range
- Document table paginates correctly with 20 items per page
- Clicking Export downloads a CSV file that opens in a spreadsheet app
- Unauthenticated access redirects to `/login`
- Numeric values in KPIs and table use Geist Mono font
- Loading states show skeleton placeholders during data fetch
- Error states display Portuguese error messages via i18n keys
</verification_criteria>

<threat_model>
| Threat | Severity | Mitigation |
|--------|----------|-----------|
| XSS via CSV export (injected data) | Low | CSV content is server-side generated, no user input in headers |
| Large dataset export OOM | Medium | Server limits export to reasonable size; client uses server endpoint |
| Chart library vulnerability | Low | Use latest recharts version, keep minimal dependencies |
</threat_model>

</content>