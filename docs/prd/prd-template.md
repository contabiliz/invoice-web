# PRD-XX — [Nome da Tela]

> **Status:** `draft` | `review` | `approved` | `implemented`
> **Versão:** 0.1
> **Autor:** —
> **Última atualização:** YYYY-MM-DD
> **Depende de:** PRD-XX (se aplicável)

---

## XX.1 Visão geral

### XX.1.1 Objetivo

Uma ou duas frases descrevendo o propósito desta tela. O que o usuário consegue fazer aqui que não conseguia antes?

### XX.1.2 Jornada do usuário

Narrativa sequencial em prosa — o que o usuário faz, passo a passo, desde a entrada na tela até o resultado final. Não usar bullet points aqui; o objetivo é que qualquer pessoa leia e entenda o fluxo sem ambiguidade.

> **Exemplo:** O usuário acessa a tela de upload, seleciona um ou mais arquivos do dispositivo, revisa a lista antes de confirmar e inicia o envio. Enquanto os uploads acontecem, uma barra de progresso individual é exibida para cada arquivo. Ao término, o usuário é redirecionado automaticamente para a tela de status do batch criado.

### XX.1.3 Fora do escopo

O que esta tela explicitamente não faz (evita escopo creep e documenta decisões):

- Item 1
- Item 2

---

## XX.2 Architecture Decision Records

### ADR-001 — [Título da decisão]

**Decisão:** O que foi decidido.

**Contexto:** Por que essa decisão foi necessária.

**Razões:**

- Razão 1
- Razão 2

**Consequências:** O que muda por causa desta decisão. O que fica mais difícil ou mais simples.

**O que foi rejeitado:** Alternativas consideradas e por que foram descartadas.

> _Adicionar um ADR por cada decisão de design, estado, roteamento ou integração que não seja óbvia._

---

## XX.3 Contrato com o BFF

### XX.3.1 Endpoints consumidos

Lista completa de endpoints da `invoice-api` utilizados por esta tela.

| Endpoint           | Método | Quando é chamado                 | Autenticação |
| ------------------ | ------ | -------------------------------- | ------------ |
| `/batches/presign` | POST   | Ao confirmar seleção de arquivos | Bearer JWT   |
| `/batches/{id}`    | GET    | A cada tick de polling           | Bearer JWT   |

### XX.3.2 Payloads relevantes

Referenciar os tipos gerados por `openapi-typescript`. Não duplicar a definição — apenas indicar o tipo e descrever o que a tela faz com ele.

```ts
// Gerado automaticamente de /openapi.json via openapi-typescript
import type { components } from "@/types/api";

type BatchPresignRequest = components["schemas"]["BatchPresignRequest"];
type BatchPresignResponse = components["schemas"]["BatchPresignResponse"];
type BatchStatusResponse = components["schemas"]["BatchStatusResponse"];
```

### XX.3.3 Fluxo de autenticação

Descrever como o JWT chega a esta tela (via Supabase JS SDK, cookie, contexto React) e o que acontece quando expira durante uma operação em andamento.

---

## XX.4 Estados de UI

Esta é a seção mais importante para a prototipação no Paper. Cada estado deve ter uma tela correspondente no wireframe.

### XX.4.1 Mapa de estados

```
[Estado inicial]
    │
    ├─ [ação do usuário ou evento] ──→ [Próximo estado]
    │
    └─ [condição de erro] ──────────→ [Estado de erro]
```

### XX.4.2 Definição de cada estado

Para cada estado, definir:

| Atributo                 | Descrição                                            |
| ------------------------ | ---------------------------------------------------- |
| **Nome**                 | Nome canônico do estado (usado no código e no Paper) |
| **Gatilho**              | O que faz a tela entrar neste estado                 |
| **O que é exibido**      | Descrição dos elementos visíveis                     |
| **Ações disponíveis**    | O que o usuário pode fazer neste estado              |
| **Transições possíveis** | Para quais estados pode ir a partir daqui            |

**Estados obrigatórios em toda tela:**

- `idle` — estado inicial/padrão
- `loading` — aguardando resposta do BFF
- `success` — operação concluída com sucesso
- `error` — erro recuperável (com mensagem e ação de retry)
- `empty` — sem dados para exibir (quando aplicável)

**Estados específicos desta tela:**

> _Adicionar aqui os estados adicionais, por exemplo: `uploading`, `confirming`, `partial_failure`, etc._

---

## XX.5 Especificação de componentes

### XX.5.1 Árvore de componentes

Hierarquia de componentes Next.js/React para esta tela. Identificar quais são Server Components (SC) e Client Components (CC).

```
Page (SC)
└── Layout
    ├── Header (SC)
    └── [NomeDaTela]View (CC)
        ├── [ComponenteA] (CC)
        │   └── [ComponenteB] (CC)
        └── [ComponenteC] (SC)
```

### XX.5.2 Responsabilidades por componente

| Componente         | Tipo | Responsabilidade                                | Props principais |
| ------------------ | ---- | ----------------------------------------------- | ---------------- |
| `[NomeDaTela]View` | CC   | Gerencia estado da tela, orquestra chamadas BFF | —                |
| `[ComponenteA]`    | CC   | Descrever                                       | `prop1`, `prop2` |

### XX.5.3 Hooks customizados

Para cada hook relevante desta tela:

```ts
// Descrever o que o hook faz, seus parâmetros e retorno esperado
function use[NomeDoHook](params: Params): Return {
  // estado, chamadas BFF, lógica de retry
}
```

---

## XX.6 Gestão de estado

### XX.6.1 Estado local vs servidor

| Dado                           | Onde vive               | Justificativa                       |
| ------------------------------ | ----------------------- | ----------------------------------- |
| Lista de arquivos selecionados | `useState` local        | Transitório, não precisa persistir  |
| Status do batch                | React Query / SWR       | Serverstate, precisa de revalidação |
| JWT do usuário                 | Supabase JS SDK context | Gerenciado pelo SDK                 |

### XX.6.2 Estratégia de cache/revalidação

Descrever a estratégia de polling ou realtime para dados que mudam enquanto o usuário está na tela.

- **Polling:** frequência, condição de parada, backoff
- **Supabase Realtime:** canal, evento, como atualiza o estado local

> _Decisão M-05 pendente: Supabase Realtime vs polling. Enquanto não resolvida, usar polling com intervalo de [X]s._

---

## XX.7 Tratamento de erros

### XX.7.1 Erros esperados do BFF

| HTTP Status | Origem                    | Mensagem para o usuário                       | Ação disponível              |
| ----------- | ------------------------- | --------------------------------------------- | ---------------------------- |
| `401`       | JWT expirado              | "Sua sessão expirou. Faça login novamente."   | Redirecionar para login      |
| `422`       | Arquivo inválido          | "Tipo de arquivo não suportado."              | Remover arquivo da lista     |
| `429`       | Rate limit / backpressure | "Serviço ocupado. Tente em alguns instantes." | Botão de retry com countdown |
| `500`       | Erro interno              | "Algo deu errado. Tente novamente."           | Botão de retry               |

### XX.7.2 Erros de rede / cliente

| Situação                                          | Comportamento esperado                                         |
| ------------------------------------------------- | -------------------------------------------------------------- |
| Timeout no upload                                 | Marcar documento como falho, permitir retry individual         |
| Perda de conexão durante polling                  | Exibir banner "Sem conexão", retomar ao reconectar             |
| Upload parcial (objeto não encontrado no confirm) | Exibir documento específico como falho, não bloquear os outros |

---

## XX.8 Segurança e privacidade

Checklist derivado das restrições do backend (`06-security/06.1-authentication.md` e `02-api/02.1-specification.md`):

- [ ] JWT é enviado via header `Authorization: Bearer`, nunca em query param ou corpo
- [ ] `user_id` nunca é lido do corpo da resposta para construir paths — sempre do JWT via SDK
- [ ] Nenhuma credencial (JWT, service key) é logada no console do browser
- [ ] Object keys enviados para o BFF são os retornados pelo presign — nunca construídos no cliente
- [ ] Filenames que podem conter CNPJ/CPF não são enviados a serviços de analytics/monitoramento
- [ ] Campos com CNPJ/CPF não aparecem em URL params (sem SSR com dados fiscais na URL)

---

## XX.9 Requisitos de acessibilidade

- [ ] Todos os elementos interativos são acessíveis via teclado
- [ ] Estados de loading têm `aria-live` ou `aria-busy` configurados
- [ ] Mensagens de erro têm `role="alert"`
- [ ] Progresso de upload tem `role="progressbar"` com `aria-valuenow`
- [ ] Labels de formulário associadas via `htmlFor` / `aria-labelledby`

---

## XX.10 Métricas e observabilidade

### XX.10.1 Eventos a instrumentar

| Evento                   | Quando disparar                   | Dados relevantes                  |
| ------------------------ | --------------------------------- | --------------------------------- |
| `batch_upload_started`   | Ao chamar `/presign`              | `doc_count`, `total_size_bytes`   |
| `batch_upload_completed` | Ao receber resposta do `/confirm` | `confirmed_count`, `failed_count` |
| `batch_upload_error`     | Em qualquer erro                  | `error_code`, `step`              |

> _Não incluir CNPJ, CPF, filenames ou valores financeiros nos eventos._

### XX.10.2 Web Vitals alvo

| Métrica                         | Alvo    |
| ------------------------------- | ------- |
| LCP (Largest Contentful Paint)  | < 2.5s  |
| CLS (Cumulative Layout Shift)   | < 0.1   |
| INP (Interaction to Next Paint) | < 200ms |

---

## XX.11 Guia para prototipação no Paper

Esta seção instrui diretamente o uso do Paper MCP para criação do wireframe.

### XX.11.1 Telas a criar no Paper

Lista das telas/frames necessários, mapeando para os estados de UI definidos em XX.4:

| Frame no Paper     | Estado correspondente | Prioridade |
| ------------------ | --------------------- | ---------- |
| `[Tela] — idle`    | `idle`                | Alta       |
| `[Tela] — loading` | `loading`             | Alta       |
| `[Tela] — success` | `success`             | Alta       |
| `[Tela] — error`   | `error`               | Média      |
| `[Tela] — empty`   | `empty`               | Baixa      |

### XX.11.2 Elementos críticos a validar no wireframe

Antes de avançar para a spec técnica, estes elementos devem estar presentes e aprovados no wireframe:

- [ ] Hierarquia visual principal (heading, área de conteúdo, CTAs)
- [ ] Feedback de progresso/loading
- [ ] Exibição de erros inline (não só toast)
- [ ] Layout responsivo (mobile-first)
- [ ] Estado vazio com call-to-action

### XX.11.3 Decisões de design a documentar após wireframe

Após o wireframe, atualizar as seções XX.5 e XX.6 com as decisões tomadas:

- Componentes identificados no wireframe que não estavam na árvore inicial
- Mudanças no fluxo de estados descobertas durante a prototipação
- Padrões de layout definidos (grid, spacing tokens, breakpoints)

---

## XX.12 Critérios de aceitação

### XX.12.1 Funcionais (deve passar antes de qualquer deploy)

- [ ] **T-FUNC-01** — [Descrever o cenário de teste funcional mais crítico]
- [ ] **T-FUNC-02** — [Segundo cenário]
- [ ] **T-FUNC-03** — Erros do BFF exibem mensagem adequada ao usuário (não "Internal Server Error" raw)
- [ ] **T-FUNC-04** — JWT expirado redireciona para login sem perder o contexto da navegação

### XX.12.2 De segurança (derivados de `06-security/06.1-authentication.md`)

- [ ] **T-SEC-01** — Sem token JWT válido, a tela redireciona para login (não exibe dados)
- [ ] **T-SEC-02** — Usuário A não consegue visualizar dados do Usuário B mesmo com UUID correto na URL
- [ ] **T-SEC-03** — Object keys na requisição correspondem exatamente ao retorno do presign

### XX.12.3 De performance

- [ ] **T-PERF-01** — Primeira renderização da tela < 1s em conexão 4G simulada
- [ ] **T-PERF-02** — [Critério específico desta tela]

---

## XX.13 O que não fazer

Seção de anti-padrões específicos desta tela (seguindo o padrão "What Not To Do" do projeto):

**Não construir object keys no cliente.**
O cliente deve usar exatamente o `object_key` retornado pelo endpoint `/presign`. Construir o path manualmente (`${userId}/${batchId}/${docId}`) no frontend é um anti-padrão — se a estrutura mudar no backend, o cliente quebra silenciosamente.

**Não fazer polling infinito.**
O polling deve parar quando o batch atinge um estado terminal (`completed`, `partial_failure`, `failed`). Polling sem condição de parada mantém conexões abertas desnecessariamente e gera carga no BFF.

**Não exibir mensagens de erro do BFF diretamente ao usuário.**
O campo `detail` das respostas de erro do FastAPI contém mensagens técnicas. O frontend deve mapear HTTP status codes para mensagens amigáveis e registrar o `detail` apenas internamente.

**Não armazenar o JWT em localStorage.**
O Supabase JS SDK gerencia o token em memória com persistência via cookies httpOnly. Nunca replicar o token em `localStorage` — é um vetor de XSS.

> _Adicionar anti-padrões específicos descobertos durante o desenvolvimento desta tela._

---

## Histórico de revisões

| Versão | Data       | Autor | Mudança          |
| ------ | ---------- | ----- | ---------------- |
| 0.1    | YYYY-MM-DD | —     | Rascunho inicial |
