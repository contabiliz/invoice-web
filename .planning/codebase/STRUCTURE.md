# Structure

## Directory Layout

```
invoice-web/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout (fonts, providers, i18n)
│   │   ├── page.tsx                 # Redirect → /login
│   │   ├── globals.css              # Global CSS tokens
│   │   ├── login/
│   │   │   └── page.tsx             # Login page (client)
│   │   ├── cadastro/
│   │   │   └── page.tsx             # Signup page (client)
│   │   └── (auth)/                  # Authenticated route group
│   │       ├── layout.tsx           # Shell: sidebar + topbar
│   │       ├── upload/
│   │       │   └── page.tsx         # Batch upload page
│   │       ├── batches/
│   │       │   └── [id]/
│   │       │       └── page.tsx     # Batch status/detail page
│   │       └── analytics/           # (not yet implemented)
│   │
│   ├── components/
│   │   ├── Providers.tsx            # QueryClientProvider wrapper
│   │   ├── auth/                    # Authentication components
│   │   │   ├── AuthCard.tsx
│   │   │   ├── AuthErrorBanner.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── __tests__/
│   │   ├── upload/                  # Batch upload components
│   │   │   ├── BatchSummaryBar.tsx
│   │   │   ├── DropZone.tsx
│   │   │   ├── FileInput.tsx
│   │   │   ├── FileList.tsx
│   │   │   ├── FileListItem.tsx
│   │   │   ├── FileStatusBadge.tsx
│   │   │   ├── FileTypeIcon.tsx
│   │   │   ├── GlobalProgressBeam.tsx
│   │   │   ├── UploadActions.tsx
│   │   │   ├── UploadProgressBar.tsx
│   │   │   ├── UploadResultSummary.tsx
│   │   │   ├── UploadView.tsx
│   │   │   └── index.ts
│   │   ├── batches/                 # Batch status components
│   │   │   ├── BatchHeader.tsx
│   │   │   ├── BatchProgressBar.tsx
│   │   │   ├── BatchResultBanner.tsx
│   │   │   ├── BatchStatusView.tsx
│   │   │   ├── DocTypeIcon.tsx
│   │   │   ├── DocumentRow.tsx
│   │   │   ├── DocumentTable.tsx
│   │   │   ├── DocumentTabs.tsx
│   │   │   ├── ErrorTooltip.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── KpiCards.tsx
│   │   │   ├── PollingIndicator.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── TablePagination.tsx
│   │   │   └── index.ts
│   │   ├── layout/                  # Layout components
│   │   │   ├── LanguageToggle.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNavBar.tsx
│   │   │   └── __tests__/
│   │   └── analytics/               # (empty/planned)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useBatchUpload.ts        # Batch upload state machine
│   │   ├── useBatchStatus.ts        # Adaptive polling logic
│   │   ├── useDocumentList.ts       # Document listing with tabs
│   │   └── __tests__/
│   │
│   ├── lib/                         # Utilities and clients
│   │   ├── api/
│   │   │   ├── batch-client.ts      # HTTP client (presign/upload/confirm)
│   │   │   ├── batch-status-client.ts  # HTTP client (status/docs)
│   │   │   ├── errors.ts            # Document error mapping
│   │   │   ├── error-keys.ts        # Typed i18n error keys
│   │   │   └── types.ts             # Manual API types
│   │   ├── auth/
│   │   │   ├── errors.ts            # Supabase auth error mapping
│   │   │   ├── schemas.ts           # Zod auth schemas
│   │   │   ├── utils.ts             # Safe callback URL
│   │   │   └── __tests__/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client (@supabase/ssr)
│   │   │   └── server.ts            # Server client (next/headers)
│   │   └── utils/
│   │       └── format.ts            # Formatting utilities
│   │
│   ├── i18n/                        # Internationalization
│   │   ├── request.ts               # Locale request detection
│   │   ├── translations/            # Translation JSON files
│   │   └── __tests__/
│   │
│   ├── middleware.ts                # Next.js Edge middleware
│   │
│   └── test/                        # Test utilities
│       ├── setup.ts                 # Vitest setup
│       ├── fixtures/
│       │   └── files.ts
│       └── mocks/
│           └── batch-api.ts
│
├── .agents/                         # Agent definitions (legacy?)
├── .claude/                         # Claude Code config + agents/skills
├── docs/
│   ├── prd/                         # Product Requirements Documents
│   └── specs/                       # Technical specs
├── .next/                           # Next.js build output (gitignored)
├── tailwind.config.*
├── tsconfig.json
├── postcss.config.*
├── package.json
└── CLAUDE.md                        # Project instructions
```

## Naming Conventions

- **Components**: PascalCase (e.g., `LoginForm.tsx`, `BatchStatusView.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useBatchUpload.ts`)
- **Utils**: camelCase (e.g., `format.ts`, `errors.ts`)
- **Directories**: kebab-case for features (e.g., `upload/`, `batch-status/`)
- **Test files**: Co-located in `__tests__/` directories with `.test.ts`/`.test.tsx` suffix

## Key File Locations

| Resource          | Location                                           |
|-------------------|----------------------------------------------------|
| Root layout       | `src/app/layout.tsx`                               |
| Auth layout       | `src/app/(auth)/layout.tsx`                        |
| API types         | `src/lib/api/types.ts`                             |
| Supabase clients  | `src/lib/supabase/client.ts` + `server.ts`        |
| Error mappings    | `src/lib/api/errors.ts` + `error-keys.ts`         |
| Auth error map    | `src/lib/auth/errors.ts`                           |
| Project config    | `CLAUDE.md`                                        |
| Tailwind tokens   | `tailwind.config.ts` (with Sovereign Ledger tokens)|
| Middleware        | `src/middleware.ts`                                |
