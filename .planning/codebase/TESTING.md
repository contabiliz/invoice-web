# Testing

## Framework

- **Vitest 2** — test runner
- **@testing-library/react 16** — component rendering and queries
- **@testing-library/user-event 14** — user interaction simulation
- **@testing-library/jest-dom 6** — DOM matchers (`toBeVisible()`, etc.)
- **jsdom 25** — browser DOM simulation

## Setup

- `src/test/setup.ts` — imports `@testing-library/jest-dom` for matchers
- Minimal test config — no global mocks defined by default

## Test Structure

- **Co-located `__tests__/` directories** next to source:
  - `src/components/auth/__tests__/LoginForm.test.tsx`
  - `src/components/auth/__tests__/SignupForm.test.tsx`
  - `src/components/layout/__tests__/LanguageToggle.test.tsx`
  - `src/components/layout/__tests__/Sidebar.test.tsx`
  - `src/hooks/__tests__/useBatchUpload.test.ts`
  - `src/lib/auth/__tests__/errors.test.ts`
  - `src/lib/auth/__tests__/schemas.test.ts`
  - `src/lib/auth/__tests__/utils.test.ts`
  - `src/i18n/__tests__/request.test.ts`
  - `src/i18n/__tests__/translations.test.ts`
  - `src/__tests__/middleware-i18n.test.ts`
- **File naming**: `[name].test.ts` for pure functions, `[name].test.tsx` for components

## Test Utilities

- `src/test/fixtures/files.ts` — test file fixtures
- `src/test/mocks/batch-api.ts` — API response mocks

## Coverage

Commands:
- `pnpm test` — run all tests
- `pnpm test:ui` — run with Vitest UI for interactive debugging

## Patterns

- Pure functions in hooks are tested in isolation (e.g., `deriveBatchPhase`, `getPollingInterval`, `isTerminalStatus`)
- Schema validation tests (Zod schemas)
- Error mapping tests (Supabase → i18n key mapping)
- Component rendering tests with Testing Library queries
