# Stack

## Overview

| Layer       | Technology                                   |
|-------------|----------------------------------------------|
| Framework   | Next.js 15.1 (App Router)                    |
| Language    | TypeScript 5 (strict mode, ES2017 target)    |
| Runtime     | Node.js 22+                                  |
| UI Library  | React 19                                     |
| CSS         | Tailwind CSS 3 + PostCSS                     |
| State Mgmt  | TanStack Query v5 (server state)             |
| Forms       | React Hook Form 7 + Zod                      |
| Auth        | Supabase SSR (`@supabase/ssr` 0.5)           |
| i18n        | next-intl 3.26 (pt-BR + en)                  |
| API Client  | Axios 1.7 + JWT interceptor                  |
| Testing     | Vitest 2 + Testing Library 16                |
| Package Mgr | pnpm (inferred from commands)               |

## Key Dependencies

### Production

| Package                   | Version   | Purpose                              |
|---------------------------|-----------|--------------------------------------|
| `next`                    | ^15.1.3   | Framework, App Router                |
| `react` / `react-dom`     | ^19.0.0   | UI rendering                         |
| `@supabase/ssr`           | ^0.5.2    | Server-side Supabase client          |
| `@supabase/supabase-js`   | ^2.49.1   | Browser Supabase client              |
| `@tanstack/react-query`   | ^5.62.11  | Server state management              |
| `axios`                   | ^1.7.9    | HTTP client with interceptors        |
| `zod`                     | ^3.24.1   | Schema validation                    |
| `react-hook-form`         | ^7.54.2   | Form state management                |
| `@hookform/resolvers`     | ^3.9.1    | Zod resolver for RHF                 |
| `next-intl`               | ^3.26.3   | Internationalization (PT-BR/EN)      |
| `lucide-react`            | ^0.468.0   | Icon library                         |
| `class-variance-authority`| ^0.7.1    | Component variants (shadcn-style)    |
| `clsx` / `tailwind-merge` | ^2.x      | Conditional className merging        |

### Dev

| Package                              | Version   | Purpose                          |
|--------------------------------------|-----------|----------------------------------|
| `vitest`                             | ^2.1.8    | Test runner                      |
| `@testing-library/react`             | ^16.1.0   | Component testing                |
| `@testing-library/user-event`        | ^14.5.2   | User interaction simulation      |
| `@testing-library/jest-dom`          | ^6.6.3    | DOM assertion matchers           |
| `jsdom`                              | ^25.0.1   | DOM simulation                   |
| `typescript`                         | ^5        | Type checking                    |
| `tailwindcss`                        | ^3.4.17   | CSS framework                    |

## Font Stack

| Font            | CSS Variable          | Usage                    |
|-----------------|----------------------|--------------------------|
| Inter           | `--font-inter`       | Body text, labels        |
| JetBrains Mono  | `--font-jetbrains-mono` | Numeric/tax data tables |
| Manrope         | `--font-manrope`     | Headlines, display       |

## TypeScript Config

- `strict: true`, `noEmit: true`, `target: ES2017`
- `moduleResolution: "bundler"`
- Path alias: `@/*` → `./src/*`
- `plugins: [{ name: "next" }]` for incremental types
- `exclude: ["node_modules"]`
