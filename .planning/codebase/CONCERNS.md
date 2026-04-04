# Concerns

## Technical Debt

### 1. Manual API Types
- **Location**: `src/lib/api/types.ts`
- **Issue**: API types are manually maintained alongside `openapi-typescript` generated types. There's a risk of drift between manual types and the actual API contract.
- **Risk**: Medium — if the API changes and types aren't updated, compile-time safety is compromised.
- **Recommendation**: Migrate to fully generated types via `openapi-typescript` for all API contracts, or use a single source of truth.

### 2. Dual Auth Validation
- **Location**: `src/middleware.ts` + `src/app/(auth)/layout.tsx`
- **Issue**: Auth is validated twice — once in Edge middleware, again in the Server Component auth layout.
- **Risk**: Low — redundant but safe. The double-check may actually be intentional for defense-in-depth, but it adds latency.

### 3. No shadcn/ui Components Visible
- **Location**: `src/components/ui/`
- **Issue**: CLAUDE.md references shadcn/ui as a core dependency but no `ui/` components were found in the source tree listing. Either they're dynamically generated or the setup is incomplete.
- **Risk**: Low — may just be missing from the scan.

### 4. Analytics Route Not Implemented
- **Location**: `src/app/(auth)/analytics/`
- **Issue**: The route is listed as protected in middleware but no page implementation found. Users who navigate to `/analytics` may see a 404 or empty page.
- **Risk**: Low — likely still in development.

## Potential Issues

### 5. Presigned URL Expiry Handling
- **Location**: `src/hooks/useBatchUpload.ts` (lines 388-439)
- **Issue**: Only one retry on 403 expired URL. If the first retry also fails, the upload is permanently failed. For slow connections + short expiry windows, this is fragile.
- **Risk**: Medium — depends on presigned URL TTL configuration.

### 6. Concurrent Upload Queue Mutation
- **Location**: `src/hooks/useBatchUpload.ts` (lines 271-282)
- **Issue**: The worker pool uses `queue.shift()` which is not thread-safe in the traditional sense, but since it's a single JS event loop, this is actually safe. However, the `.catch(() => {})` silently swallows upload errors at the worker level — they're supposed to be handled inside `uploadSingleFile`, but if anything throws unhandled, it's invisible.
- **Risk**: Low — errors are handled inside each task, but the catch-all hides unexpected exceptions.

### 7. Locale Detection is Hardcoded
- **Location**: `src/middleware.ts` (lines 55-58, 62-70)
- **Issue**: `applyLocaleCookie()` hardcodes `pt-BR` as default regardless of `Accept-Language` header. The actual locale detection happens via `next-intl` in `src/i18n/request.ts`, but the middleware default bypasses it.
- **Risk**: Low — users get pt-BR until next-intl takes over, which may cause a brief flash.

### 8. Storage Client Without Timeouts
- **Location**: `src/lib/api/batch-client.ts` (line 29)
- **Issue**: The `storageClient` (for presigned URL uploads) has no timeout configuration. Very slow networks could hang indefinitely.
- **Risk**: Low — browser fetch has its own timeouts, but explicit Axios timeout would be cleaner.

### 9. Error Handling in Reducer
- **Location**: `src/hooks/useBatchUpload.ts` (lines 279, 431)
- **Issue**: Several `catch(() => {})` and `catch {}` blocks that silently ignore errors. The intention is to not block the worker pool, but debugging production issues becomes harder.
- **Risk**: Medium — consider at minimum logging to console in development.

### 10. No Rate Limiting on Client Side
- **Location**: Throughout
- **Issue**: No client-side rate limiting for API calls. The `useBatchStatus` hook refetches with adaptive intervals, and if multiple tabs/batches are open, it could overwhelm the API.
- **Risk**: Low for current usage — becomes important as user count grows.

## Security Notes

- **Good practices observed**:
  - JWT never in localStorage — `@supabase/ssr` cookie management
  - `getSafeCallbackUrl()` protects against open redirect attacks
  - Never exposing raw API error messages to users
  - Presigned URLs never logged or tracked

- **Areas to watch**:
  - Environment variables use `NEXT_PUBLIC_` prefix — these are exposed to the browser (intentional for Supabase anon key and API URL, but ensure no secrets use this prefix)
