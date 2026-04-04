# CLAUDE.md — invoice-web

> Guia de contexto para o Claude Code operar neste repositório.
> Leia este arquivo antes de qualquer tarefa no projeto.

---

## O que é este projeto

`invoice-web` é o frontend do sistema Contabiliz — plataforma SaaS B2B para processamento automatizado de documentos fiscais brasileiros (NF-e XML, PDF DANFE, imagens de cupom térmico). Consome a `invoice-api` (FastAPI Python) como BFF — o backend já está completamente provisionado.

---

## Arquitetura

```
invoice-web (este repo) → consome → invoice-api (FastAPI, Railway)
                                          │
                                   Supabase Auth (JWT)
                                   Supabase Storage (presigned URLs)
                                   Supabase PostgreSQL (via API/RLS)
```

O frontend **nunca acessa o banco diretamente**. Toda comunicação é via API REST com JWT Bearer.

---

## Stack

| Camada       | Tecnologia                                                       |
| ------------ | ---------------------------------------------------------------- |
| Framework    | Next.js 15, App Router, TypeScript strict                        |
| UI           | shadcn/ui (Radix UI + Tailwind CSS 3)                            |
| Fontes       | Geist Sans (textos) + Geist Mono (dados numéricos — obrigatório) |
| Ícones       | Lucide React                                                     |
| Auth         | Supabase JS SDK (`@supabase/ssr`)                                |
| Server state | TanStack Query v5                                                |
| Formulários  | React Hook Form + Zod                                            |
| API types    | `openapi-typescript` → `src/types/api.ts`                        |
| Testes       | Vitest + Testing Library                                         |

---

## Estrutura

```
invoice-web/
├── CLAUDE.md                  ← este arquivo
├── docs/
│   ├── prd/                   ← PRDs por tela
│   │   ├── prd-template.md
│   │   ├── auth.md            ← PRD-01
│   │   ├── upload-batch.md    ← PRD-02
│   │   └── batch-status.md    ← PRD-03
│   └── specs/                 ← Specs técnicas (SDD)
│       └── upload-batch.md
├── src/
│   ├── app/
│   │   ├── (auth)/            ← rotas autenticadas (sidebar + topbar)
│   │   │   ├── layout.tsx     ← valida sessão server-side
│   │   │   ├── upload/
│   │   │   ├── batches/[id]/
│   │   │   └── analytics/
│   │   ├── login/
│   │   ├── layout.tsx         ← root layout (Geist, globals.css)
│   │   ├── globals.css        ← tokens CSS do DESIGN.md
│   │   └── page.tsx           ← redirect para /login
│   ├── components/
│   │   ├── ui/                ← shadcn/ui (não editar diretamente)
│   │   ├── upload/
│   │   ├── batches/
│   │   └── analytics/
│   ├── hooks/
│   ├── lib/
│   │   ├── api/               ← cliente HTTP + mapeamento de erros
│   │   ├── supabase/          ← client.ts (browser) + server.ts (SSR)
│   │   └── utils/
│   ├── middleware.ts           ← auth middleware (sessão em todo request)
│   └── types/
│       └── api.ts             ← gerado por openapi-typescript
```

---

## Regras críticas (não negociáveis)

### Segurança

- JWT via `Authorization: Bearer` — nunca em query param ou body
- JWT nunca em `localStorage` — `@supabase/ssr` gerencia via cookies
- `object_key` do storage: usar exatamente o retornado pelo presign — nunca construir
- `upload_url` (presigned URL): nunca logar, nunca passar a analytics
- Filenames podem conter CNPJ (`NF_12345678000195.xml`) — nunca a analytics

### Tipagem

- Nunca `any` — usar `unknown` + type guard
- Tipos de API de `src/types/api.ts` — nunca duplicar definições
- Dados numéricos fiscais em tabela: **sempre Geist Mono + `tabular-nums`**

### Next.js 15

- `params` é Promise — sempre `await params` ou `use(params)` em CC
- `cookies()` é async — sempre `await cookies()`
- Sem `'use client'` desnecessário — SC é o padrão
- Sem fetch em Client Components — usar TanStack Query

### Erros

- Nunca exibir `detail` do FastAPI ao usuário — mapear via `src/lib/api/errors.ts`
- Mapeamento de `error_reason` → PT-BR em `DESIGN.md §8.3`

---

## Processo SDD

```
PRD → Wireframe (Stitch MCP) → Spec → Implementação
```

**Nunca implementar sem spec aprovada.**
Consultar `docs/prd/` e `docs/specs/` antes de qualquer código de feature.

---

## Documentação de referência

| Documento     | Localização                                                     |
| ------------- | --------------------------------------------------------------- |
| Design system | `D:\Contabiliz\invoice-docs\DESIGN.md`                          |
| API spec      | `D:\Contabiliz\invoice-docs\02-api\02.1-specification.md`       |
| Auth spec     | `D:\Contabiliz\invoice-docs\06-security\06.1-authentication.md` |
| DB schema     | `D:\Contabiliz\invoice-docs\05-database\05.1-schema.md`         |

---

## Agents disponíveis (`.claude/agents/`)

| Agent                | Arquivo                 | Quando usar                                    |
| -------------------- | ----------------------- | ---------------------------------------------- |
| `api-agent`          | `api-agent.md`          | Endpoints BFF, payloads, auth JWT, rate limits |
| `infra-agent`        | `infra-agent.md`        | Supabase, Storage, Vercel, env vars            |
| `design-agent`       | `design-agent.md`       | Tokens CSS, tipografia, shadcn/ui, tabelas     |
| `upload-agent`       | `upload-agent.md`       | Fluxo presign → upload → confirm               |
| `sdd-agent`          | `sdd-agent.md`          | Processo SDD, status PRDs/specs                |
| `reviewer-agent`     | `reviewer-agent.md`     | **Revisar PRDs e specs antes de avançar**      |
| `architecture-agent` | `architecture-agent.md` | Decisões SC/CC, estado, estrutura de pastas    |
| `nextjs-agent`       | `nextjs-agent.md`       | App Router, params async, caching, middleware  |

---

## Comandos

```bash
pnpm install         # instalar dependências
pnpm dev             # desenvolvimento (http://localhost:3000)
pnpm build           # build de produção
pnpm type-check      # tsc --noEmit
pnpm generate:types  # regenerar tipos da API (invoice-api rodando em :8000)
pnpm lint            # ESLint
pnpm test            # Vitest
```
