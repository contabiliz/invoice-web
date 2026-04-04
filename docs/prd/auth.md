# PRD-01 — Autenticação (Login & Cadastro)

> **Status:** `draft`
> **Versão:** 0.2
> **Autor:** —
> **Última atualização:** 2026-04-03
> **Depende de:** —

---

## 01.1 Visão geral

### 01.1.1 Objetivo

Permitir que o usuário acesse ou crie uma conta na plataforma Contabiliz via email e senha, estabelecendo uma sessão autenticada (JWT em cookies httpOnly) que habilita acesso a todas as rotas protegidas.

### 01.1.2 Jornada do usuário

**Login:** O usuário acessa `/login` e vê um formulário centralizado com campos de email e senha. Insere suas credenciais e clica em "Entrar". Enquanto a requisição está em andamento, o botão fica desabilitado com indicador de carregamento. Em caso de sucesso, é redirecionado imediatamente para `/upload`. Se as credenciais estiverem incorretas, um banner de erro vermelho aparece inline abaixo do botão com mensagem amigável em PT-BR. O usuário pode corrigir os dados e tentar novamente sem recarregar a página. Se não tiver conta, clica em "Criar conta" e é direcionado para `/cadastro`.

**Cadastro:** O usuário acessa `/cadastro` e vê um formulário com campos de email, senha e confirmação de senha. Insere os dados e clica em "Criar conta". Em caso de sucesso, é redirecionado para `/login` com um toast de confirmação. Se o email já estiver em uso, um banner de erro aparece inline. Se as senhas não coincidirem, o erro é exibido imediatamente na validação do formulário. Se já tiver conta, clica em "Fazer login" e é direcionado para `/login`.

### 01.1.3 Fora do escopo

- Login social (Google, GitHub) — v2
- Recuperação de senha por email ("Esqueceu a senha?") — link visível na UI mas inativo/desabilitado em v1
- Magic link (passwordless) — v2
- MFA / 2FA — v2
- Gerenciamento de perfil e dados pessoais — v2
- Verificação de email pós-cadastro — Supabase pode exigir isso dependendo da configuração; v1 assume auto-confirm habilitado no dashboard Supabase
- Onboarding / tour guiado após primeiro cadastro — v2

---

## 01.2 Architecture Decision Records

### ADR-001 — Supabase Auth SDK diretamente, sem intermediação da invoice-api

**Decisão:** Login e cadastro chamam o Supabase Auth SDK (`supabase.auth.signInWithPassword`, `supabase.auth.signUp`) diretamente do cliente. A `invoice-api` não expõe endpoints de autenticação.

**Contexto:** A `invoice-api` é um BFF para operações de negócio (batches, documentos). A gestão de identidade é responsabilidade do Supabase Auth.

**Razões:**
- Supabase Auth já gerencia tokens, refresh e sessões via `@supabase/ssr`
- Adicionar um proxy de auth na API seria redundância sem benefício
- `auth.uid()` nas RLS policies requer que o token seja emitido pelo Supabase — não por um proxy customizado

**Consequências:** O cliente nunca envia senha à `invoice-api`. O JWT resultante é armazenado em cookies httpOnly via `@supabase/ssr` e injetado automaticamente em chamadas subsequentes.

---

### ADR-002 — JWT em cookies httpOnly via `@supabase/ssr`, nunca em `localStorage`

**Decisão:** O token de sessão é gerenciado exclusivamente pelo `@supabase/ssr` em cookies httpOnly. O frontend não armazena nem acessa o JWT diretamente.

**Razões:**
- `localStorage` é acessível por JavaScript — vetor de XSS
- Cookies httpOnly são inacessíveis a scripts — protegem contra XSS mesmo que código de terceiro seja injetado
- O `@supabase/ssr` gerencia refresh automático sem intervenção do desenvolvedor

**Consequências:** Server Components e middleware podem validar a sessão via `createClient()` (server) sem round-trip ao Supabase. O middleware redireciona para `/login` em toda rota protegida sem sessão válida.

---

### ADR-003 — Duas rotas separadas: `/login` e `/cadastro`

**Decisão:** Login e cadastro são rotas independentes (`/login` e `/cadastro`), não um toggle de estado em uma única rota.

**Razões:**
- Os designs mostram layouts, headings e mensagens de subtítulo distintos para cada modo
- URLs claras facilitam deep linking, redirecionamento pós-ação e rastreamento analytics
- Evita lógica condicional complexa num único componente para fluxos distintos

**Consequências:** `middleware.ts` precisa tratar `/cadastro` como rota pública (sem redirect para login). Redirecionamento pós-cadastro vai para `/login?registered=true` para exibir toast de confirmação.

---

### ADR-004 — Criação automática do perfil em `public.users` via trigger Supabase

**Decisão:** A row em `public.users` é criada por um trigger `on auth.users insert` no banco — não pelo frontend.

**Contexto:** `is_admin()` retorna NULL (não false) se a row não existir, causando comportamento inesperado nas RLS policies (ver `06.1-authentication.md §06.1.8`).

**Razões:**
- O trigger é atômico com a inserção em `auth.users` — impossível ter user sem perfil
- O frontend não precisa fazer chamada adicional pós-cadastro
- Elimina race condition entre criação de conta e primeiro uso da API

**Consequências:** O frontend não chama nenhum endpoint após `signUp()`. O trigger cuida da consistência do banco.

---

### ADR-005 — "Esqueceu a senha?" presente na UI mas desabilitado em v1

**Decisão:** O link "Esqueceu a senha?" é exibido no formulário de login (conforme o design) mas está inativo em v1. Ao clicar, exibe tooltip/mensagem: "Em breve. Entre em contato com o suporte."

**Razões:**
- O design inclui o link — removê-lo quebraria a fidelidade visual
- Implementar recuperação de email requer configuração de SMTP e template de email — fora do escopo v1
- Exibir o elemento com estado desabilitado é melhor UX do que sumir com o elemento

**Consequências:** O link tem `cursor-not-allowed`, não redireciona, e exibe um tooltip informativo.

---

## 01.3 Contrato com o BFF

### 01.3.1 Endpoints consumidos

Esta tela **não consome endpoints da `invoice-api`**. Toda autenticação é via Supabase Auth SDK.

| SDK Call | Quando é chamado | Retorno esperado |
|---|---|---|
| `supabase.auth.signInWithPassword({ email, password })` | Submit do formulário de login | `{ data: { session }, error }` |
| `supabase.auth.signUp({ email, password })` | Submit do formulário de cadastro | `{ data: { user }, error }` |

### 01.3.2 Mapeamento de erros do Supabase Auth

O campo `error.message` do Supabase **nunca é exibido ao usuário**. Mapear via código de erro:

| `error.message` (Supabase interno) | Mensagem exibida ao usuário (PT-BR) | Onde exibir |
|---|---|---|
| `Invalid login credentials` | "Email ou senha incorretos. Verifique os dados e tente novamente." | Banner inline abaixo do botão |
| `Email not confirmed` | "Confirme seu email antes de entrar." | Banner inline |
| `User already registered` | "Este email já está cadastrado. Tente fazer login." | Banner inline |
| `Password should be at least 6 characters` | "A senha deve ter pelo menos 8 caracteres." | Erro inline no campo Senha |
| Erro de rede / timeout | "Não foi possível conectar. Verifique sua internet e tente novamente." | Banner inline |
| Qualquer outro erro | "Ocorreu um erro inesperado. Tente novamente." | Banner inline |

### 01.3.3 Fluxo de autenticação

O JWT não é manipulado pelo componente. O `@supabase/ssr` armazena o token em cookies httpOnly após `signInWithPassword()`. O `middleware.ts` lê o cookie em cada request e redireciona para `/login` se ausente ou expirado.

---

## 01.4 Estados de UI

### 01.4.1 Mapa de estados — Login

```
idle
 │
 ├─ submit (credenciais preenchidas) ──→ loading
 │
loading
 │
 ├─ success ──────────────────────────→ [redirect /upload]
 └─ error ────────────────────────────→ error
      │
      └─ usuário edita campos ─────────→ idle
```

### 01.4.2 Mapa de estados — Cadastro

```
idle
 │
 ├─ submit (campos válidos) ──────────→ loading
 │
loading
 │
 ├─ success ──────────────────────────→ [redirect /login?registered=true]
 └─ error ────────────────────────────→ error
      │
      └─ usuário edita campos ─────────→ idle
```

### 01.4.3 Definição de estados

#### Login

| Estado | Gatilho | O que é exibido | Ações disponíveis | Transições |
|---|---|---|---|---|
| `idle` | Acesso inicial à rota `/login` | Formulário completo, botão "Entrar" ativo | Preencher campos, submeter, navegar para cadastro | → `loading` |
| `loading` | Submit do formulário com campos válidos | Botão "Entrar" desabilitado com spinner, campos read-only | — | → `idle` (erro), redirect (sucesso) |
| `error` | Resposta de erro do Supabase Auth | Banner vermelho inline com mensagem PT-BR, campos editáveis | Editar campos, submeter novamente | → `loading` |

#### Cadastro

| Estado | Gatilho | O que é exibido | Ações disponíveis | Transições |
|---|---|---|---|---|
| `idle` | Acesso inicial à rota `/cadastro` | Formulário completo, botão "Criar conta" ativo | Preencher campos, submeter, navegar para login | → `loading` |
| `loading` | Submit com campos válidos | Botão desabilitado com spinner, campos read-only | — | → `idle` (erro), redirect (sucesso) |
| `error` | Resposta de erro do Supabase Auth | Banner vermelho inline com mensagem PT-BR | Editar campos, submeter novamente | → `loading` |

---

## 01.5 Especificação de componentes

### 01.5.1 Árvore de componentes

```
/login
└── LoginPage (SC)               ← src/app/login/page.tsx
    └── LoginForm (CC)           ← src/components/auth/LoginForm.tsx

/cadastro
└── SignupPage (SC)              ← src/app/cadastro/page.tsx
    └── SignupForm (CC)          ← src/components/auth/SignupForm.tsx
```

Ambas as páginas não estão dentro do grupo `(auth)` — são rotas públicas.

### 01.5.2 Responsabilidades por componente

| Componente | Tipo | Responsabilidade | Props principais |
|---|---|---|---|
| `LoginPage` | SC | Wrapper estático, sem lógica | — |
| `LoginForm` | CC | Estado do formulário, chamada Supabase Auth, mapeamento de erros, redirect | — |
| `SignupPage` | SC | Wrapper estático, sem lógica | — |
| `SignupForm` | CC | Estado do formulário, validação de confirmação de senha, chamada Supabase Auth, mapeamento de erros | — |

### 01.5.3 Validação de formulários

Usar **React Hook Form + Zod**. Schemas:

```ts
// Login
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

// Cadastro
const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});
```

Erros de validação do Zod são exibidos inline abaixo de cada campo (não como banner).

### 01.5.4 Hooks customizados

Não são necessários hooks customizados. A lógica de auth cabe dentro dos componentes `LoginForm` e `SignupForm` com `react-hook-form` + chamada direta ao Supabase SDK.

---

## 01.6 Gestão de estado

### 01.6.1 Estado local vs servidor

| Dado | Onde vive | Justificativa |
|---|---|---|
| Campos do formulário | `react-hook-form` | Estado transitório do formulário |
| Estado de loading | `useState` local | Derivado da chamada async ao SDK |
| Mensagem de erro inline | `useState` local | Gerado pelo mapeamento de erro pós-submit |
| JWT / sessão | `@supabase/ssr` (cookies) | Gerenciado pelo SDK — nunca acessar diretamente |

### 01.6.2 Redirecionamento pós-login

Usar `router.push('/upload')` via `useRouter` do Next.js após `session` retornar com sucesso. Não usar `window.location` — quebra o prefetch do App Router.

---

## 01.7 Wireframes (Stitch)

Stitch Project ID: `5660826328406993994`

| Tela | Screen ID | Estado correspondente |
|---|---|---|
| Login — Idle | `a1c4627e326548ffbc11dec69937cfa0` | `idle` |
| Login — Error State | `0b5fc40b2c6c4e9eb3dc972eff19d69f` | `error` |
| Signup — Idle | `e56866af285540f7bf33e93a3bfe05bf` | `idle` |

### 01.7.1 Elementos visuais — Login Idle

- Logo Contabiliz (ícone + texto) centralizado no topo
- Subtítulo: "Acesse sua conta para gerenciar seus documentos fiscais."
- Card centralizado com:
  - Label "Email" + input (`placeholder="nome@empresa.com.br"`)
  - Label "Senha" + input com toggle de visibilidade + link "Esqueceu a senha?" (desabilitado, direita)
  - Botão primário full-width: "Entrar"
- Link abaixo do card: "Não possui uma conta? **Criar conta**" → `/cadastro`
- Footer: "Suporte Técnico · Segurança" e "© 2026 Contabiliz. Todos os direitos reservados."

### 01.7.2 Elementos visuais — Login Error State

- Logo Contabiliz (texto, cor primária) centralizado no topo
- Subtítulo: "Precisão em dados fiscais e contábeis"
- Card com heading "Acesse sua conta" + sub "Insira suas credenciais para continuar"
- Campos preenchidos (email + senha)
- **Banner de erro vermelho** abaixo do botão: ícone de erro + "Email ou senha incorretos. Verifique os dados e tente novamente."
- Link abaixo do card: "Não tem uma conta? **Cadastre-se**"

### 01.7.3 Elementos visuais — Signup Idle

- Ícone quadrado "C" + título "Contabiliz" centralizado
- Subtítulo: "Gestão fiscal inteligente para análises financeiras"
- Card com heading "Criar nova conta":
  - Label "EMAIL" + input com ícone `@` + `placeholder="nome@empresa.com.br"`
  - Label "SENHA" + input com ícone `🔒` + toggle de visibilidade
  - Label "CONFIRMAR SENHA" + input com ícone `🔒`
  - Botão primário full-width: "Criar conta"
  - Link: "Já tenho conta? **Fazer login**" → `/login`
  - Nota LGPD: "🛡 Processamento de dados em conformidade com a LGPD"
- Footer: "Contabiliz · Suporte · Termos de Uso · Privacidade · © 2026 Contabiliz."

---

## 01.8 Tratamento de erros

### 01.8.1 Erros esperados

| Situação | Comportamento |
|---|---|
| Credenciais incorretas (login) | Banner vermelho inline com mensagem PT-BR mapeada |
| Email já cadastrado (cadastro) | Banner vermelho inline: "Este email já está cadastrado." |
| Senhas não coincidem (cadastro) | Erro Zod inline no campo "Confirmar Senha" — antes do submit |
| Senha curta demais | Erro Zod inline no campo "Senha" |
| Email inválido | Erro Zod inline no campo "Email" |
| Erro de rede | Banner vermelho inline: "Não foi possível conectar." |

### 01.8.2 Erros de rede

| Situação | Comportamento |
|---|---|
| Timeout / sem internet | Banner inline com mensagem de conexão e botão de retry |
| Supabase Auth indisponível | Mesma mensagem de erro genérico; não expor detalhes técnicos |

---

## 01.9 Segurança e privacidade

- [ ] JWT gerenciado exclusivamente pelo `@supabase/ssr` em cookies httpOnly — nunca em `localStorage`
- [ ] `error.message` do Supabase nunca exibido ao usuário — sempre usar mapeamento PT-BR
- [ ] Nenhuma credencial (email, senha, token) logada no console do browser
- [ ] "Esqueceu a senha?" desabilitado em v1 — não conecta a nenhum fluxo de email
- [ ] Rota `/cadastro` marcada como pública no `middleware.ts` (sem redirect para login)
- [ ] Trigger de banco cria `public.users` automaticamente — frontend não constrói o perfil
- [ ] Password input com `type="password"` — toggle via controle UI, nunca expondo o valor

---

## 01.10 Requisitos de acessibilidade

- [ ] Labels associadas a inputs via `htmlFor` / `id`
- [ ] Botão "Entrar" / "Criar conta" tem `aria-busy="true"` durante loading
- [ ] Banner de erro tem `role="alert"` para anúncio automático por leitores de tela
- [ ] Erros inline de validação têm `aria-describedby` apontando para o input correspondente
- [ ] Toggle de visibilidade de senha tem `aria-label` descritivo ("Mostrar senha" / "Ocultar senha")
- [ ] Foco gerenciado: após erro no submit, foco vai para o banner de erro ou primeiro campo com erro

---

## 01.11 Métricas e observabilidade

### 01.11.1 Eventos a instrumentar

| Evento | Quando disparar | Dados |
|---|---|---|
| `auth_login_attempted` | Submit do formulário de login | — (sem email) |
| `auth_login_success` | Redirect pós-login bem-sucedido | — |
| `auth_login_error` | Erro mapeado exibido ao usuário | `error_type` (ex: `invalid_credentials`) |
| `auth_signup_attempted` | Submit do formulário de cadastro | — |
| `auth_signup_success` | Redirect pós-cadastro bem-sucedido | — |
| `auth_signup_error` | Erro mapeado exibido ao usuário | `error_type` |

> Nunca incluir email, senha ou token nos eventos de analytics.

### 01.11.2 Web Vitals alvo

| Métrica | Alvo |
|---|---|
| LCP | < 1.5s (página estática, sem dados do servidor) |
| CLS | < 0.05 (layout estável, sem conteúdo dinâmico acima do fold) |
| INP | < 200ms |

---

## 01.12 Critérios de aceitação

### 01.12.1 Funcionais

- [ ] **T-FUNC-01** — Login com credenciais válidas redireciona para `/upload`
- [ ] **T-FUNC-02** — Login com credenciais inválidas exibe banner PT-BR sem recarregar a página
- [ ] **T-FUNC-03** — Cadastro com email novo cria conta e redireciona para `/login`
- [ ] **T-FUNC-04** — Cadastro com email já existente exibe banner PT-BR de erro
- [ ] **T-FUNC-05** — Senhas que não coincidem exibem erro Zod inline antes do submit
- [ ] **T-FUNC-06** — Link "Criar conta" no login navega para `/cadastro`
- [ ] **T-FUNC-07** — Link "Fazer login" no cadastro navega para `/login`
- [ ] **T-FUNC-08** — Acesso a `/upload` sem sessão redireciona para `/login`
- [ ] **T-FUNC-09** — Acesso a `/login` com sessão válida redireciona para `/upload`
- [ ] **T-FUNC-10** — "Esqueceu a senha?" não navega nem dispara ação — exibe tooltip informativo

### 01.12.2 De segurança

- [ ] **T-SEC-01** — JWT não aparece em `localStorage`, `sessionStorage` ou em qualquer `console.log`
- [ ] **T-SEC-02** — Mensagem de erro do Supabase (`error.message` raw) nunca aparece na UI
- [ ] **T-SEC-03** — Acesso direto a qualquer rota `(auth)/*` sem cookie de sessão resulta em redirect para `/login`
- [ ] **T-SEC-04** — Input de senha tem `type="password"` por padrão (toggle para `type="text"` apenas explicitamente)

### 01.12.3 De performance

- [ ] **T-PERF-01** — Primeira renderização de `/login` em < 1.5s em conexão 4G simulada
- [ ] **T-PERF-02** — Loading state aparece em < 100ms após submit (feedback imediato ao usuário)

---

## 01.13 O que não fazer

**Não armazenar o JWT em `localStorage`.**
O `@supabase/ssr` gerencia o token em cookies httpOnly. Qualquer tentativa de replicar o token em `localStorage` para "facilitar" acesso é um vetor de XSS.

**Não exibir `error.message` do Supabase ao usuário.**
As mensagens do Supabase Auth são técnicas em inglês (ex: `"Invalid login credentials"`). Sempre mapear para mensagens PT-BR via tabela de mapeamento.

**Não chamar a `invoice-api` para autenticar.**
A API não expõe endpoints de auth. Login e cadastro são operações exclusivas do Supabase Auth SDK.

**Não construir o perfil em `public.users` no frontend.**
O trigger de banco garante a criação atômica. Uma chamada de API no frontend após cadastro cria race condition e duplicidade.

**Não usar `window.location.href` para redirect pós-login.**
Usar `router.push('/upload')` do Next.js App Router para manter o prefetch e o estado do React.

**Não implementar recuperação de senha em v1.**
O link "Esqueceu a senha?" é decorativo em v1. Implementar fluxo de email reset requer SMTP, templates e tratamento de tokens — fora do escopo.

---

## Histórico de revisões

| Versão | Data | Autor | Mudança |
|---|---|---|---|
| 0.1 | 2026-04-03 | — | Rascunho inicial (sem wireframes) |
| 0.2 | 2026-04-03 | — | Wireframes Stitch integrados, duas rotas separadas, ADR-003/004/005 adicionados |
