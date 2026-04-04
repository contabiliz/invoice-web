# Architecture

## System (full stack — 6 repos)

```
invoice-web (Next.js frontend)
    │  JWT Bearer
    ▼
invoice-api (FastAPI BFF)
    │  Redis pub/sub
    ▼
invoice-pipeline (Celery consumer + workers)
    │  delegates to
    ▼
invoice-processors (PDF/IMG/XML processing)
    └── shared ──► invoice-models (Pydantic types)
```

## Frontend Pattern

Next.js 15 App Router with:

- **Route Groups**: `(auth)` for authenticated layouts (sidebar + topbar), `(auth)` children inherit auth validation
- **Server Components default**: Pages/layouts are Server Components; `'use client'` used explicitly for interactive components
- **Hybrid rendering**: Server-side auth validation in layouts, client-side state management for interactive features

## End-to-End Data Flow

```
1. User drops files → Frontend (useBatchUpload hook)
2. Frontend → POST /batches/presign → invoice-api
3. invoice-api → creates batch in Supabase DB
4. invoice-api → generates presigned URLs (Supabase Storage)
5. invoice-api → returns batch_id + presign URLs to frontend
6. Frontend → uploads files directly to Supabase Storage (presigned URLs)
7. Frontend → POST /batches/{id}/confirm → invoice-api
8. invoice-api → verifies uploads succeeded (object_exists)
9. invoice-api → publishes to Redis "uploads.confirmed"
10. invoice-pipeline consumer → reads Redis → dispatches Celery tasks
11. Celery workers (xml/pdf/img) → process documents via invoice-processors
12. Workers → update status in Supabase DB
13. Frontend polls GET /batches/{id} → adaptive polling (2s-5s)
14. User sees real-time status updates
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

## Pipeline Architecture (backend)

### Consumer pattern
- `invoice_pipeline.consumer` reads from Redis pub/sub `uploads.confirmed`
- Dispatches to Celery with document type routing (xml/pdf/img)

### Worker queues
| Queue | Pool | Concurrency | Purpose |
|-------|------|-------------|---------|
| `queue.xml` | gevent | 10 | Parse NF-e XML directly |
| `queue.pdf` | prefork | 6 | Multi-profile extraction with field scoring |
| `queue.img` | gevent | 10 | Gemini API OCR |
| `queue.dlq` | prefork | 2 | Dead letter queue processing |
| `queue.promotion` | solo | 1 (4 replicas) | Update document promotion status |

### PDF processing design
- **Profiles**: `danfe_nfe55`, `base` — document type-specific extraction rules
- **Two-stage extraction**: Key candidates → value candidates → scoring → conflict resolution
- **Table handling**: Spatial scoring for table row extraction

## Backend Layer Structure (invoice-api)

```
app/
├── api/routes/        # FastAPI route handlers
├── adapters/          # Database, cache, storage port abstractions
├── core/              # Config, logging, security (JWT/JWKS)
└── main.py            # FastAPI app entry point
```

## Shared Model Layer (invoice-models)

All repos share `invoice_models` package for API contracts and DB models.
