# Integrations

## System Architecture (5 repos + frontend)

```
invoice-web (Next.js frontend)
    │
    ▼  JWT Bearer
invoice-api (FastAPI BFF) ──► Supabase Auth
    │                              │
    │  Redis (uploads.confirmed)   │  Supabase Storage (presigned URLs)
    ▼                              │
invoice-pipeline                  │
    ├── consumer (Redis → Celery) │
    ├── worker-xml   (queue.xml)  │
    ├── worker-pdf   (queue.pdf)  │
    ├── worker-img   (queue.img)  │
    ├── worker-dlq   (queue.dlq)  │
    └── worker-promotion          │
         │                        │
    invoice-processors            │
    └── invoice-models ◄──────────┘
         (shared types/schemas)
```

## invoice-api (FastAPI BFF)

- **Path**: `D:\Contabiliz\invoice-api`
- **Base URL**: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- **Routes**:
  - `POST /api/v1/batches/presign` — create batch + presigned URLs (202)
  - `POST /api/v1/batches/{id}/confirm` — verify uploads + publish to Redis (200)
  - `GET /api/v1/batches/{id}` — batch status summary
  - `GET /api/v1/batches/{id}/documents` — paginated document list
  - `GET /api/v1/health` — health check
- **Auth**: Supabase JWT via `get_current_user` dependency (validates against JWKS)
- **Rate limiting**: 10 presign/minute per user (via Redis cache)
- **Backpressure**: Rejects if queue depth > `QUEUE_HIGH_WATER_MARK` (10,000)
- **Presign semaphore**: 30 concurrent presign operations
- **SEC-004**: Object keys validated as `{user_id}/{batch_id}/{doc_id}`

## invoice-pipeline (Celery workers)

- **Path**: `D:\Contabiliz\invoice-pipeline`
- **Consumer**: `invoice_pipeline.consumer` — reads Redis `uploads.confirmed` channel, dispatches to Celery
- **Workers** (via `invoice_pipeline.celery_app`):
  - `worker-xml` — queue.xml, gevent pool, concurrency=10
  - `worker-pdf` — queue.pdf, prefork pool, concurrency=6
  - `worker-img` — queue.img, gevent pool, concurrency=10 (uses Gemini API for OCR)
  - `worker-dlq` — queue.dlq, prefork pool, concurrency=2 (dead letter queue)
  - `worker-promotion` — queue.promotion, solo pool, concurrency=1, 4 replicas
  - `celery-beat` — scheduler for periodic tasks

## invoice-processors (Document processing logic)

- **Path**: `D:\Contabiliz\invoice-processors`
- **PDF processor**: Multi-profile extraction with field scoring, key/value candidate matching, table extraction
  - Profiles: `danfe_nfe55`, `base`
  - Services: extraction, field_scorer, key_candidate_finder, value_candidate_finder, table_items_extractor, conflict_resolver
  - Table handling: scoring-based algorithm
- **XML processor**: Direct parsing from NF-e XML format
- **Debug tools**: `debug/pdf/` and `debug/xml/` for development

## invoice-models (Shared Pydantic models)

- **Path**: `D:\Contabiliz\invoice-models`
- **API models**: `BatchPresignRequest/Response`, `DocumentListResponse`, `DocumentPresignUrl`, `DocumentStatus`, `UploadConfirmationNotification`
- **DB models**: `invoice_models/db.py`
- **Enums**: Document types, statuses
- **Extraction models**: XML, PDF, Image result schemas
- **Validators**: Data validation logic
- **Tasks**: Task definitions for Celery

## invoice-infra (Docker + deployment)

- **Path**: `D:\Contabiliz\invoice-infra`
- **Local dev**: `docker-compose.yml` — Redis + invoice-api + consumer + workers
- **Supabase**: External dependency — `supabase start` required
- **Profiles**: `consumer`, `workers` — use `docker compose --profile consumer up`
- **GitHub token**: Required for building (private repos) via `scripts/github_app_token.py`
- **Load testing**: `scripts/load_test.py`

## Supabase (Auth + Storage + PostgreSQL)

- **Auth**: JWT via `@supabase/ssr` — cookie-based sessions
- **Storage**: Presigned URLs for upload (15 min expiry)
- **Object key pattern**: `{user_id}/{batch_id}/{document_id}` — no client-side construction
- **PostgreSQL**: Via PgBouncer (port 6543, transaction pooling)
- **Local ports**: 54322 (DB), 54321 (API/Storage)

## Redis

- **Role 1**: Backpressure + rate limiting for invoice-api
- **Role 2**: Pub/sub channel `uploads.confirmed` — consumer reads and pushes to Celery
- **Local port**: 6379
- **Broker**: Same Redis as Celery broker

## i18n (Frontend)

- `next-intl` with pt-BR (default) + en
- Error key mapping: `src/lib/api/error-keys.ts`, `src/lib/api/errors.ts`, `src/lib/auth/errors.ts`

## Environment Variables

### Frontend (invoice-web)
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Invoice API base URL |

### Backend (invoice-api + invoice-pipeline)
| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name |
| `DATABASE_URL` | PgBouncer connection |
| `DATABASE_DIRECT_URL` | Direct DB connection (migrations) |
| `REDIS_URL` | Redis connection |
| `CELERY_BROKER_URL` | Celery broker |
| `FRONTEND_URL` | CORS origin |
| `GEMINI_API_KEY` | Gemini OCR (image processing) |
