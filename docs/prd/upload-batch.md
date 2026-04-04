# PRD-02 — Upload de Batch

> **Status:** `draft`
> **Versão:** 0.1
> **Autor:** —
> **Última atualização:** 2026-04-03
> **Depende de:** PRD-01 (Autenticação — usuário precisa estar autenticado)

---

## 02.1 Visão geral

### 02.1.1 Objetivo

Permitir que o usuário selecione um ou mais documentos fiscais (XML NF-e, PDF DANFE ou imagem de cupom térmico) e os envie para o sistema de processamento em um único fluxo. Ao final, cada documento é colocado na fila de extração e o usuário é encaminhado para a tela de acompanhamento do batch criado.

### 02.1.2 Jornada do usuário

O usuário acessa a tela de upload e seleciona os arquivos que deseja processar, seja arrastando-os para uma área de drop ou clicando para abrir o seletor de arquivos do sistema operacional. À medida que os arquivos são adicionados, a tela exibe a lista com nome, tipo inferido e tamanho de cada um. O usuário pode remover arquivos individuais antes de confirmar.

Ao clicar em "Enviar batch", o sistema valida os arquivos localmente (tipo MIME e tamanho), chama o endpoint `/batches/presign` para obter as URLs de upload e persiste os registros no banco. Em seguida, os uploads são realizados em paralelo diretamente no Supabase Storage, sem passar pela API. Uma barra de progresso individual é exibida para cada arquivo.

Quando todos os uploads terminam — com sucesso ou falha individual —, o sistema chama automaticamente `/batches/{id}/confirm` para verificar quais objetos chegaram ao storage e publicar os documentos confirmados na fila de processamento. O usuário vê um resumo do resultado: quantos documentos foram confirmados e quantos falharam na verificação. Um documento que falha no upload não bloqueia os demais.

Após o confirm, o usuário é redirecionado automaticamente para a tela de status do batch (PRD-03). Se houver documentos que precisam ser reenviados, o usuário pode fazê-lo individualmente a partir da tela de status.

### 02.1.3 Fora do escopo

- Reenvio individual de documentos falhos (responsabilidade da tela de status — PRD-03)
- Pré-visualização do conteúdo dos arquivos antes do envio
- Compressão ou conversão de arquivos pelo cliente
- Upload via URL externa (o sistema só aceita arquivos locais)
- Acompanhamento do processamento (OCR, extração de dados) — PRD-03
- Histórico de batches anteriores

---

## 02.2 Architecture Decision Records

### ADR-001 — Upload direto ao Supabase Storage, não via API

**Decisão:** Os arquivos são enviados diretamente ao Supabase Storage usando presigned URLs geradas pela API. O frontend nunca envia bytes de arquivo para a `invoice-api`.

**Contexto:** A `invoice-api` roda em Railway/ECS e não foi projetada como proxy de arquivos. O endpoint `/batches/presign` retorna `upload_url` e `object_key` por documento — o frontend usa o `upload_url` para um PUT direto ao storage.

**Razões:**

- Vercel serverless functions têm limite de ~4.5 MB por request body. Batches de documentos fiscais excedem facilmente esse limite.
- Elimina a API do caminho crítico de dados — menos latência, menos infraestrutura sobrecarregada.
- Padrão estabelecido para object storage: o servidor assina, o cliente faz o upload diretamente.

**Consequências:** O frontend precisa gerenciar dois contextos de chamada: a API (para presign/confirm/status) e o Supabase Storage (para os PUTs). Os erros de upload vêm do storage, não da API, e têm formato diferente (HTTP 403/400 sem corpo JSON estruturado).

**O que foi rejeitado:** Upload via API como proxy. Descartado por limitações de tamanho, latência e custo de infraestrutura.

---

### ADR-002 — Confirm em batch único, não por documento

**Decisão:** O frontend chama `POST /batches/{id}/confirm` uma única vez, após todos os uploads do batch finalizarem (com sucesso ou falha), passando todos os `document_id` de uma vez.

**Contexto:** Havia a opção de confirmar cada documento individualmente à medida que seu upload terminasse, para iniciar o processamento o mais cedo possível.

**Razões:**

- Uma chamada de confirm em vez de N reduz a complexidade de coordenação no cliente.
- O pipeline é assíncrono — um atraso de segundos entre o upload e a fila de processamento é irrelevante para o usuário.
- A resposta do confirm já traz o resumo completo: quais documentos foram aceitos, quais falharam. Com confirms individuais, o cliente precisaria agregar N respostas.

**Consequências:** Documentos de upload rápido ficam em `upload_confirmed` aguardando o mais lento do batch antes de serem publicados na fila. Este é o tradeoff aceito (documentado em ADR-005 da spec da API).

**O que foi rejeitado:** Confirm por documento. Descartado por complexidade de cliente e ausência de benefício observável para o usuário.

---

### ADR-003 — Validação local antes do presign

**Decisão:** O frontend valida tipo MIME e tamanho de cada arquivo antes de chamar `/batches/presign`. Arquivos inválidos são rejeitados imediatamente na UI, sem consumir chamadas de API.

**Contexto:** A API rejeita arquivos com tipo MIME não suportado ou acima de 50 MB com `422`. Essa validação poderia ser deixada exclusivamente para o backend.

**Razões:**

- Feedback imediato ao usuário sem latência de rede.
- Não desperdiça uma chamada de presign (que tem rate limit de 10/min por usuário) para rejeitar arquivos que o cliente já sabe que são inválidos.
- Tipos aceitos são fixos e conhecidos: `image/jpeg`, `image/png`, `image/webp`, `image/tiff`, `application/pdf`, `application/xml`, `text/xml`.

**Consequências:** A validação do cliente é duplicada em relação à do servidor — isso é intencional. O servidor é a fonte da verdade; o cliente valida para UX, não para segurança. Se os critérios mudarem no backend, o frontend pode exibir um erro 422 do servidor como fallback.

**O que foi rejeitado:** Validação apenas no servidor. Descartado por experiência de usuário ruim (latência de rede para receber uma rejeição previsível).

---

### ADR-004 — `object_key` retornado pelo presign é a fonte canônica para o confirm

**Decisão:** O frontend armazena o `object_key` retornado por `/batches/presign` para cada documento e o usa como referência ao chamar o confirm. O cliente nunca constrói o path `{user_id}/{batch_id}/{doc_id}` por conta própria.

**Contexto:** A estrutura do object key segue o padrão `{user_id}/{batch_id}/{document_id}` (definido em ADR-006 da spec da API). Seria possível para o cliente construir este path localmente após receber os UUIDs.

**Razões:**

- Se a estrutura do key mudar no backend, o cliente quebra silenciosamente ao construir o path localmente.
- O servidor já retorna o `object_key` no presign — usá-lo diretamente é a implementação mais simples e robusta.
- Segurança: o server valida que o key pertence ao usuário autenticado antes de gerar a URL; construir o key no cliente contorna essa validação indirecionada.

**Consequências:** O estado local do upload precisa mapear `document_id → object_key` desde o momento do presign. Este mapeamento é necessário para o confirm e para exibir o status individual de cada arquivo durante o upload.

---

### ADR-005 — Uploads paralelos com limite de concorrência

**Decisão:** Os N uploads de um batch são executados em paralelo, com um limite máximo de concorrência configurável (default: 4 uploads simultâneos).

**Contexto:** O frontend pode disparar todos os N PUTs simultaneamente (máximo 500) ou serializá-los. Ambos os extremos são problemáticos.

**Razões:**

- Uploads totalmente serializados são lentos em batches grandes — o usuário aguarda desnecessariamente.
- Uploads totalmente paralelos em batches de 500 documentos saturarão a conexão do usuário e podem ser bloqueados pelo Supabase Storage como flood.
- Um limite de 4 simultâneos oferece boa utilização de banda sem sobrecarregar a conexão ou o storage.

**Consequências:** A barra de progresso global reflete os uploads concluídos vs total, não os ativos vs inativos. O limite de concorrência deve ser uma constante configurável, não hardcoded, para facilitar ajuste sem reimplantação.

---

### ADR-006 — Falhas de upload não cancelam o batch

**Decisão:** Se um ou mais arquivos falharem no upload (timeout, 403 de URL expirada, 400 do storage), o batch continua. Os arquivos que enviaram com sucesso são confirmados normalmente; os que falharam são marcados como `failed` no confirm com razão `object_not_found`.

**Contexto:** O confirm da API é tolerante a falhas parciais — ele retorna `{ confirmed: [...], failed: [...] }`. O frontend pode optar por cancelar o batch inteiro em caso de qualquer falha individual, ou processar o máximo possível.

**Razões:**

- Um batch de 100 documentos onde 1 falhou por timeout não deveria bloquear os outros 99.
- O usuário pode reenviar os documentos falhos individualmente na tela de status (PRD-03).
- A API foi projetada para confirmar parcialmente — aproveitar essa capacidade é o comportamento correto.

**Consequências:** O resumo pós-confirm precisa comunicar claramente quais documentos foram aceitos e quais falharam, com ação de retry disponível para os falhos. O estado do batch pode ser `partial_failure` quando isso ocorre.

---

### ADR-007 — Presigned URLs expiradas tratadas como erro recuperável

**Decisão:** Se o upload de um documento retorna `403` do Supabase Storage (URL expirada), o cliente tenta obter uma nova presigned URL para aquele documento específico e repete o upload uma vez. Após uma segunda falha, o documento é marcado como `upload_failed` localmente e incluído no array `failed` do confirm.

**Contexto:** As presigned URLs expiram em 15 minutos (configurado em `PRESIGN_EXPIRY_SECONDS`). Para batches grandes em conexões lentas, isso pode ocorrer na prática.

**Razões:**

- 403 de URL expirada é distinto de 403 de permissão negada — a URL pode ser renovada.
- Uma única tentativa de renovação cobre o caso de uso legítimo (conexão lenta) sem loop infinito.
- Não há endpoint de renovação de presign individual ainda — a renovação exige chamar `/batches/presign` novamente para os documentos afetados. A API aceita isso e não cria novas linhas no banco (idempotente por `document_id`).

**Consequências:** O cliente precisa distinguir `403` de URL expirada de outras falhas `403`. Heurística: se o upload falhou com `403` e o `upload_url_expires_at` do documento já passou, tentar renovar. Caso contrário, tratar como erro terminal de permissão.

---

## 02.3 Contrato com o BFF

### 02.3.1 Endpoints consumidos

| Endpoint                             | Método | Quando é chamado                                  | Auth       |
| ------------------------------------ | ------ | ------------------------------------------------- | ---------- |
| `/api/v1/batches/presign`            | `POST` | Ao clicar em "Enviar batch", após validação local | Bearer JWT |
| `/api/v1/batches/{batch_id}/confirm` | `POST` | Após todos os uploads finalizarem                 | Bearer JWT |

O upload em si (`PUT {upload_url}`) vai diretamente ao Supabase Storage — não passa pela API e não leva o JWT da aplicação (a autenticação é feita pela própria presigned URL).

### 02.3.2 Payloads relevantes

```ts
// Gerado automaticamente de /openapi.json via openapi-typescript (CI)
import type { components } from "@/types/api";

// POST /batches/presign — request
type BatchPresignRequest = components["schemas"]["BatchPresignRequest"];
// {
//   documents: Array<{
//     filename: string       // nome original do arquivo
//     mime_type: MimeType    // tipo MIME declarado pelo cliente
//     file_size: number      // tamanho em bytes (1 a 52_428_800)
//   }>
// }

// POST /batches/presign — response (202)
type BatchPresignResponse = components["schemas"]["BatchPresignResponse"];
// {
//   batch_id: string                  // UUID do batch criado
//   documents: Array<{
//     document_id: string             // UUID do documento
//     upload_url: string              // URL presignada para PUT direto ao storage
//     upload_url_expires_at: string   // ISO8601 — expiração da URL (15 min)
//     object_key: string              // "{user_id}/{batch_id}/{doc_id}" — usar no confirm
//   }>
// }

// POST /batches/{id}/confirm — request
// { document_ids: string[] }         // UUIDs dos docs com upload bem-sucedido

// POST /batches/{id}/confirm — response (200)
// {
//   confirmed: string[]
//   failed: Array<{ document_id: string; reason: string }>
// }
```

### 02.3.3 Tipos MIME aceitos

A validação local deve usar esta lista — idêntica ao enum `MimeType` do backend:

```ts
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "application/pdf",
  "application/xml",
  "text/xml",
] as const;
```

### 02.3.4 Limites a validar localmente

| Restrição                      | Valor                    | Fonte                                            |
| ------------------------------ | ------------------------ | ------------------------------------------------ |
| Tamanho máximo por arquivo     | 50 MB (52.428.800 bytes) | `Field(le=52_428_800)` em `DocumentMetadata`     |
| Máximo de documentos por batch | 500                      | `Field(max_length=500)` em `BatchPresignRequest` |
| Mínimo de documentos por batch | 1                        | `Field(min_length=1)`                            |

### 02.3.5 Fluxo de autenticação

O JWT é obtido pelo Supabase JS SDK (`supabase.auth.getSession()`). O hook `useSession()` do SDK deve ser usado para acessar o token — nunca lido de `localStorage` diretamente.

Se o JWT expirar durante o upload (sessão de 1 hora), o Supabase SDK realiza o refresh automaticamente. O cliente deve usar sempre `supabase.auth.getSession()` antes de cada chamada à API para garantir um token fresco. O endpoint de confirm pode receber um `401` se o refresh falhar — nesse caso, redirecionar para login mantendo o estado de progresso dos uploads no `sessionStorage` para eventual recuperação.

---

## 02.4 Estados de UI

### 02.4.1 Mapa de estados

```
[idle — área de drop vazia]
    │
    ├─ usuário adiciona arquivos ───────────────────→ [files_selected]
    │
[files_selected — lista de arquivos]
    │
    ├─ usuário remove todos os arquivos ────────────→ [idle]
    ├─ arquivo inválido adicionado ─────────────────→ [files_selected] + erro inline
    ├─ usuário clica "Enviar batch" ────────────────→ [presigning]
    │
[presigning — chamando /batches/presign]
    │
    ├─ erro 429 (rate limit / backpressure) ────────→ [presign_error]
    ├─ erro 401 ────────────────────────────────────→ redirect login
    ├─ erro 5xx ────────────────────────────────────→ [presign_error]
    ├─ sucesso ─────────────────────────────────────→ [uploading]
    │
[uploading — PUT parallel com progresso por arquivo]
    │
    ├─ upload 403 (URL expirada) ───────────────────→ [renewing_url] → retry → [uploading]
    ├─ upload completo (todos terminaram) ──────────→ [confirming]
    │
[confirming — chamando /batches/{id}/confirm]
    │
    ├─ erro 5xx ────────────────────────────────────→ [confirm_error]
    ├─ sucesso (todos confirmed) ───────────────────→ [success_full]
    ├─ sucesso (parcial: alguns failed) ────────────→ [success_partial]
    │
[success_full]   ──→ redirect automático para PRD-03 (status do batch)
[success_partial] ─→ resumo + botão "Ver batch" → redirect para PRD-03
[presign_error]   ─→ mensagem + botão "Tentar novamente"
[confirm_error]   ─→ mensagem + botão "Tentar novamente"
```

### 02.4.2 Definição de cada estado

#### `idle`

| Atributo              | Descrição                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| **Gatilho**           | Entrada inicial na tela; ou após remoção de todos os arquivos                                             |
| **O que é exibido**   | Área de drag-and-drop com instrução e botão "Selecionar arquivos". Tipos aceitos listados abaixo da área. |
| **Ações disponíveis** | Arrastar arquivos, clicar para abrir seletor de arquivos do SO                                            |
| **Transições**        | → `files_selected` ao adicionar qualquer arquivo válido                                                   |

---

#### `files_selected`

| Atributo              | Descrição                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gatilho**           | Um ou mais arquivos adicionados à seleção                                                                                                                                                                                                  |
| **O que é exibido**   | Lista de arquivos com: ícone de tipo, nome, tamanho, botão de remoção individual. Contador total (ex: "12 arquivos — 4,3 MB"). Botão primário "Enviar batch" habilitado. Erros de validação inline por arquivo inválido (tipo ou tamanho). |
| **Ações disponíveis** | Adicionar mais arquivos, remover arquivo individual, clicar "Enviar batch"                                                                                                                                                                 |
| **Transições**        | → `idle` se todos removidos; → `presigning` ao clicar "Enviar batch" com ao menos 1 arquivo válido                                                                                                                                         |

---

#### `presigning`

| Atributo              | Descrição                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Gatilho**           | Clique em "Enviar batch" com lista válida                                                                         |
| **O que é exibido**   | Overlay de loading leve sobre a lista. Botão "Enviar batch" desabilitado com spinner. Texto: "Preparando upload…" |
| **Ações disponíveis** | Nenhuma (tela bloqueada para evitar duplo envio)                                                                  |
| **Transições**        | → `uploading` em sucesso; → `presign_error` em falha; → redirect login em 401                                     |

---

#### `uploading`

| Atributo              | Descrição                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gatilho**           | Resposta de sucesso do `/batches/presign`                                                                                                                                                                 |
| **O que é exibido**   | Lista de arquivos com barra de progresso individual (0–100%). Barra de progresso global no topo. Contador "X de N enviados". Arquivos com falha de upload exibem ícone de erro vermelho e razão resumida. |
| **Ações disponíveis** | Nenhuma durante o upload (cancelamento fora do escopo v1)                                                                                                                                                 |
| **Transições**        | → `confirming` quando todos os uploads terminam (sucesso ou falha individual)                                                                                                                             |

_Nota sobre progresso:_ O XMLHttpRequest (ou fetch com `ReadableStream`) permite rastrear o progresso byte a byte. Para uploads com `fetch` puro em alguns browsers sem suporte a streams, exibir indeterminate spinner por arquivo.

---

#### `confirming`

| Atributo              | Descrição                                                                  |
| --------------------- | -------------------------------------------------------------------------- |
| **Gatilho**           | Todos os uploads terminaram                                                |
| **O que é exibido**   | Spinner global. Texto: "Verificando documentos…"                           |
| **Ações disponíveis** | Nenhuma                                                                    |
| **Transições**        | → `success_full` ou `success_partial` em sucesso; → `confirm_error` em 5xx |

---

#### `success_full`

| Atributo              | Descrição                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- |
| **Gatilho**           | Confirm retorna com `failed` vazio                                                           |
| **O que é exibido**   | Ícone de check + "X documentos enviados com sucesso". Redirect automático em 2s para PRD-03. |
| **Ações disponíveis** | Link "Ver status agora" (antecipa o redirect)                                                |
| **Transições**        | → PRD-03 (automático após 2s)                                                                |

---

#### `success_partial`

| Atributo              | Descrição                                                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gatilho**           | Confirm retorna com pelo menos 1 item em `failed`                                                                                                                                                                                                       |
| **O que é exibido**   | Aviso amarelo: "N documentos enviados, M falharam na verificação." Lista dos documentos falhos com razão (`object_not_found`). Botão primário "Ver batch". Botão secundário "Tentar reenviar os falhos" (fora do escopo v1 — desabilitado com tooltip). |
| **Ações disponíveis** | "Ver batch" → redirect para PRD-03                                                                                                                                                                                                                      |
| **Transições**        | → PRD-03 ao clicar "Ver batch"                                                                                                                                                                                                                          |

---

#### `presign_error`

| Atributo              | Descrição                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Gatilho**           | `/batches/presign` retorna 429, 5xx ou erro de rede                                                        |
| **O que é exibido**   | Banner de erro com mensagem mapeada (ver §02.7.1). Botão "Tentar novamente". Lista de arquivos preservada. |
| **Ações disponíveis** | "Tentar novamente" reinicia o fluxo a partir do presign; voltar para editar a lista                        |
| **Transições**        | → `presigning` ao tentar novamente                                                                         |

---

#### `confirm_error`

| Atributo              | Descrição                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Gatilho**           | `/batches/{id}/confirm` retorna 5xx ou erro de rede                                                                      |
| **O que é exibido**   | Banner de erro. Botão "Tentar novamente" chama o confirm novamente com os mesmos `document_ids` (confirm é idempotente). |
| **Ações disponíveis** | "Tentar novamente" (confirm idempotente — seguro repetir)                                                                |
| **Transições**        | → `confirming` ao tentar novamente                                                                                       |

---

## 02.5 Especificação de componentes

### 02.5.1 Árvore de componentes

```
UploadPage (SC — route: /upload)
└── UploadView (CC — gerencia todo o estado da tela)
    ├── DropZone (CC)
    │   └── FileInput (CC — input[type=file] oculto)
    ├── FileList (CC)
    │   └── FileListItem (CC) × N
    │       ├── FileTypeIcon (SC — ícone estático por mime_type)
    │       ├── UploadProgressBar (CC — progresso individual)
    │       └── FileStatusBadge (CC — idle/uploading/done/error)
    ├── BatchSummaryBar (CC — total de arquivos e tamanho)
    ├── UploadActions (CC — botão Enviar / estados de loading)
    ├── GlobalProgressBar (CC — progresso global, visível em `uploading`)
    └── UploadResultSummary (CC — visível em success_partial e erros)
```

**Regra SC vs CC:** `UploadPage` é Server Component apenas para estabelecer o layout e metadados da rota. Todo estado interativo vive em `UploadView` (Client Component) e seus filhos — nenhum dado de servidor é necessário na montagem inicial desta tela.

### 02.5.2 Responsabilidades por componente

| Componente            | Tipo | Responsabilidade                                                                                           |
| --------------------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| `UploadView`          | CC   | Máquina de estado principal. Orquestra presign, uploads paralelos e confirm. Detém o estado `UploadState`. |
| `DropZone`            | CC   | Captura drag-and-drop e clique. Chama `onFilesAdded(files: File[])`. Não conhece o estado global.          |
| `FileList`            | CC   | Renderiza a lista de `FileEntry[]`. Delega progresso e status para `FileListItem`.                         |
| `FileListItem`        | CC   | Exibe nome, tamanho, progresso e status de um único arquivo. Recebe `FileEntry` como prop.                 |
| `UploadProgressBar`   | CC   | Barra `<progress>` acessível com `aria-valuenow`. Recebe `value: number` (0–100).                          |
| `BatchSummaryBar`     | CC   | Exibe contador e tamanho total. Recebe `count` e `totalBytes`.                                             |
| `UploadActions`       | CC   | Renderiza o botão de submit com estado loading/disabled. Recebe `phase: UploadPhase`.                      |
| `GlobalProgressBar`   | CC   | Barra global visível durante `uploading`. Recebe `completed / total`.                                      |
| `UploadResultSummary` | CC   | Exibe resumo de sucesso parcial ou erro. Recebe `result: ConfirmResult`.                                   |

### 02.5.3 Tipos de estado local

```ts
type UploadPhase =
  | "idle"
  | "files_selected"
  | "presigning"
  | "uploading"
  | "confirming"
  | "success_full"
  | "success_partial"
  | "presign_error"
  | "confirm_error";

interface FileEntry {
  // Dados do arquivo local
  file: File;
  localId: string; // ID temporário gerado no cliente (crypto.randomUUID())
  validationError?: string; // Mensagem de erro de validação local, se inválido

  // Preenchido após presign
  documentId?: string;
  uploadUrl?: string;
  uploadUrlExpiresAt?: string;
  objectKey?: string;

  // Estado de upload
  uploadProgress: number; // 0–100
  uploadStatus: "idle" | "uploading" | "done" | "error" | "expired";
  uploadError?: string;

  // Preenchido após confirm
  confirmStatus?: "confirmed" | "failed";
  confirmReason?: string;
}

interface UploadState {
  phase: UploadPhase;
  batchId?: string;
  files: FileEntry[];
  presignError?: string;
  confirmError?: string;
}
```

### 02.5.4 Hook principal

```ts
// Hook que encapsula toda a lógica de upload
function useBatchUpload(): {
  state: UploadState;
  addFiles: (files: File[]) => void;
  removeFile: (localId: string) => void;
  submitBatch: () => Promise<void>;
  retryPresign: () => Promise<void>;
  retryConfirm: () => Promise<void>;
};
```

Responsabilidades internas do hook:

1. Validação local de arquivos ao adicionar (`addFiles`)
2. Chamada ao `/batches/presign` com retry para token expirado (`submitBatch`)
3. Upload paralelo com limite de concorrência (pool de 4) via `Promise.allSettled`
4. Renovação de URL expirada (detect `403` + `uploadUrlExpiresAt` no passado)
5. Chamada ao `/batches/{id}/confirm` após todos os uploads
6. Transição de `phase` conforme resultado de cada operação

---

## 02.6 Gestão de estado

### 02.6.1 Estado local vs servidor

| Dado                          | Onde vive                      | Justificativa                                  |
| ----------------------------- | ------------------------------ | ---------------------------------------------- |
| Lista de arquivos e progresso | `useState` em `UploadView`     | Transitório, específico desta sessão de upload |
| `batch_id` durante o fluxo    | `useState` em `UploadView`     | Necessário apenas para a chamada de confirm    |
| JWT do usuário                | Supabase JS SDK (`useSession`) | Gerenciado pelo SDK, nunca em state local      |
| Histórico de batches          | Servidor (PRD-03)              | Não relevante para esta tela                   |

### 02.6.2 Persistência de recuperação

Se o usuário fechar o browser durante o estado `uploading` (após presign bem-sucedido), os uploads são perdidos. Não há recuperação automática v1. O `batch_id` criado ficará em `pending_upload` e poderá ser visível na tela de histórico (PRD-03 fase 2) como batch abandonado.

Não usar `localStorage` para salvar o progresso de upload — contém `uploadUrl` (que expira e não deve persistir além da sessão) e `objectKey` (path do storage do usuário).

### 02.6.3 Concorrência de uploads

O upload paralelo usa um pool de 4 promessas concorrentes implementado com uma fila de tarefas simples (não uma biblioteca de concorrência externa):

```ts
async function uploadWithConcurrency(
  tasks: (() => Promise<void>)[],
  concurrency = 4,
): Promise<void> {
  const queue = [...tasks];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) await task().catch(() => {}); // erros capturados no nível do FileEntry
    }
  });
  await Promise.all(workers);
}
```

---

## 02.7 Tratamento de erros

### 02.7.1 Erros esperados do BFF

| HTTP Status          | Endpoint          | Mensagem para o usuário                                        | Ação                         |
| -------------------- | ----------------- | -------------------------------------------------------------- | ---------------------------- |
| `401`                | presign / confirm | "Sua sessão expirou. Faça login novamente."                    | Redirect para login          |
| `422`                | presign           | "Arquivo inválido: [razão]"                                    | Erro inline por arquivo      |
| `429` (rate limit)   | presign           | "Muitas tentativas. Aguarde 1 minuto e tente novamente."       | Botão com countdown de 60s   |
| `429` (backpressure) | presign           | "O sistema está ocupado. Tente novamente em alguns instantes." | Botão de retry sem countdown |
| `404`                | confirm           | "Batch não encontrado. Recarregue e tente novamente."          | Botão de reload              |
| `409`                | confirm           | "Este batch já foi processado."                                | Redirect para PRD-03         |
| `5xx`                | presign / confirm | "Erro interno. Tente novamente."                               | Botão de retry               |

**Como distinguir `429` de rate limit vs backpressure:** O corpo da resposta `429` do backend inclui `detail` com texto diferente. Não exibir o `detail` ao usuário — mapear para as mensagens acima baseando-se na presença de "rate limit" no `detail`.

### 02.7.2 Erros de upload no Supabase Storage

| Situação                                                    | Comportamento                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `403` com URL expirada (`upload_url_expires_at` no passado) | Tentar renovar a presigned URL uma vez; em nova falha, marcar `uploadStatus: 'error'` |
| `403` sem URL expirada                                      | Marcar `uploadStatus: 'error'` com razão "Permissão negada" — não renovar             |
| `400` do storage                                            | Marcar `uploadStatus: 'error'` com razão "Arquivo inválido"                           |
| Timeout / rede                                              | Marcar `uploadStatus: 'error'` com razão "Falha de conexão" — não retry automático    |

Arquivos com `uploadStatus: 'error'` são excluídos da lista de `document_ids` enviados ao confirm. Eles não aparecem no array `confirmed` nem no `failed` do confirm — ficam registrados apenas no estado local da tela.

### 02.7.3 Erros de rede (offline)

Se o browser detectar `navigator.onLine === false`, pausar os uploads em andamento e exibir banner "Sem conexão — uploads pausados". Retomar automaticamente quando `online` event disparar.

---

## 02.8 Segurança e privacidade

- [ ] JWT enviado via header `Authorization: Bearer <token>` em todas as chamadas à `invoice-api`. Nunca em query param.
- [ ] `object_key` usado no confirm é exatamente o retornado pelo presign — nunca construído no cliente.
- [ ] `upload_url` (presigned URL do Supabase Storage) não é logado em nenhum serviço de analytics ou monitoramento — contém credenciais temporárias.
- [ ] `upload_url_expires_at` e `object_key` não aparecem em query params de URL do browser.
- [ ] Filenames dos arquivos (que podem conter CNPJ — ex: `NF_12345678000195.xml`) não são enviados a serviços de analytics de terceiros (Amplitude, Mixpanel, etc.). Apenas `doc_type` e contadores são instrumentados.
- [ ] O JWT nunca é armazenado em `localStorage`. Acesso sempre via `supabase.auth.getSession()`.
- [ ] Nenhum dado de arquivo (bytes, conteúdo, filename completo) é enviado para a `invoice-api` — apenas metadata.

---

## 02.9 Requisitos de acessibilidade

- [ ] A área de drag-and-drop é acessível via teclado: `Tab` para foco, `Enter`/`Space` para abrir seletor de arquivos
- [ ] `<input type="file">` tem `aria-label` descritivo
- [ ] Cada barra de progresso individual tem `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` e `aria-label` com o nome do arquivo
- [ ] A barra de progresso global tem `aria-label="Progresso geral do upload"`
- [ ] Mensagens de erro têm `role="alert"` ou `aria-live="assertive"`
- [ ] O estado "Enviando…" do botão tem `aria-busy="true"` e `aria-disabled="true"`
- [ ] Arquivos inválidos são anunciados via `aria-live="polite"` ao serem adicionados
- [ ] Contraste mínimo 4.5:1 em todos os estados de texto

---

## 02.10 Métricas e observabilidade

### 02.10.1 Eventos a instrumentar

| Evento                   | Quando                         | Dados (sem PII)                                                        |
| ------------------------ | ------------------------------ | ---------------------------------------------------------------------- |
| `upload_batch_started`   | Clique em "Enviar batch"       | `doc_count`, `total_size_bytes`, `doc_types: {xml: N, pdf: N, img: N}` |
| `upload_presign_success` | Resposta 202 do presign        | `doc_count`, `latency_ms`                                              |
| `upload_presign_error`   | Falha no presign               | `error_code` (429/5xx), `latency_ms`                                   |
| `upload_file_completed`  | Cada arquivo que termina o PUT | `doc_type`, `file_size_bytes`, `upload_duration_ms`                    |
| `upload_file_failed`     | Cada arquivo que falha o PUT   | `doc_type`, `error_type` (network/403/timeout)                         |
| `upload_confirm_success` | Resposta 200 do confirm        | `confirmed_count`, `failed_count`, `latency_ms`                        |
| `upload_confirm_error`   | Falha no confirm               | `error_code`, `latency_ms`                                             |
| `upload_batch_completed` | Redirect pós-confirm           | `total_doc_count`, `success_count`, `fail_count`, `total_duration_ms`  |

> Nenhum evento inclui filename, CNPJ, CPF, valor financeiro ou conteúdo de arquivo.

### 02.10.2 Web Vitals alvo

| Métrica | Alvo                                                 |
| ------- | ---------------------------------------------------- |
| LCP     | < 1.5s (tela é simples, sem imagens pesadas)         |
| CLS     | < 0.05 (lista de arquivos deve ter altura reservada) |
| INP     | < 100ms para drag-and-drop e seleção de arquivo      |

---

## 02.11 Guia para prototipação no Paper

### 02.11.1 Frames a criar no Paper

| Frame                                       | Estado correspondente           | Prioridade |
| ------------------------------------------- | ------------------------------- | ---------- |
| `Upload — idle`                             | `idle`                          | Alta       |
| `Upload — files_selected (válidos)`         | `files_selected`                | Alta       |
| `Upload — files_selected (com erros)`       | `files_selected` + erros inline | Alta       |
| `Upload — presigning`                       | `presigning`                    | Alta       |
| `Upload — uploading (em progresso)`         | `uploading`                     | Alta       |
| `Upload — uploading (um arquivo com erro)`  | `uploading` parcial             | Média      |
| `Upload — confirming`                       | `confirming`                    | Alta       |
| `Upload — success_full`                     | `success_full`                  | Alta       |
| `Upload — success_partial`                  | `success_partial`               | Alta       |
| `Upload — presign_error (429 backpressure)` | `presign_error`                 | Média      |
| `Upload — presign_error (5xx)`              | `presign_error`                 | Média      |
| `Upload — confirm_error`                    | `confirm_error`                 | Média      |

### 02.11.2 Elementos críticos a validar no wireframe

- [ ] **DropZone:** área com altura generosa, instrução clara de tipos aceitos, suporte visual a drag-over
- [ ] **FileList:** legibilidade do nome longo de arquivo (truncar com ellipsis), distinção visual entre tipos (XML/PDF/imagem)
- [ ] **Progresso individual:** barra dentro de cada item de lista sem comprometer a densidade da lista
- [ ] **Progresso global:** posição sem conflito com o header fixo (se houver)
- [ ] **Estado `uploading` com arquivo em erro:** como arquivo com erro convive visualmente com arquivos que ainda estão enviando
- [ ] **Estado `success_partial`:** destaque suficiente para os documentos falhos sem alarmar desnecessariamente
- [ ] **Mobile:** toda a tela deve funcionar em viewport de 375px — drag-and-drop substitui por tap-to-select em mobile

### 02.11.3 Decisões de design a registrar após wireframe

Após validação do wireframe, atualizar as seções 02.5 e 02.6 com:

- Altura reservada para a lista de arquivos (previne CLS quando itens são adicionados)
- Decisão sobre truncamento de nomes de arquivo longos (max chars antes de ellipsis)
- Posição do progresso global: header fixo, topo da lista, ou rodapé?
- Tratamento visual de arquivo com `uploadStatus: 'error'` enquanto outros ainda estão em `uploading`
- Layout em mobile: grid de cards ou lista vertical?

---

## 02.12 Critérios de aceitação

### 02.12.1 Funcionais

- [ ] **T-FUNC-01** — Arquivos com tipo MIME não suportado exibem erro inline antes de qualquer chamada de API
- [ ] **T-FUNC-02** — Arquivos acima de 50 MB exibem erro inline antes de qualquer chamada de API
- [ ] **T-FUNC-03** — Batch com 1 arquivo válido e 1 inválido envia apenas o válido (o inválido fica marcado localmente, não é enviado)
- [ ] **T-FUNC-04** — Progresso individual é atualizado em tempo real durante o upload
- [ ] **T-FUNC-05** — Falha no upload de 1 arquivo não cancela os demais
- [ ] **T-FUNC-06** — Confirm é chamado apenas uma vez, após todos os uploads terminarem
- [ ] **T-FUNC-07** — Confirm com `success_partial` exibe lista dos documentos falhos
- [ ] **T-FUNC-08** — Redirect automático para PRD-03 ocorre após `success_full` com delay de 2s
- [ ] **T-FUNC-09** — "Tentar novamente" após `confirm_error` chama confirm novamente com os mesmos IDs (idempotência)
- [ ] **T-FUNC-10** — Duplo clique em "Enviar batch" não dispara dois presigns simultâneos (botão desabilitado imediatamente)

### 02.12.2 Segurança

- [ ] **T-SEC-01** — Sem JWT válido, ao clicar "Enviar batch" o usuário é redirecionado para login (não recebe 401 exposto na UI)
- [ ] **T-SEC-02** — O `object_key` enviado no confirm é idêntico ao retornado pelo presign — verificado em teste de integração
- [ ] **T-SEC-03** — Nenhuma URL presignada aparece no console do browser, no storage do localStorage ou em eventos de analytics

### 02.12.3 Performance

- [ ] **T-PERF-01** — Adição de 500 arquivos à lista não causa jank perceptível (renderização virtualizada se necessário)
- [ ] **T-PERF-02** — Com 4 uploads simultâneos, a utilização de banda é visivelmente superior a uploads serializados (validar em DevTools > Network)
- [ ] **T-PERF-03** — LCP da tela inicial (estado `idle`) < 1.5s em Fast 3G simulado

---

## 02.13 O que não fazer

**Não enviar bytes de arquivo para a `invoice-api`.**
A API gera presigned URLs — o upload vai direto ao Supabase Storage via PUT. Rotear arquivos pelo endpoint `/batches/presign` para proxy de upload quebraria os limites de tamanho e adicionaria latência desnecessária.

**Não construir o `object_key` no cliente.**
Usar exatamente o `object_key` retornado pela resposta do presign. O padrão `{user_id}/{batch_id}/{doc_id}` é um detalhe de implementação do backend — se mudar, o cliente não deve quebrar.

**Não disparar o confirm antes de todos os uploads terminarem.**
O confirm verifica a existência dos objetos no storage com HEAD requests. Um confirm prematuro resultará em `object_not_found` para arquivos que ainda estão em upload.

**Não fazer retry automático infinito em falhas de upload.**
Um arquivo que falha por erro de rede pode falhar repetidamente e bloquear o pool de concorrência. No máximo: 1 retry automático para `403` de URL expirada; para outros erros, marcar como falho e deixar o usuário decidir.

**Não usar `XMLHttpRequest` para rastrear progresso e `fetch` para o resto.**
Escolher uma abordagem consistente. Se o browser do target suporta `fetch` com `ReadableStream` para progresso, usá-lo em todo o código de upload. Misturar `XHR` e `fetch` no mesmo fluxo complica o tratamento de erros e o cancelamento.

**Não armazenar `upload_url` em `localStorage`.**
A URL é uma credencial temporária com 15 minutos de validade. Persistir além da sessão de memória é um risco de segurança desnecessário — se a página for recarregada, um novo presign deve ser chamado.

**Não exibir o campo `detail` de respostas de erro do FastAPI diretamente.**
Mensagens como `"Object key does not belong to authenticated user"` são técnicas e não amigáveis. Mapear HTTP status codes para mensagens de usuário definidas em §02.7.1.

**Não ignorar o estado `success_partial`.**
Um batch onde parte dos documentos falhou na verificação de storage é um resultado que o usuário precisa entender. Tratar como sucesso total seria enganoso — o usuário esperaria ver os documentos falhos sendo processados e eles nunca apareceriam.

---

## Histórico de revisões

| Versão | Data       | Autor | Mudança          |
| ------ | ---------- | ----- | ---------------- |
| 0.1    | 2026-04-03 | —     | Rascunho inicial |
