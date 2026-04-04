# Phase 1 — Analytics Dashboard UI: SUMMARY

**Status:** COMPLETE
**Date:** 2026-04-04

## What was done

### Wave 1 — Analytics page shell + KPI component

**1.1 — Analytics page entry point**
- Created `src/app/(auth)/analytics/page.tsx` as a server component with `generateMetadata()` using `next-intl`
- Created `src/components/analytics/AnalyticsView.tsx` as the client component that composes all analytics widgets
- Page uses `useAnalytics` hooks for data fetching, KPI cards at top, chart in middle, table at bottom
- Error state displays Portuguese error messages via i18n keys

**1.2 — useAnalytics hooks**
- Created `src/hooks/useAnalytics.ts` with three TanStack Query hooks:
  - `useAnalyticsKPIs()` — query key `['analytics', 'kpis']`
  - `useAnalyticsTimeSeries(preset)` — query key `['analytics', 'timeseries', preset]`
  - `useAnalyticsDocuments(page, pageSize)` — query key `['analytics', 'documents', page, pageSize]`
- Each hook returns `{data, isLoading, isError, ...}` from `useQuery`
- Proper `staleTime` configured per endpoint (5min for KPIs/timeseries, 30s for documents)

**1.3 — KPI Cards component**
- Created `src/components/analytics/KPICards.tsx`
- Displays 3 cards: Total de documentos (total), Taxa de sucesso (percentage), Falhas (failure count)
- Success Rate formatted as `{value.toFixed(1)}%`
- Uses `font-mono tabular-nums` for all numeric values (Geist Mono via Tailwind)
- Skeleton loading state during data fetch

### Wave 2 — Time series chart + document table

**2.1 — Time Series Chart component**
- Created `src/components/analytics/TimeSeriesChart.tsx`
- Installed `recharts` 3.8.1 + type packages (`@types/d3-interpolate`, `@types/d3-shape`)
- Chart renders as Line or Bar (toggleable) with three series: Total, Success, Failure
- Preset buttons: "7 dias", "30 dias", "90 dias", "Mes atual"
- Default selection is "mtd" (month-to-date)
- Changing preset triggers new data fetch via TanStack Query
- Y-axis labels use `fontFamily="'Geist Mono', monospace"`
- Portuguese locale for date labels via `toLocaleDateString('pt-BR')`
- Skeleton loading + empty state handled

**2.2 — Document Breakdown Table**
- Created `src/components/analytics/DocumentTable.tsx`
- Table columns: Tipo, Status, Tempo (ms), Resultado, Data
- Uses `font-mono tabular-nums` for type labels and all numeric columns (processing time)
- Pagination with 20 items per page default, page controls with numbered buttons
- Status badges: completed=green, failed=red, processing=yellow
- Loading skeleton rows during data fetch
- Proper Portuguese labels and empty state

**2.3 — Export Button**
- Created `src/components/analytics/ExportButton.tsx`
- Downloads current document list as CSV with headers: Tipo, Status, Tempo (ms), Resultado, Data
- CSV file named `analytics-YYYY-MM-DD.csv`
- UTF-8 BOM prepended for spreadsheet compatibility
- Button shows disabled state during export
- Proper CSV escaping for commas, quotes, newlines

### Infrastructure
- Created `src/components/ui/skeleton.tsx` — reusable Skeleton component for loading states
- Added analytics i18n keys to both `messages/pt-BR.json` and `messages/en.json`

## Commits

| Commit | Summary |
|--------|---------|
| `c89d3fe` | feat: add recharts and useAnalytics hooks for dashboard |
| `56ecdc4` | feat: add Skeleton UI component and KPI Cards for analytics |
| `22f3af2` | feat: add TimeSeriesChart component with preset buttons |
| `e2a1c14` | feat: add DocumentTable component for analytics breakdown |
| `ed9e173` | feat: add ExportButton component for CSV export |
| `cdcf904` | feat: add analytics page with full dashboard layout |

## Verification criteria

| Criterion | Status |
|-----------|--------|
| `/analytics` page accessible to authenticated users | Implemented — auth enforced by `(auth)` layout |
| KPI cards show total documents, success rate %, failure count | Implemented — maps from `AnalyticsKPIResponse` |
| Time series chart defaults to month-to-date with 7/30/90 day presets | Implemented — default `mtd`, PRESETS array |
| Document table shows type, status, processing time, extraction result | Implemented — 5 columns with proper labels |
| CSV export downloads a file with processing data | Implemented — `buildCsvData` + `downloadCsv` |
| All numeric data uses Geist Mono with `tabular-nums` | Verified — `font-mono tabular-nums` on all numeric cells |
| No hardcoded values — all data fetched from analytics API | Verified — all data via hooks |
| No `any` types | Verified — all typed interfaces |
| Proper error handling via i18n keys | Implemented — `analytics.errors.*` keys |
| Loading states show skeleton placeholders | Implemented — Skeleton in KPICards, TimeSeriesChart, DocumentTable |

## Dependencies

- Depends on Phase 1 Wave 1-3 (analytics API endpoints, Pydantic models, frontend types + client)
- `recharts@3.8.1` added as dependency
- `@types/d3-interpolate@3.0.4` and `@types/d3-shape@3.1.8` added as devDependencies

## Notes

- The Sidebar still has `#` href for most nav items (batches, history, settings) — this is pre-existing
- `pnpm generate:types` was not re-run since the API is not running locally (same as Phase 1)
- The analytics export currently exports the currently-paginated data (20 items). A dedicated export-all endpoint would be needed for full export functionality in production.
