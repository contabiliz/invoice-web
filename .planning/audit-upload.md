# Audit: Upload Batch Implementation vs Spec (Full)

Date: 2026-04-04
Specs: 02.1 (State Machine), 02.3 (Components & A11Y), 02.4 (Error Handling)

---

## Summary Count

| Verdict | Count |
| --- | --- |
| Compliance (spec met) | 17 |
| Missing (spec requirement not implemented) | 10 |
| Deviation / Partial | 13 |

**Totals: 17 PASS / 10 MISSING / 13 DEVIATION**

---

## Per-File Compliance Check

### src/hooks/useBatchUpload.ts

| Check | Verdict | Detail |
| --- | --- | --- |
| Types match spec §4.1 (`BatchPhase`, `FileUploadStatus`, `FileItemState`, `BatchUploadState`) | PASS | All 9 phases present; `FileItemState` has all required fields |
| Hook signature matches spec §4.2 (returns `state`, `addFiles`, `removeFile`, `submitBatch`, `retryPresign`, `retryConfirm`) | DEVIATION | Returns `clearFiles` (not in spec) — not a problem, just extra |
| `uploadWithConcurrency` matches spec §5 exactly | PASS | Identical to the spec's inline implementation |
| URL expiration renewal (403 + 1x retry) per spec §4.2 item 4 | PASS | Lines 388–438: checks 403 + expiry, re-presigns, retries once |
| Offline pause/resume per spec 02.4 §5 | PASS | `offline`/`online` listeners set, `isPausedRef` halts workers |
| sessionStorage usage per spec 02.1 §6.2 | MISSING | See Finding #1 below |
| state transition `presigning → /login redirect` on 401 | PASS | Lines 508–513 |
| state transition `confirming → success_full / success_partial` | PASS | `SET_CONFIRM_RESULT` reducer handles this |
| state transition `success_full → redirect after 2s` | PASS | `useEffect` in UploadView.tsx line 22–29 |
| `submitBatch` guard against double-submission | DEVIATION | See Finding #2 — only guards active phases, not success states |
| `retryPresign` — transits to `presigning` before running | PASS | `RESET_FOR_RETRY_PRESIGN` sets `phase: "presigning"` |
| `retryConfirm` — reuses `documentIds` from done files | PASS | Lines 624–629 |
| 429 rate-limit vs backpressure distinction per 02.4 §3.2 | PASS | Checks `detail.includes("rate limit")` with 60s countdown |
| Validation error keys propagated per 02.4 §4.1 | PASS | `VALIDATION_ERROR_KEYS.MIME` and `.SIZE` used in `addFiles` |

### src/components/upload/UploadView.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| `useTranslations('upload')` call per spec 02.3 §2 | DEVIATION | 9 i18n keys are referenced but MISSING from `messages/pt-BR.json` (see Finding #3) |
| `GlobalProgressBeam` visible in presigning/uploading/confirming | PASS | |
| `DropZone` shown in idle, compact when files present | PASS | `isCompact={fileIds.length > 0}` |
| `FileList` shown when `fileIds.length > 0 && phase !== 'idle'` | PASS | |
| Offline banner with `role="alert"` per 02.4 §6 | DEVIATION | See Finding #4 — uses snapshot `navigator.onLine` not listener |
| `UploadResultSummary` shown in error/success states | PASS | Shown in `presign_error`, `confirm_error`, `success_full`, `success_partial` |
| `UploadActions` receives `rateLimitCountdown`, `clearQueue` | PASS | Props passed correctly |
| `success_partial` presents "Ver batch" link | PASS | Passed via `batchId` prop to `UploadResultSummary` |

### src/components/upload/DropZone.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| Props match spec §5.2 (`onFilesSelected`, `isDisabled`) | DEVIATION | Has extra prop `isCompact?: boolean` not in spec |
| `role="button"`, `tabIndex`, `Enter`/`Space` activation | PASS | Lines 39–43, 51–52, 80–81 |
| `aria-disabled` set based on `isDisabled` | PASS | |
| Drag over highlight (border + background) | PASS | `border-[var(--color-accent)]` + `bg-[var(--color-accent)]/5` |
| Renders hidden `FileInput` | PASS | |

### src/components/upload/FileInput.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| Props match spec §5.3 | MISSING | Spec requires `acceptedMimeTypes: string` prop; actual code has no such prop (reads `ACCEPTED_MIME_TYPES` internally instead) |
| `aria-label` for accessibility | DEVIATION | Uses `t('file_input_aria_label')` instead of spec's prescribed "Selecionar arquivos fiscais para upload" — functionally equivalent but key must exist in messages |
| `accept` attribute | PASS | Derived from `ACCEPTED_MIME_TYPES.join(',')` (full MIME types, not extensions) |
| `onChange` callback + reset for reselecion | PASS | |

### src/components/upload/FileList.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| Props match spec §5.4 (`items`, `onRemove`, `phase`) | PASS | |
| Progressive disclosure per spec ADR-002 | PASS | Threshold = 50; during uploads shows only uploading/error |
| `role="list"` on container | PASS | |
| "Ver todos" button with i18n | PASS | `t('button_see_all')` |

### src/components/upload/FileListItem.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| Props match spec §5.5 (`item`, `onRemove`, `showRemoveButton`) | PASS | |
| `FileTypeIcon` SC used (spec §5.6) | MISSING | `FileListItem` implements its own `getFileIcon()` helper; `FileTypeIcon.tsx` exists but is unused anywhere in the codebase |
| `UploadProgressBar` shown when uploading | PASS | |
| Error inline rendering (red background, badge) per 02.4 §6 | PASS | `bg-[var(--color-status-error)]` badge + red border |
| Remove button with `aria-label` | PASS | `t('button_remove_file')` |
| Focus ring on remove button | PASS | `focus:ring-2 focus:ring-[var(--color-status-error)]` |
| `role="alert"` on error container per 02.4 §6 | MISSING | Spec says "role='alert' no container do item em erro"; not implemented |
| `aria-live="polite"` on invalid file add | MISSING | Spec 02.4 §4.1: "aria-live='polite' ao adicionar arquivo invalido" — not present |
| Individual retry button ("TENTAR NOVAMENTE") per 02.4 §6 | MISSING | Spec says error items show "{razao} — TENTAR NOVAMENTE" button; `FileListItem` has no retry button |

### src/components/upload/BatchSummaryBar.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| Props match spec §5.9 (`count`, `validCount`, `totalBytes`) | PASS | |
| Uses `useTranslations('upload')` | PASS | |
| Shows error count when `validCount < count` | PASS | |

### src/components/upload/UploadActions.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| Props match spec §5.10 (`phase`, `validFileCount`, `onSubmit`, `onRetryPresign`, `onRetryConfirm`) | DEVIATION | Extra props: `rateLimitCountdown`, `onClearQueue` — not in spec |
| `aria-busy` / `aria-disabled` during loading phases | PASS | |
| Button text per phase | PASS | All phases covered |
| Retry in `presign_error` with countdown | PASS | Shows countdown or retry button |
| Retry in `confirm_error` | PASS | |
| Spinner during loading | PASS | |

### src/components/upload/GlobalProgressBeam.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| Props match spec §5.11 (`totalDocs`, `completedDocs`, `phase`) | PASS | |
| Visible only in presigning/uploading/confirming | PASS | `VISIBLE_PHASES` array check |
| `aria-label` from i18n | PASS | `t('progress_global_label')` |
| `role="progressbar"` with aria values | PASS | |

### src/components/upload/UploadResultSummary.tsx

| Check | Verdict | Detail |
| --- | --- | --- |
| Props match spec §5.12 | DEVIATION | Props are `presignErrorKey`/`confirmErrorKey` (key-based); spec says `presignError`/`confirmError` (string) — implementation is better, follows ADR convention |
| `success_full` green notification | PASS | |
| `success_partial` yellow warning with failed details | PASS | `role="alert"`, expandable details |
| `success_partial` "Ver batch" link | PASS | |
| `presign_error` banner with `role="alert"` | PASS | |
| `confirm_error` banner with `role="alert"` | PASS | |
| i18n keys resolved via `t()` | PASS | |
| Inline retry/reload per 02.4 §6 | MISSING | Error banners show only text — retry buttons are in `UploadActions` bottom bar. Spec §6: "Sempre inclui acao disponivel (retry, reload, ou countdown)" inline. |

### src/lib/api/batch-client.ts

| Check | Verdict | Detail |
| --- | --- | --- |
| JWT via `Authorization: Bearer` header | PASS | Interceptor on `apiClient` |
| Storage PUT without JWT (presigned URL self-authenticates) | PASS | Separate `storageClient` instance |
| `presignBatch` → `POST /api/v1/batches/presign` | PASS | |
| `confirmBatch` → `POST /api/v1/batches/{id}/confirm` | PASS | |
| `uploadFileToStorage` with progress callback | PASS | `onUploadProgress` callback |

### src/lib/api/error-keys.ts

| Check | Verdict | Detail |
| --- | --- | --- |
| `PRESIGN_ERROR_KEYS` matches spec 02.4 §3.1 | PASS | All 6 keys present |
| `CONFIRM_ERROR_KEYS` matches spec 02.4 §3.1 | PASS | All 4 keys present |
| `STORAGE_ERROR_KEYS` matches spec 02.4 §3.1 | PASS | All 4 keys present |
| `VALIDATION_ERROR_KEYS` | PASS | MIME + SIZE present |

### src/lib/api/types.ts

| Check | Verdict | Detail |
| --- | --- | --- |
| `ACCEPTED_MIME_TYPES` array | PASS | 7 MIME types: 3 image + PDF + XML variants |
| `MAX_FILE_SIZE_BYTES` (50 MB) | PASS | `52_428_800` |
| `MAX_DOCUMENTS_PER_BATCH` (500) | PASS | |
| `BatchPresignRequest` / `BatchPresignResponse` | PASS | |
| `BatchConfirmRequest` / `BatchConfirmResponse` | PASS | |

### messages/pt-BR.json

| Check | Verdict | Detail |
| --- | --- | --- |
| Spec 02.4 §3.2 upload namespace | PASS | Base spec keys present |
| All keys referenced by components exist | MISSING | 9 keys missing (see Finding #3) |
| All spec-prescribed error messages present | PASS | |

---

## Findings (Detailed)

### Critical

(none)

### Warning

**Finding #1 — sessionStorage not set on 401 presign redirect (spec 02.1 §6.2)**
- **File:** `useBatchUpload.ts` lines 508–513
- **Spec says:** On JWT expiry during upload: "(1) Save `batchId` to sessionStorage, (2) Redirect to `/login`, (3) Clean up after use"
- **Actual:** On 401, the code calls `sessionStorage.removeItem('upload_batch_id')` (cleanup only), then redirects. It never *saves* `batchId` before redirecting.
- **Impact:** After re-login, the app has no way to know about the interrupted batch. The cleanup of `upload_batch_id` is dead code (it was never set in this flow).
- **Severity:** Warning — spec contract not met.

**Finding #2 — `submitBatch` does not guard against re-submission in success states**
- **File:** `useBatchUpload.ts` line 600
- **Guard:** `if (['presigning', 'uploading', 'confirming'].includes(state.phase)) return;`
- **Missing phases:** `'success_full'` and `'success_partial'` are not guarded.
- **Impact:** In `success_partial` (which has no auto-redirect), a user could click "Enviar batch" again, starting an entirely new batch while the old result is still on screen.
- **Severity:** Warning — confusing UX, potential data model confusion.

**Finding #3 — 9 i18n keys used by `UploadView.tsx` are MISSING from `messages/pt-BR.json`**
- **File:** `messages/pt-BR.json`
- **Missing keys:** `header_title`, `header_idle`, `header_active`, `documents_count_label`, `info_panel_title`, `info_files_count`, `info_valid_files`, `info_total_size`, `info_security_note`
- **Impact:** These `t()` calls will return the raw key string (e.g., "header_idle") at runtime since `next-intl` does not crash on missing keys. The UploadView's header and side info panel will show raw i18n keys instead of translated Portuguese text.
- **Severity:** Warning — user-visible broken text.

**Finding #4 — Offline banner is not reactive (spec 02.4 §5)**
- **File:** `UploadView.tsx` line 58
- **Actual:** `{typeof window !== 'undefined' && !navigator.onLine && (...)}` — this is a mount-time snapshot, not a reactive check.
- **Spec says:** Show "Sem conexao — uploads pausados" banner; remove it on reconnect. The hook has online/offline listeners, but the banner does not.
- **Impact:** If the user goes offline after page mount (or comes back online), the banner state will not update until other state changes trigger a re-render.
- **Severity:** Warning — UX is not spec-compliant.

**Finding #5 — `FileListItem` missing per-spec a11y on error items**
- **File:** `FileListItem.tsx`
- **Missing:** Spec 02.4 §6 requires `role="alert"` on the error container of errored items. Not present.
- **Also missing:** Spec 02.3 §6 item 7 requires `aria-live="polite"` when an invalid file is added to the list. Not implemented.
- **Severity:** Warning — accessibility non-compliance.

**Finding #6 — `FileListItem` missing individual retry button**
- **File:** `FileListItem.tsx`
- **Spec 02.4 §6:** "Barra de progresso substituida por texto: '{razao} — TENTAR NOVAMENTE' (botao individual)"
- **Actual:** No retry button on errored items. The only retry mechanism is at the batch level in `UploadActions`.
- **Severity:** Warning — per-file retry capability from spec is absent.

**Finding #7 — `FileTypeIcon` SC and `FileStatusBadge` are dead code**
- **Files:** `FileTypeIcon.tsx`, `FileStatusBadge.tsx`
- **Spec 02.3 §4:** Hierarchy shows `FileListItem` contains `FileTypeIcon`, `UploadProgressBar`, `FileStatusBadge`
- **Actual:** `FileListItem` implements inline icon selection via `getFileIcon()`. Neither `FileTypeIcon` nor `FileStatusBadge` are imported anywhere.
- **Severity:** Warning — unused components, spec hierarchy not followed.

### Minor

**Finding #8 — `FileInput` props don't match spec §5.3**
- Spec interface: `{ onFilesSelected: (files: File[]) => void; acceptedMimeTypes: string }`
- Actual interface: `{ onFilesSelected: (files: File[]) => void }` — no `acceptedMimeTypes` prop
- `ACCEPTED_MIME_TYPES` is hardcoded from `@/lib/api/types`
- Functional impact: none (behavior is equivalent), but interface contract is not honored.

**Finding #9 — `UploadResultSummary` prop names differ from spec §5.12**
- Spec: `presignError?: string; confirmError?: string`
- Actual: `presignErrorKey?: string; confirmErrorKey?: string`
- The actual names are better (explicitly indicate key-based), but they don't match the contract.

**Finding #10 — Error banners in `UploadResultSummary` lack inline actions**
- Spec 02.4 §6: Global error divs "Sempre inclui acao disponivel (retry, reload, ou countdown)"
- The retry buttons are placed in the bottom bar (`UploadActions`) rather than inline within the error banner.
- This breaks the spec's visual contract of action proximity to error message.

**Finding #11 — `UploadView` passes `clearFiles` to `UploadActions` (extra prop)**
- `UploadActionsProps` in the spec doesn't have `onClearQueue`. The component accepts it optionally.
- The "Limpar fila" button is a useful addition but not part of spec.

**Finding #12 — DropZone has extra `isCompact` prop not in spec §5.2**
- Not a bug, but the interface drifts from contract. The compact mode is a reasonable enhancement.

**Finding #13 — Direct `window.location.href` used for error redirects**
- `useBatchUpload.ts` lines 512 and 582 use `window.location.href` to redirect (401 and 409 cases).
- `UploadView.tsx` line 25 correctly uses `router.push()` for the success redirect.
- Inconsistency: client-side router vs full page reload.

**Finding #14 — `BatchSummaryBar` doesn't use `role="status"` or aria-live**
- The spec doesn't explicitly require it for this component, but the summary counter updates dynamically and should ideally announce changes to assistive technology.

**Finding #15 — `FileListItem` renders filename directly (not via i18n)**
- The file name is user-provided (not translated) — this is acceptable per spec. However, spec 02.4 §7.2 says filenames (which may contain CNPJ) should never be logged/sent to analytics. The current code doesn't send to analytics, which is correct.

**Finding #16 — `UploadProgressBar` uses `aria-valuemin={0}` not `aria-valuemin="0"`**
- This is actually correct (React JSX uses numbers), it matches the spec requirement `aria-valuemin="0"`. PASS — just a note.

**Finding #17 — `UseBatchUpload` staler-state risk in `runPresignAndUpload`**
- The `runPresignAndUpload` callback reads `state.fileIds` and `state.files` (line 551) but these are not in its `useCallback` dependency array (only `[uploadSingleFile]`).
- In practice, since `runPresignAndUpload` is called synchronously after dispatches that update state, the React state may not have been flushed yet, so it reads stale `state`. This works because it reads `state.fileIds`/`state.files` from the closure of the enclosing `submitBatch` callback which captured the pre-upload state — a subtle bug that happens to work correctly because the dispatches are synchronous in the reducer.
- If any async work happens between the dispatch and the read, this would break.

---

## Spec Coverage Matrix

### Spec 02.1 — State Machine & Orchestration

| Requirement | Status |
| --- | --- |
| §4.1 — BatchPhase type (9 phases) | PASS |
| §4.1 — FileUploadStatus type (5 statuses) | PASS |
| §4.1 — FileItemState interface (all fields) | PASS |
| §4.1 — BatchUploadState interface (all fields) | PASS |
| §4.2 — Hook return shape | PASS (+ extra `clearFiles`) |
| §5 — Concurrency pool inline, 4 workers | PASS |
| §6.1 — Local vs server data separation | PASS |
| §6.2 — sessionStorage for batchId on 401 | MISSING (Finding #1) |
| §6.3 — No automatic recovery on browser close | PASS (by absence) |
| §7 — idle to files_selected | PASS |
| §7 — files_selected to idle | PASS |
| §7 — files_selected to presigning | PASS |
| §7 — presigning to uploading | PASS |
| §7 — presigning to presign_error | PASS |
| §7 — presigning to /login redirect | PASS |
| §7 — uploading to confirming | PASS |
| §7 — confirming to success_full | PASS |
| §7 — confirming to success_partial | PASS |
| §7 — confirming to confirm_error | PASS |
| §7 — presign_error to presigning (retry) | PASS |
| §7 — confirm_error to confirming (retry) | PASS |
| §7 — success_full redirect (2s) | PASS |
| §7 — success_partial click "Ver batch" | PASS |
| §8.1 — uploadUrl never serialized outside memory | PASS |
| §8.2 — JWT via Supabase SDK only | PASS |
| §8.3 — objectKey from presign only | PASS |
| §8.4 — validationError files excluded from presign | PASS |

### Spec 02.3 — Components & A11Y

| Requirement | Status |
| --- | --- |
| §2 — All CCs use useTranslations('upload') | PASS (+ 9 missing keys) |
| §4 — Component hierarchy | PASS (+ unused components) |
| §5.1 — UploadView delegates to hook | PASS |
| §5.2 — DropZone props + a11y | PASS |
| §5.3 — FileInput props | MISSING (Finding #8) |
| §5.4 — FileList props + progressive disclosure | PASS |
| §5.5 — FileListItem props | PASS |
| §5.6 — FileTypeIcon SC | MISSING (Finding #7) |
| §5.7 — UploadProgressBar a11y | PASS |
| §5.8 — FileStatusBadge | MISSING (dead code, Finding #7) |
| §5.9 — BatchSummaryBar props | PASS |
| §5.10 — UploadActions props + a11y | PASS (+ extra props) |
| §5.11 — GlobalProgressBeam props + a11y | PASS |
| §5.12 — UploadResultSummary props | DEVIATION (Finding #9) |
| §6 a11y #1 — DropZone Tab/Enter/Space | PASS |
| §6 a11y #2 — FileInput aria-label | PASS |
| §6 a11y #3 — UploadProgressBar roles | PASS |
| §6 a11y #4 — GlobalProgressBeam label | PASS |
| §6 a11y #5 — Error messages role="alert" | MISSING (Finding #5, #10) |
| §6 a11y #6 — Loading button states | PASS |
| §6 a11y #7 — aria-live="polite" on invalid add | MISSING (Finding #5) |
| §6 a11y #8 — Contrast 4.5:1 | Not verifiable from code review alone |
| ADR-002 — Progressive disclosure >50 items | PASS |

### Spec 02.4 — Error Handling

| Requirement | Status |
| --- | --- |
| ADR-001 — i18n keys for error messages | PASS |
| §3.1 — PRESIGN_ERROR_KEYS | PASS |
| §3.1 — CONFIRM_ERROR_KEYS | PASS |
| §3.1 — STORAGE_ERROR_KEYS | PASS |
| §3.1 — VALIDATION_ERROR_KEYS | PASS |
| §3.2 — messages/pt-BR.json upload namespace | DEVIATION (9 missing keys, Finding #3) |
| §3.2 — 429 distinction (rate limit vs backpressure) | PASS |
| §4.1 — Pre-flight validation (MIME + size) | PASS |
| §4.1 — aria-live="polite" on invalid add | MISSING (Finding #5) |
| §4.2 — presign_error banners | PASS |
| §4.3 — Storage error handling (403 renewal, 400, network) | PASS |
| §4.4 — confirm_error banners | PASS |
| §5 — Offline banner + pause/resume | DEVIA (banner not reactive, Finding #4) |
| §6.1 — Inline error badge on FileListItem | PASS |
| §6.2 — Error container with bg-error-container | PASS |
| §6.2 — role="alert" on error item container | MISSING (Finding #5) |
| §6.2 — "TENTAR NOVAMENTE" individual retry | MISSING (Finding #6) |
| §6.3 — Global error banners with inline actions | MISSING (Finding #10) |
| §7.1 — Observability events interface | MISSING — No `UploadObservabilityEvent` tracking implemented |
| §7.2 — Security: no filename, uploadUrl, objectKey, JWT in logs | PASS (no analytics logging present) |
