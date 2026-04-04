# Architecture

## Pattern

Next.js 15 App Router with:

- **Route Groups**: `(auth)` for authenticated layouts (sidebar + topbar), `(auth)` children inherit auth validation
- **Server Components default**: Pages/layouts are Server Components; `'use client'` used explicitly for interactive components
- **Hybrid rendering**: Server-side auth validation in layouts, client-side state management for interactive features

## Data Flow

```
Request → middleware.ts (auth guard + locale) → AuthLayout → Page
                                                  │
                                            Server Components (data fetch)
                                                  │
                                            Client Components (interactive UI)
                                                  │
                                            Hooks (useReducer + useQuery)
                                                  │
                                            API Client (Axios + JWT)
```

## Auth Flow

1. **Middleware** (`src/middleware.ts`) runs first on every request:
   - Creates Supabase client from cookies
   - Calls `supabase.auth.getUser()` to validate JWT
   - Protects: `/upload`, `/batches`, `/analytics`
   - Redirects authenticated users away from `/login` and `/cadastro`
   - Applies default `pt-BR` locale cookie

2. **AuthLayout** (`src/app/(auth)/layout.tsx`) also validates server-side:
   - Creates Supabase server client
   - Calls `supabase.auth.getUser()` again
   - Renders `Sidebar` + `TopNavBar` + `LanguageToggle`
   - Passes user data to nav (avatar initial)

3. **API Client** (`src/lib/api/batch-client.ts`):
   - Axios request interceptor fetches session from `@supabase/ssr` browser client
   - Attaches `Authorization: Bearer <access_token>` to every request

## Key Abstractions

### State Management

| Layer                | Pattern                    | File                                    |
|----------------------|----------------------------|-----------------------------------------|
| Batch upload state   | `useReducer` + `useCallback` | `src/hooks/useBatchUpload.ts`        |
| Batch status polling | TanStack `useQuery` + adaptive polling | `src/hooks/useBatchStatus.ts` |
| Document list        | Custom hook                | `src/hooks/useDocumentList.ts`          |
| Global providers     | `QueryClientProvider`      | `src/components/Providers.tsx`          |

### Error Mapping

- **Auth errors**: `src/lib/auth/errors.ts` → `mapSupabaseAuthError()` (Supabase `AuthError` → i18n key)
- **Document errors**: `src/lib/api/errors.ts` → `mapDocumentError()` (API `error_reason` → i18n key)
- **Upload errors**: `src/lib/api/error-keys.ts` → typed constants for presign/confirm/storage/validation
- **Rule**: Never pass raw API error messages to UI — always map through i18n keys

### Upload Concurrency

- `uploadWithConcurrency()` in `useBatchUpload.ts` — worker pool pattern with 4 concurrent uploads
- Offline detection pauses uploads; online event resumes
- Expired presigned URLs trigger automatic single retry with fresh presign call

### Polling Strategy

- Adaptive polling interval based on batch state:
  - 2s if items in `processing`
  - 5s if items `queued` (no processing yet)
  - 3s default
- Stops on terminal status (`completed`, `partial_failure`, `failed`)
- Retries up to 3 times on network errors; 401/404 are non-retryable
- Online event triggers forced refetch

## Entry Points

| Entry Point                  | Type     | Purpose                        |
|------------------------------|----------|--------------------------------|
| `src/app/page.tsx`           | Server   | Redirect to `/login`           |
| `src/app/login/page.tsx`     | Client   | Login form                     |
| `src/app/cadastro/page.tsx`  | Client   | Signup form                    |
| `src/app/(auth)/layout.tsx`  | Server   | Authenticated shell            |
| `src/app/(auth)/upload/page.tsx`    | Client | Upload page + batch flow   |
| `src/app/(auth)/batches/[id]/page.tsx` | Client | Batch status detail |

## Component Architecture

- **Components grouped by feature**: `src/components/upload/`, `src/components/batches/`, `src/components/auth/`, `src/components/layout/`
- **Barrel exports**: Each feature module has `index.ts` re-exporting public components
- **Shared components**: `src/components/ui/` (shadcn, should not edit directly)
- **Tests co-located**: `__tests__/` directories alongside components
