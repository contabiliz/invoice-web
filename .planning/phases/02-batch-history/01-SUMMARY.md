# 01-SUMMARY.md — Phase 2 Batch History

**Plan:** 01-PLAN.md — Batch History listing page
**Phase:** 02 — batch-history
**Executed:** 2026-04-04

## What was built

Batch history listing page at `/batches` with:
- Paginated table of past batches (status, date, document count)
- Filter bar (status dropdown, date range, refresh)
- Reprocessing button for failed/partial_failure batches (mock API)
- Sidebar link wired to `/batches`
- All i18n keys for pt-BR and en
- Mock data in batch-client (15 batches across statuses)

## Key files created
- `src/app/(auth)/batches/page.tsx` — batch listing page
- `src/components/batches/BatchList.tsx` — batch table with status badges + reprocess button
- `src/components/batches/BatchFilters.tsx` — filter bar (status, date range)
- `src/hooks/useBatchList.ts` — TanStack Query hook + useReprocessBatch mutation
- `src/lib/api/batch-client.ts` — mock getBatchList + reprocessBatch functions
- `src/lib/api/types.ts` — BatchListItem, BatchListParams, BatchListResponse types
- `messages/pt-BR.json` & `messages/en.json` — batches namespace
- `src/components/layout/Sidebar.tsx` — history link to `/batches`

## Key files modified
- `src/lib/api/types.ts` — added batch listing types
- `src/lib/api/batch-client.ts` — added mock listing + reprocess

## Verification
- `pnpm type-check` passes
- Mock client returns 15 batches across statuses (completed, processing, failed, partial_failure)
- Filters narrow mock data by status, date range
- Reprocess button visible only on failed/partial_failure batches
- Sidebar history link points to `/batches`

## Self-Check: PASSED
- All wave 1 tasks: ✅ mock client, hook, page, component
- All wave 2 tasks: ✅ filters, reprocess button, sidebar link
- i18n: ✅ all text via next-intl, no hardcoded strings
- Types: ✅ no `any` types
- Mock data: ✅ ready for real API swap later
