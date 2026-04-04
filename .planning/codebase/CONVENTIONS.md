# Conventions

## Code Style

### TypeScript

- **Strict mode** enabled — no implicit `any`, strict null checks, strict function types
- **No `any`** — use `unknown` + type guard (enforced by CLAUDE.md rules)
- **Path aliases** — `@/*` maps to `./src/*`
- **ES2017 target** — modern async/await, no downleveling
- **Module resolution**: `bundler` — ESM-first

### Components

- **Server Components default** — `'use client'` only when needed (hooks, event handlers, `useState`)
- **PascalCase** for component files: `LoginForm.tsx`, `BatchStatusView.tsx`
- **Feature grouping** — components grouped by domain: `upload/`, `batches/`, `auth/`, `layout/`
- **Barrel exports** — each feature has `index.ts` for clean public API
- **Props** — inline type definitions, no separate `.d.ts` files for component props
- **No shadcn/ui edits** — `src/components/ui/` should not be edited directly

### Hooks

- **camelCase** with `use` prefix: `useBatchUpload.ts`, `useBatchStatus.ts`
- **Custom hooks** — return object with `state` + action methods
- **Pure functions extracted** — testable logic separated from hook side effects (e.g., `deriveBatchPhase()`, `getPollingInterval()` in `useBatchStatus.ts`)

### Error Handling

- **Never expose raw backend errors** — always map through error mapping layers
- **Auth errors**: `src/lib/auth/errors.ts` → `mapSupabaseAuthError()` → i18n key
- **Document errors**: `src/lib/api/errors.ts` → `mapDocumentError()` → i18n key
- **Upload errors**: `src/lib/api/error-keys.ts` → typed constant objects
- **API errors**: `BatchApiError` class with HTTP status code
- **i18n keys** — use dot notation: `errors.session_expired`, `errors.doc.object_not_found`

### Security Patterns

- **JWT via Bearer header only** — never in query params or body
- **No localStorage for tokens** — `@supabase/ssr` manages cookies
- **Presigned URLs** — never logged, never sent to analytics
- **CNPJ in filenames** — never sent to analytics
- **Object keys** — use exactly what API returns, never construct manually
- **Callback URL validation** — `getSafeCallbackUrl()` prevents open redirects

### CSS / Styling

- **Tailwind CSS 3** for all styling
- **CSS custom properties** — design tokens mapped in `tailwind.config.ts`
- **Font variables** — `--font-inter`, `--font-jetbrains-mono`, `--font-manrope`
- **Numeric data** — `font-mono` + `tabular-nums` for fiscal tables
- **No inline styles** — Tailwind utility classes only

### Next.js 15 Conventions

- `params` is a Promise — `await params` or `use(params)` in Server Components
- `cookies()` is async — `await cookies()`
- Layouts are Server Components by default
- Route groups via directory parentheses: `(auth)/`
