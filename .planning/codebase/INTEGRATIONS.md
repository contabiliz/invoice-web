# Integrations

## External Services

### Supabase (Auth + Storage)

- **Client**: Server-side via `src/lib/supabase/server.ts` (`createClient()`), browser via `src/lib/supabase/client.ts` (`createClient()`)
- **Auth**: Cookie-based sessions via `@supabase/ssr` — tokens never in localStorage
- **Middleware Auth**: `src/middleware.ts` uses `supabase.auth.getUser()` to protect routes
- **Storage**: Presigned URL pattern — front-end never constructs object keys directly
- **JWT Flow**: Browser client fetches session from cookies, attaches as `Authorization: Bearer <token>` via Axios interceptor in `src/lib/api/batch-client.ts`

### Invoice API (FastAPI BFF)

- **Base URL**: `process.env.NEXT_PUBLIC_API_URL` (configured in `.env`)
- **Auth**: All requests carry `Authorization: Bearer <access_token>` via Axios request interceptor
- **Endpoints used**:
  - `POST /api/v1/batches/presign` — presigned URL generation
  - `POST /api/v1/batches/{id}/confirm` — confirm uploaded documents
  - `GET /api/v1/batches/{id}` — batch status
  - `GET /api/v1/batches/{id}/documents` — document listing
- **Client instances**:
  - `apiClient` — `src/lib/api/batch-client.ts` with JWT interceptor
  - `storageClient` — separate Axios instance for presigned URL uploads (no JWT)
- **Type generation**: `pnpm generate:types` → `src/types/api.ts` via `openapi-typescript` from `http://localhost:8000/openapi.json`

## Auth Routes

| Route         | Method | Purpose                                |
|---------------|--------|----------------------------------------|
| `/login`      | GET    | Login form                             |
| `/cadastro`   | GET    | Signup form                            |
| Protected     | —      | `/upload`, `/batches/:id`, `/analytics`|

## Middleware Auth Guard

- Protected paths: `/upload`, `/batches`, `/analytics` (defined as `PROTECTED_PREFIXES`)
- Auth routes with active session redirect to `/upload`
- Unauthenticated access to protected paths redirect to `/login` with `callbackUrl` param
- Locale cookie default: `pt-BR` applied in `applyLocaleCookie()`
- Cookie matcher excludes static files and images

## Environment Variables

| Variable                            | Usage                              |
|-------------------------------------|------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase project URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Supabase anonymous key (public)    |
| `NEXT_PUBLIC_API_URL`               | Invoice API base URL               |

## Data Flow

```
User action → Component → Hook/useReducer
  → apiClient (Axios + JWT interceptor) → Invoice API (FastAPI)
  → Response → State update → UI render

Storage upload → presigned URL → storageClient (no JWT) → Supabase Storage
```

## i18n Integration

- `next-intl` with `getLocale()` / `getMessages()` in root layout
- Locale detection: defaults to `pt-BR` if no `locale` cookie present
- Supported locales: `pt-BR`, `en`
- Translation files: `src/i18n/translations/`
- Error key mapping: `src/lib/api/error-keys.ts` (upload), `src/lib/api/errors.ts` (document errors)
