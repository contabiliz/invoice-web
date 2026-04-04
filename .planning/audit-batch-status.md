# Audit: Batch Status Implementation vs Specs (03.1–03.4)

**Date:** 2026-04-04
**Branch:** stage
**Specs:** 03.1 (state machine), 03.2 (API client), 03.3 (components), 03.4 (error handling)
**Files audited:** 20 files (15 source + 4 spec + 1 i18n)

---

## Per-File Compliance

Legend: **✓** = spec compliant, **✗** = missing/required, **⚠** = partial/deviation

### Core Hooks

| File | Status | Notes |
|---|---|---|
| `src/hooks/useBatchStatus.ts` | ⚠ | Polling/interval logic fully compliant. 401→login redirect works. `errorKey` from hook is destructured but **never used** in `BatchStatusView`. Online handler present but offline banner bug (Critical #1). |
| `src/hooks/useDocumentList.ts` | ✓ | Independent of `useBatchStatus` (ADR-002). No `refetchInterval`. Query key `['document-list', batchId, tab, page, pageSize]` correct. `errorKey` always `'errors.server_error'` regardless of HTTP status (minor). |

### API Layer

| File | Status | Notes |
|---|---|---|
| `src/lib/api/batch-status-client.ts` | ✓ | Reuses `apiClient` (ADR-001). Tab→status mapping (ADR-002). Throws `BatchApiError` (ADR-003). Paths, query params match spec exactly. |
| `src/lib/api/batch-client.ts` | ✓ | Existing instance. JWT interceptor intact. Not modified. |
| `src/lib/api/types.ts` | ✓ | All spec types present: `BatchStatus`, `BatchStatusResponse`, `DocumentStatus`, `DocumentDocType`, `DocumentItem`, `DocumentListResponse`, `BatchApiError`. Identical to spec 03.2 §4. |
| `src/lib/api/errors.ts` | ✓ | `mapDocumentError` matches spec 03.4 §4. All 7 known error codes + fallback. |
| `src/lib/api/error-keys.ts` | ✗ | **Missing** `BATCH_STATUS_ERROR_KEYS` constant defined in spec 03.4 §5.1. Only upload-related keys exist. |

### Page

| File | Status | Notes |
|---|---|---|
| `src/app/(auth)/batches/[id]/page.tsx` | ✓ | `await params` correct (ADR-004). SC async, passes `batchId: string` to CC. Metadata present. |

### Components

| File | Status | Notes |
|---|---|---|
| `src/components/batches/BatchStatusView.tsx` | ⚠ | Orchestrator structure correct. `DocumentTabs` consumes `useDocumentList` properly. `errorKey` from `useBatchStatus` **unused** (minor). Offline banner never clears (Critical #1). **No `polling_error` phase UI** rendered — the phase is derived but no toast/banner shows for it (Warning #2). |
| `src/components/batches/BatchHeader.tsx` | ⚠ | Uses `formatRelativeTime` from utils (delegates to `Intl.RelativeTimeFormat` — acceptable). Spec says "use `Intl.RelativeTimeFormat` — sem biblioteca externa", which is satisfied. `status` prop typed as `BatchStatus | null` (spec says just `BatchStatus`). `phase` prop added beyond spec (harmless). |
| `src/components/batches/KpiCards.tsx` | ✓ | 2×4 grid, correct variants (neutral/success/warning/error) and label keys. |
| `src/components/batches/KpiCard.tsx` | ✓ | `font-mono-tabular` + `tabular-nums`, `aria-live="polite"`, skeleton on `isLoading`. |
| `src/components/batches/BatchProgressBar.tsx` | ⚠ | Uses `<div role="progressbar">` instead of native `<progress>` element (spec 03.3 §BatchProgressBar: `<progress value={completed} max={total} />`). Has correct `aria-valuenow`/`min`/`max`. Uses i18n `progress.label` and `progress.aria` (extra keys beyond spec, not an issue). |
| `src/components/batches/PollingIndicator.tsx` | ✓ | `aria-live="polite"`, `aria-atomic="true"`, `aria-hidden={!isPolling}` (ADR-005). `Loader2` + `animate-spin`. `t('polling.updating')`. |
| `src/components/batches/BatchResultBanner.tsx` | ⚠ | **Missing `onNewUpload: () => void` prop** per spec 03.3 §BatchResultBanner. Uses internal `useRouter().push('/upload')`. All three terminal statuses have correct roles (`status` for completed/partial_failure, `alert` for failed). Colors match spec. |
| `src/components/batches/DocumentTabs.tsx` | ⚠ | **Custom ARIA tabs instead of shadcn/ui `Tabs`** mandated by ADR-002 (spec 03.3). Manual `role="tablist"/"tab"/"panel"`, keyboard arrow handling, `aria-selected`, focus-visible rings. Behaviorally correct, but loses Radix's tested roving tabindex and screen reader integration. |
| `src/components/batches/DocumentTable.tsx` | ✓ | `role="table"`, `<thead>`, `scope="col"` headers. 5 columns match spec. Skeleton on `isLoading`. Empty state with i18n `table.empty_tab`. Note: skeleton renders 8 rows vs spec's 10 (minor). |
| `src/components/batches/DocumentRow.tsx` | ✓ | `isError` → `bg-[var(--color-status-error-bg)]` correct. `filename` at `max-w-[240px]` (spec says `max-w-[280px]` — minor). `updated_at` `dd/MM HH:mm` in `font-mono-tabular`. `ErrorTooltip` with `t(mapDocumentError(...))` pipeline correct. |
| `src/components/batches/DocTypeIcon.tsx` | ⚠ | Has `'use client'` but spec 03.3 §DocTypeIcon says "Server Component". Icon mapping correct: xml→FileCode2, pdf→FileText, img→Image. |
| `src/components/batches/StatusBadge.tsx` | ✓ | All 6 `DocumentStatus` → correct variants and i18n keys per spec mapping table. |
| `src/components/batches/ErrorTooltip.tsx` | ⚠ | **Custom state-based tooltip instead of shadcn/ui `Tooltip`** (spec ADR-004: "Usar Tooltip do shadcn/ui com `<TooltipTrigger asChild>`"). Hover+focus accessible, but lacks Radix positioning engine, escape key handling, and screen reader integration. |
| `src/components/batches/TablePagination.tsx` | ✓ | Prev/Next `disabled` correct. `t('table.pagination', {current, total})`. `pageSize=50` constant. |
| `src/components/batches/index.ts` | ✓ | Barrel export for all 13 components. |

### i18n

| File | Status | Notes |
|---|---|---|
| `messages/pt-BR.json` (`batch-status` namespace) | ✓ | All spec keys present (03.4 §5.2). Extra keys beyond spec: `header.batch_prefix`, `header_status.*`, `time.*`, `progress.*`, `errors.technical_reason_aria`. Not an issue. |
| `src/lib/utils/format.ts` `formatRelativeTime` | ✓ | Uses `Intl.RelativeTimeFormat('pt-BR')` as spec intended. |

---

## Findings by Severity

### Critical (1)

**#1: Offline banner never clears on reconnection**

- **Location:** `src/components/batches/BatchStatusView.tsx` lines 42–49
- **Spec ref:** 03.4 §8 (Comportamento Offline)
- **Problem:** `BatchStatusView`'s `useEffect` registers only `window.addEventListener('offline', ...)` → calls `setIsOffline(true)`. The `online` listener is only in `useBatchStatus` hook (lines 90–96) where it calls `queryClient.invalidateQueries()`. There is **no** `online` listener that calls `setIsOffline(false)` in `BatchStatusView`. So once `isOffline` is set to `true`, it **never returns to `false`**, and the offline banner `{isOffline && ...}` stays on screen permanently.
- **Impact:** After any temporary network blip, users see a persistent "Sem conexão — tentando reconectar…" banner that never disappears, even after successful reconnection.

### Warning (7)

**#2: `polling_error` phase has no visible UI**

- **Location:** `src/components/batches/BatchStatusView.tsx`
- **Spec ref:** 03.4 §6.2 (polling_error toast) + 03.1 §7 deriveBatchPhase
- **Problem:** `useBatchStatus` derives `phase = 'polling_error'` on network/5xx errors and sets `errorKey = 'errors.polling_network'`. But `BatchStatusView` never renders anything for this phase. The `isOffline` banner (lines 88–96) only appears for `navigator.onLine === false` events, not for retryable API errors. The `polling_error` phase is completely silent to the user.
- **Impact:** When the API returns 5xx or 429 (without a full network disconnect), users see the polling indicator spinner but have no feedback that the request actually failed. No toast, no banner, nothing.
- **Fix:** Add a `polling_error` rendering block in `BatchStatusView` (e.g., a toast using the `errorKey` from the hook).

**#3: `BATCH_STATUS_ERROR_KEYS` constant missing**

- **Location:** `src/lib/api/error-keys.ts`
- **Spec ref:** 03.4 §5.1
- **Problem:** Spec requires `BATCH_STATUS_ERROR_KEYS` with `NOT_FOUND`, `NETWORK`, `SERVER_ERROR`. Not present — file only has upload-related keys.
- **Impact:** Hooks use inline strings. No runtime issue, but violates maintainability pattern.

**#4: DocumentTabs uses custom ARIA tabs instead of shadcn/ui `Tabs`**

- **Location:** `src/components/batches/DocumentTabs.tsx`
- **Spec ref:** 03.3 ADR-002
- **Problem:** Spec mandates `shadcn/ui Tabs` (Radix UI primitives). Implementation uses custom `<button role="tab">` elements with manual arrow key handler.
- **Impact:** Functional parity achieved (aria-selected, arrow keys, focus rings), but loses Radix's tested roving tabindex, escape key handling, and screen reader optimizations.

**#5: ErrorTooltip uses custom tooltip instead of shadcn/ui `Tooltip`**

- **Location:** `src/components/batches/ErrorTooltip.tsx`
- **Spec ref:** 03.3 ADR-004
- **Problem:** Spec: "Usar Tooltip do shadcn/ui com `<TooltipTrigger asChild>`". Implementation uses manual `useState` + `onMouseEnter`/`onFocus`.
- **Impact:** Accessible via hover+focus, but no positioning engine, no escape-to-close, no screen reader integration patterns from Radix.

**#6: `BatchResultBanner` missing `onNewUpload` prop**

- **Location:** `src/components/batches/BatchResultBanner.tsx`
- **Spec ref:** 03.3 §BatchResultBanner contract
- **Problem:** Spec defines `onNewUpload: () => void` prop. Component uses internal `useRouter().push('/upload')`.
- **Impact:** Reduces reusability and testability.

**#7: `errorKey` from `useBatchStatus` is never rendered**

- **Location:** `src/components/batches/BatchStatusView.tsx` line 28
- **Problem:** `errorKey` is destructured from `useBatchStatus` but never used in the component body. The hook already does the work of deriving the right i18n key but the component ignores it.

### Minor (6)

**#8: `DocTypeIcon` has `'use client'` but spec says Server Component**

- **Location:** `src/components/batches/DocTypeIcon.tsx`
- **Spec ref:** 03.3 §DocTypeIcon
- **Problem:** Component has `'use client'`. Spec intended static SC. Only needed because it's imported from `DocumentRow` (CC).
- **Impact:** Negligible. Unnecessary client bundle.

**#9: `BatchProgressBar` uses `<div>` instead of native `<progress>`**

- **Location:** `src/components/batches/BatchProgressBar.tsx`
- **Spec ref:** 03.3 §BatchProgressBar: `<progress value={completed} max={total} />`
- **Impact:** ARIA attributes provide equivalent accessibility. Minor semantic deviation.

**#10: `DocumentTable` skeleton renders 8 rows vs spec's 10**

- **Location:** `src/components/batches/DocumentTable.tsx` line 20
- **Spec ref:** 03.3 §7 Skeleton States: "10 linhas"
- **Impact:** Visual only.

**#11: `DocumentRow` filename truncation at 240px vs spec's 280px**

- **Location:** `src/components/batches/DocumentRow.tsx` line 37
- **Spec ref:** 03.3 §DocumentRow: `max-w-[280px]`
- **Impact:** Visual only. Slightly more aggressive truncation.

**#12: No observability/analytics events fired**

- **Spec ref:** 03.4 §7
- **Problem:** `batch_viewed`, `batch_completed_seen`, `batch_error_tab_opened` events not implemented.
- **Impact:** No analytics data for the batch status page. Deferred feature.

**#13: `useDocumentList` always returns `'errors.server_error'`**

- **Location:** `src/hooks/useDocumentList.ts` line 37
- **Problem:** All errors map to same key regardless of status code (404, 429, network).
- **Impact:** Less granular feedback.

---

## State Transition Verification (Spec 03.1 §9)

| Transition | Expected | Implementation | Status |
|---|---|---|---|
| loading → active_polling | Non-terminal response | `deriveBatchPhase`: `!isTerminalStatus(data) → active_polling` | ✓ |
| loading → terminal | Response already terminal | `isTerminalStatus(data.status) → terminal` | ✓ |
| loading → error_page | 404 on initial load | `isError && status === 404 → error_page` | ✓ |
| active_polling → terminal | Polling tick returns terminal | Same `isTerminalStatus` check | ✓ |
| active_polling → polling_error | Network error | `isError && status !== 404 → polling_error` | ✓ |
| polling_error → active_polling | Next tick succeeds | TanStack Query retry, `isError` clears | ✓ |
| polling_error → error_page | 401 irrecoverable | 401 → `router.push('/login')` via `useEffect` (no phase change) | ⚠ |
| terminal → | Final — poll stops | `refetchInterval` returns `false` | ✓ |
| error_page → | Final — no recovery | No recovery path | ✓ |

Note: The spec says 401 should transition to `error_page`. Implementation redirects to `/login` instead, which is arguably better UX but technically deviates.

---

## Polling Interval Verification (Spec 03.1 §6)

| Condition | Spec | Implementation | Status |
|---|---|---|---|
| No data (loading) | `false` | Returns `false` | ✓ |
| Terminal status | `false` | `isTerminalStatus() → false` | ✓ |
| `processing > 0` | 2,000ms | `2_000` | ✓ |
| `queued > 0` (no processing) | 5,000ms | `5_000` | ✓ |
| Fallback | 3,000ms | `3_000` | ✓ |
| Retry: skip 404/401 | `return false` | Checks 404 & 401 | ✓ |
| Retry: max 3 | `failureCount < 3` | `failureCount < 3` | ✓ |

Polling interval logic is **fully compliant** with spec 03.1 §6.

---

## `useDocumentList` Independence (Spec ADR-002)

| Criterion | Status |
|---|---|
| Separate query key (`['document-list', ...]`) | ✓ |
| No `refetchInterval` | ✓ |
| Only refetches on tab/page change (query key invalidation) | ✓ |
| `staleTime: 0` | ✓ |
| No cross-hook subscription / shared state | ✓ |

Result: **Compliant** with ADR-002.

---

## `await params` Verification (Spec ADR-004)

`src/app/(auth)/batches/[id]/page.tsx` line 14: `const { id } = await params;` — correct. SC is `async`, destructures `id` from awaited params, passes `batchId` to CC prop. **Compliant.**

---

## Tab/Document Filtering & Pagination

| Criterion | Status |
|---|---|
| `DocumentTabs` calls `useDocumentList` with `{ tab: activeTab, page, pageSize: 50 }` | ✓ |
| Tab change resets page to 1 (`handleTabChange` in `BatchStatusView`) | ✓ |
| `PAGE_SIZE = 50` constant in `DocumentTabs` (spec says fixed 50) | ✓ |
| `getDocumentList` correctly maps `'all'` → no status param, others → `?status=X` | ✓ |
| `queryKey: ['document-list', batchId, tab, page, pageSize]` — changes invalidate cache | ✓ |
| `TablePagination` shows "Page X of Y" with correct disabled logic | ✓ |

Result: **Compliant** with specs.

---

## `useTranslations('batch-status')` Calls

| Component | Has `useTranslations('batch-status')` | Status |
|---|---|---|
| `BatchStatusView` | ✓ (line 24) | ✓ |
| `BatchHeader` | ✓ (line 34) | ✓ |
| `KpiCard` | ✓ (line 20) | ✓ |
| `BatchProgressBar` | ✓ (line 13) | ✓ |
| `PollingIndicator` | ✓ (line 11) | ✓ |
| `BatchResultBanner` | ✓ (line 53) | ✓ |
| `DocumentTabs` | ✓ (line 36) | ✓ |
| `DocumentTable` | ✓ (line 16) | ✓ |
| `DocumentRow` | ✓ (line 23) | ✓ |
| `StatusBadge` | ✓ (line 36) | ✓ |
| `TablePagination` | ✓ (line 13) | ✓ |
| `ErrorTooltip` | ✗ (uses hardcoded strings) | ⚠ (acceptable — receives already-translated string as prop) |

All components with user-facing text use `useTranslations('batch-status')`. **Compliant.**

---

## Summary

| Metric | Count |
|---|---|
| ✓ Compliant files | 12 |
| ⚠ Partial/deviation | 7 |
| ✗ Missing | 1 |

| Severity | Count |
|---|---|
| Critical | 1 |
| Warning | 7 |
| Minor | 6 |

### Most Likely Causes of UI Behavior Problems

1. **Critical #1 — Offline banner stuck:** `isOffline` is set to `true` on `offline` event but no `online` listener calls `setIsOffline(false)`. Banner never disappears after first network glitch.

2. **Warning #2 — `polling_error` phase invisible:** The `polling_error` phase is correctly derived by the hook but `BatchStatusView` never renders anything for it. Users get zero feedback during API outages (5xx, 429) — they just see a spinning indicator with no error context.

3. **Warning #7 — `errorKey` unused:** The hook computes the right i18n key for the error phase but `BatchStatusView` throws it away, preventing any error feedback from being shown.
