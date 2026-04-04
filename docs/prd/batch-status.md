# PRD-03 — Status de Batch

> **Status:** `draft`
> **Versão:** 0.1
> **Autor:** —
> **Última atualização:** 2026-04-03
> **Depende de:** PRD-02 (Upload de Batch — o batch foi criado e o usuário é redirecionado aqui)

---

## 03.1 Visão geral

### 03.1.1 Objetivo

Permitir que o usuário acompanhe em tempo real o processamento de um batch de documentos fiscais. A tela comunica claramente quantos documentos foram concluídos, quantos ainda estão em processamento e quais falharam — com a razão de cada falha em linguagem acessível.

### 03.1.2 Jornada do usuário

O usuário chega a esta tela automaticamente após confirmar um upload bem-sucedido (PRD-02). Na parte superior, vê o identificador abreviado do batch, o status atual e há quanto tempo foi criado. Quatro cards de KPI mostram o total de documentos, os concluídos, os em processamento e os que falharam. Uma barra de progresso global dá a percepção visual de avanço.

Abaixo dos KPIs, uma tabela com quatro abas (Todos, Concluídos, Processando, Falhou) permite filtrar os documentos por status. A tabela atualiza automaticamente enquanto o processamento está ativo — o usuário não precisa recarregar a página. Quando um documento falha, a linha fica com fundo vermelho suave e a coluna "Razão" mostra a causa em português claro. Um tooltip no hover exibe a razão técnica completa para usuários que precisam de mais detalhe.

Quando o batch atinge um estado terminal (concluído, falha parcial ou falha total), o polling para automaticamente e um banner confirma o resultado final. O usuário pode então navegar para o dashboard de analytics (quando disponível) ou iniciar um novo upload.

### 03.1.3 Fora do escopo

- Reprocessamento de documentos falhos (v2)
- Download dos dados extraídos por documento individual (v2)
- Histórico de todos os batches do usuário (v2)
- Notificações por email quando o batch termina (v2)
- Compartilhamento de batch com outro usuário (v2)

---

## 03.2 Architecture Decision Records

### ADR-001 — Polling adaptativo em vez de Supabase Realtime (decisão M-05)

**Decisão:** V1 usa polling com intervalo adaptativo via `setInterval`. Supabase Realtime (WebSocket) fica como upgrade futuro.

**Contexto:** A decisão M-05 estava pendente — escolher entre polling e Supabase Realtime para atualização de status. O backlog (`BACKLOG.md`) lista isso como deferred decision.

**Razões para polling no v1:**
- Sem dependência de WebSocket — mais simples de debugar e monitorar
- A implementação do hook `useBatchStatus` abstrai o mecanismo — trocar por Realtime no futuro não muda a interface
- `GET /batches/{id}` é um PK lookup com custo de < 50ms — barato para polling

**Intervalos:**
- `processing > 0`: polling a cada **2s**
- `processing === 0 && queued > 0`: polling a cada **5s** (fila cheia, workers ocupados)
- Status terminal (`completed`, `partial_failure`, `failed`): **parar polling**

**Consequências:** Pequeno delay de até 2s entre a conclusão real no backend e a atualização na UI. Aceitável para este produto.

**Migração futura para Realtime:** substituir `setInterval` por `supabase.channel().on('postgres_changes', ...)` dentro do hook `useBatchStatus`, sem mudar a interface do hook.

---

### ADR-002 — Disclosure progressivo: tabs em vez de scroll único

**Decisão:** Os documentos são exibidos em abas (Todos / Concluídos / Processando / Falhou) em vez de uma lista única com scroll infinito.

**Razões:**
- Um analista que quer ver apenas os documentos falhos não precisa rolar 450 linhas de documentos concluídos
- Tabs deixam o contador de falhas visível o tempo todo (ex: "Falhou (4)") — o usuário sabe que há problemas sem precisar procurar
- Padrão Metabase: tabs previnem "data eyeball attack" em batches grandes

**Consequências:** A query ao backend usa `?status=failed` quando a aba "Falhou" está ativa. Cada troca de aba dispara uma nova query.

---

### ADR-003 — Tabela paginada, não virtualizada

**Decisão:** A tabela usa paginação server-side (50 docs/página) em vez de virtualização client-side.

**Razões:**
- O máximo de documentos por batch é 500 — não é volume suficiente para justificar virtualização
- Paginação server-side reduz o payload inicial e mantém a interface responsiva
- A API suporta `?page=N&page_size=50` nativamente

**Consequências:** Troca de página dispara nova chamada à API. O estado de paginação é local e reseta ao trocar de aba.

---

### ADR-004 — Linha de documento com erro tem destaque de linha inteira

**Decisão:** Documentos com `status = 'failed'` têm o fundo da linha inteira em `--color-status-error-bg` (vermelho suave).

**Razões:**
- Destaque de linha inteira é mais fácil de identificar em scan visual do que apenas um badge na coluna de status
- Padrão estabelecido pelo Docsumo para documentos com erro

**Consequências:** A coluna de status nesses casos ainda exibe o badge — o destaque de linha é adicional, não substituto.

---

## 03.3 Contrato com o BFF

### 03.3.1 Endpoints consumidos

| Endpoint | Método | Quando | Auth |
|---|---|---|---|
| `/api/v1/batches/{id}` | `GET` | A cada tick de polling | Bearer JWT |
| `/api/v1/batches/{id}/documents` | `GET` | Ao carregar aba + troca de aba + paginação | Bearer JWT |

### 03.3.2 Payloads relevantes

```ts
import type { components } from "@/types/api";

// GET /batches/{id} — resposta
type BatchStatusResponse = components["schemas"]["BatchStatusResponse"];
// {
//   batch_id: string
//   status: "pending_upload" | "processing" | "completed" | "partial_failure" | "failed"
//   total: number
//   queued: number
//   processing: number
//   completed: number
//   failed: number
//   created_at: string   // ISO8601
//   completed_at: string | null
// }

// GET /batches/{id}/documents — resposta
type DocumentListResponse = components["schemas"]["DocumentListResponse"];
// {
//   total: number
//   page: number
//   items: Array<{
//     document_id: string
//     filename: string
//     doc_type: "xml" | "pdf" | "img"
//     status: "pending_upload" | "upload_confirmed" | "queued" | "processing" | "completed" | "failed"
//     error_reason: string | null
//     created_at: string
//     updated_at: string
//   }>
// }
```

### 03.3.3 Query params para listagem

```
GET /batches/{id}/documents?page=1&page_size=50&status=failed
```

| Param | Valores | Padrão |
|---|---|---|
| `page` | Número inteiro ≥ 1 | 1 |
| `page_size` | 1–200 | 50 |
| `status` | `failed`, `completed`, `processing`, `queued` | (sem filtro = todos) |

---

## 03.4 Estados de UI

### 03.4.1 Mapa de estados

```
[loading — carregamento inicial]
    │
    ├─ erro de rede / 404 ──────────→ [error_page]
    ├─ batch carregado ─────────────→ [active_polling]
    │
[active_polling — batch em processamento]
    │
    ├─ tick do polling ─────────────→ [active_polling] (atualiza contadores)
    ├─ status = terminal ───────────→ [terminal]
    ├─ erro de polling ─────────────→ [polling_error_banner] + continua tentando
    │
[terminal — batch em estado final]
    │
    ├─ completed ───────────────────→ banner verde "Batch concluído"
    ├─ partial_failure ─────────────→ banner âmbar "X concluídos, Y falharam"
    ├─ failed ──────────────────────→ banner vermelho "Todos os documentos falharam"
    │
[error_page — batch não encontrado]
    │ mensagem de erro + botão "Voltar para upload"
```

### 03.4.2 Definição de cada estado

#### `loading`
| Atributo | Descrição |
|---|---|
| **O que é exibido** | 4 skeleton cards de KPI + skeleton da tabela |
| **Ações disponíveis** | Nenhuma |
| **Transições** | → `active_polling` ou `error_page` |

#### `active_polling`
| Atributo | Descrição |
|---|---|
| **O que é exibido** | KPI cards com contadores reais + barra de progresso + tabela paginada. Indicador "Atualizando…" discreto no canto superior direito enquanto polling ativo. |
| **Ações disponíveis** | Trocar aba, paginar, hover em linha para tooltip de erro |
| **Transições** | → `terminal` quando status é final |

#### `terminal`
| Atributo | Descrição |
|---|---|
| **O que é exibido** | Banner no topo com resultado final. KPI cards com totais definitivos. Tabela com todos os documentos. Polling parado. |
| **Ações disponíveis** | Ver detalhes de documentos falhos, navegar para analytics, iniciar novo upload |
| **Transições** | — (estado final) |

#### `polling_error_banner`
| Atributo | Descrição |
|---|---|
| **O que é exibido** | Toast não-bloqueante: "Sem conexão — tentando reconectar…". Última versão dos dados permanece visível. |
| **Ações disponíveis** | Aguardar reconexão automática |
| **Transições** | → `active_polling` ao reconectar |

---

## 03.5 Especificação de componentes

### 03.5.1 Árvore de componentes

```
BatchStatusPage (SC — route: /batches/[id])
└── BatchStatusView (CC — polling, estado global)
    ├── BatchHeader (CC — id abreviado, status dot, tempo relativo)
    ├── KpiCards (CC — 4 cards: Total, Concluídos, Processando, Falhou)
    │   └── KpiCard (CC) × 4
    ├── BatchProgressBar (CC — barra global)
    ├── DocumentTabs (CC — tabs + contadores + tabela filtrada)
    │   ├── TabTriggers (CC — Todos / Concluídos / Processando / Falhou)
    │   └── DocumentTable (CC — tabela paginada)
    │       └── DocumentRow (CC) × N
    │           ├── DocTypeIcon (SC)
    │           ├── StatusBadge (CC)
    │           └── ErrorTooltip (CC — hover)
    ├── BatchResultBanner (CC — visível em estado terminal)
    └── PollingIndicator (CC — "Atualizando…" discreto)
```

### 03.5.2 Hook principal

```ts
function useBatchStatus(batchId: string): {
  batch: BatchStatusResponse | null;
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
}

function useDocumentList(
  batchId: string,
  options: { status?: DocumentStatus; page: number; pageSize: number }
): {
  data: DocumentListResponse | null;
  isLoading: boolean;
  error: string | null;
}
```

### 03.5.3 Lógica de polling

```ts
// Intervalo adaptativo baseado no estado do batch
function getPollingInterval(batch: BatchStatusResponse | null): number | null {
  if (!batch) return null;
  if (isTerminalStatus(batch.status)) return null; // parar
  if (batch.processing > 0) return 2000;           // 2s
  if (batch.queued > 0) return 5000;               // 5s (fila cheia)
  return 3000;                                     // fallback
}

function isTerminalStatus(status: string): boolean {
  return ["completed", "partial_failure", "failed"].includes(status);
}
```

---

## 03.6 Gestão de estado

| Dado | Onde vive | Justificativa |
|---|---|---|
| Status do batch | `useBatchStatus` hook (polling) | Server state, atualizado externamente |
| Lista de documentos | `useDocumentList` hook | Server state, depende de filtro e página |
| Aba ativa | `useState` local | UI state, sem persistência necessária |
| Página atual | `useState` local | UI state, reseta ao trocar aba |
| JWT | Supabase SDK | Gerenciado pelo SDK |

---

## 03.7 Tratamento de erros

| Cenário | Componente | Mensagem |
|---|---|---|
| `GET /batches/{id}` retorna 404 | Página de erro full | "Batch não encontrado ou sem permissão." |
| `GET /batches/{id}` retorna 401 | Redirect para login | — |
| Erro de rede no polling | Toast não-bloqueante | "Sem conexão — tentando reconectar…" |
| `error_reason` de documento | Tooltip no hover | Mensagem mapeada (PT-BR) + razão técnica completa |

### 03.7.1 Mapeamento de `error_reason`

Usar `mapDocumentError` de `src/lib/api/errors.ts`.

---

## 03.8 Segurança e privacidade

- [ ] JWT enviado via `Authorization: Bearer` em todo polling
- [ ] `batch_id` na URL é UUID — não contém dados do usuário
- [ ] Filenames exibidos na tabela — não enviar a serviços de analytics
- [ ] `error_reason` com razão técnica exibida apenas no tooltip do hover, não na linha visível

---

## 03.9 Requisitos de acessibilidade

- [ ] Contadores de KPI têm `aria-live="polite"` para anunciar atualizações
- [ ] Indicador "Atualizando…" tem `aria-live="polite"` e `aria-atomic="true"`
- [ ] Tabela tem `role="table"` com headers adequados
- [ ] Tooltip de erro acessível via teclado (foco + Enter)
- [ ] Banner de resultado tem `role="status"` (sucesso) ou `role="alert"` (falha)

---

## 03.10 Métricas e observabilidade

| Evento | Quando | Dados |
|---|---|---|
| `batch_viewed` | Página carregada | `batch_id` (UUID), `doc_count` |
| `batch_completed_seen` | Banner terminal exibido | `status`, `completed_count`, `failed_count`, `duration_ms` |
| `batch_error_tab_opened` | Aba "Falhou" clicada | `failed_count` |

---

## 03.11 Guia para prototipação no Paper

### 03.11.1 Frames a criar

| Frame | Estado | Prioridade |
|---|---|---|
| `Status — loading (skeleton)` | `loading` | Alta |
| `Status — processing (30% concluído)` | `active_polling` | Alta |
| `Status — processing (aba Falhou ativa)` | `active_polling` | Alta |
| `Status — terminal (completed)` | `terminal` | Alta |
| `Status — terminal (partial_failure)` | `terminal` | Alta |
| `Status — terminal (failed)` | `terminal` | Alta |
| `Status — polling error (banner)` | `polling_error_banner` | Média |

### 03.11.2 Elementos críticos a validar

- [ ] 4 KPI cards com bom contraste e sem aglomeração
- [ ] Barra de progresso global legível sem ser invasiva
- [ ] Tabs com contadores visíveis e badge de destaque em "Falhou"
- [ ] Linha de documento com erro tem fundo diferenciado sem alarmar
- [ ] Tooltip de razão técnica legível e posicionado sem cortar viewport
- [ ] Indicador "Atualizando…" discreto sem distrair da tabela

---

## 03.12 Critérios de aceitação

### Funcionais
- [ ] **T-FUNC-01** — Contadores de KPI atualizam automaticamente sem reload da página
- [ ] **T-FUNC-02** — Polling para quando batch atinge estado terminal
- [ ] **T-FUNC-03** — Aba "Falhou" mostra apenas documentos com `status = 'failed'`
- [ ] **T-FUNC-04** — Tooltip de linha com erro exibe mensagem PT-BR (não `error_reason` raw)
- [ ] **T-FUNC-05** — Troca de aba não reinicia o polling — apenas recarrega a lista
- [ ] **T-FUNC-06** — Batch em estado terminal exibe banner correto (verde/âmbar/vermelho)
- [ ] **T-FUNC-07** — Paginação funciona dentro de cada aba independentemente
- [ ] **T-FUNC-08** — Batches de outro usuário retornam 404 (não exibem dados alheios)

### Segurança
- [ ] **T-SEC-01** — Acessar `/batches/[uuid-de-outro-usuario]` retorna 404
- [ ] **T-SEC-02** — JWT expirado durante polling dispara refresh e continua

### Performance
- [ ] **T-PERF-01** — Skeleton carrega em < 100ms (nenhum dado real necessário)
- [ ] **T-PERF-02** — Cada tick de polling não causa re-render da tabela inteira — apenas contadores

---

## 03.13 O que não fazer

**Não fazer polling infinito.**
Parar quando `isTerminalStatus(batch.status)` retorna `true`. Polling após estado terminal é desperdício de recursos e não atualiza nada.

**Não exibir `error_reason` raw na tabela.**
A coluna "Razão" exibe mensagem mapeada em PT-BR. A razão técnica completa fica no tooltip do hover — para quem precisa de mais detalhe sem poluir a linha.

**Não invalidar o cache da lista ao fazer polling do status.**
O polling de status (`GET /batches/{id}`) atualiza apenas os contadores. A lista de documentos (`GET /batches/{id}/documents`) só é refetchada na troca de aba ou paginação — não a cada tick de polling.

**Não usar `router.refresh()` para atualizar o status.**
`router.refresh()` re-executa Server Components e causa flash de layout. Usar React Query ou `setInterval` client-side para atualizar apenas os dados de status.

**Não redirecionar automaticamente após batch terminal.**
O usuário pode querer revisar os resultados antes de navegar. Exibir o banner com ação clara, sem redirect automático.

---

## Histórico de revisões

| Versão | Data | Autor | Mudança |
|---|---|---|---|
| 0.1 | 2026-04-03 | — | Rascunho inicial |
