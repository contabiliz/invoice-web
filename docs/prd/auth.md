# PRD-01 — Autenticação

> **Status:** `draft`
> **Versão:** 0.1
> **Autor:** —
> **Última atualização:** 2026-04-03
> **Depende de:** —

---

## 01.1 Visão geral

### 01.1.1 Objetivo

Permitir que usuários acessem o Contabiliz com segurança usando email e senha. A tela de autenticação é a porta de entrada do produto — deve ser simples, rápida e transmitir confiança profissional sem criar atrito desnecessário.

### 01.1.2 Jornada do usuário

O usuário acessa qualquer rota protegida e é redirecionado para `/login`. Na tela, ele vê o logotipo do Contabiliz no topo, dois campos (email e senha) com labels visíveis, e um botão "Entrar" de largura total. Ao submeter, o sistema valida as credenciais via Supabase Auth. Se bem-sucedido, o usuário é redirecionado para `/upload`. Se houver erro de credencial, uma mensagem clara aparece abaixo do formulário sem recarregar a página. O usuário nunca vê mensagens técnicas de erro do Supabase.

Para novos usuários, um link "Criar conta" abre o formulário de cadastro na mesma tela (troca de formulário via estado local, sem navegação). O cadastro exige apenas email e senha — sem dados pessoais adicionais no v1. Após cadastro bem-sucedido, o usuário já entra autenticado e é redirecionado para `/upload`.

### 01.1.3 Fora do escopo

- Login social (Google, GitHub) — v2
- Recuperação de senha por email — v2 (link "Esqueci minha senha" visível mas desabilitado com tooltip "Em breve")
- Magic link (passwordless) — v2
- MFA — v2
- Gerenciamento de perfil e dados pessoais

---

## 01.2 Architecture Decision Records

### ADR-001 — Supabase Auth como único provider

**Decisão:** O frontend usa exclusivamente o Supabase JS SDK (`@supabase/ssr`) para autenticação. Nenhuma chamada direta à `invoice-api` para login.

**Contexto:** A `invoice-api` valida JWTs do Supabase mas não emite tokens. A autenticação acontece diretamente entre o browser e o Supabase Auth endpoint.

**Razões:**
- O Supabase Auth gerencia refresh, expiração e rotação de tokens automaticamente
- Elimina um hop de rede desnecessário (browser → API → Supabase)
- O SDK `@supabase/ssr` gerencia cookies de forma segura (httpOnly)

**Consequências:** O cliente Supabase no browser precisa das variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Essas são chaves **públicas** — seguras para o frontend.

---

### ADR-002 — JWT em cookies httpOnly, nunca localStorage

**Decisão:** A sessão Supabase é persistida em cookies gerenciados pelo `@supabase/ssr`. O frontend nunca lê ou escreve o JWT em `localStorage` ou `sessionStorage`.

**Razões:**
- `localStorage` é acessível por qualquer script na página — vetor de XSS
- Cookies httpOnly não são acessíveis via JavaScript
- O middleware Next.js pode ler cookies server-side e renovar a sessão antes do request chegar à rota

**Consequências:** O middleware `src/middleware.ts` é responsável por renovar a sessão em cada request. Esse bloco nunca deve ser removido.

---

### ADR-003 — Troca de formulário (login/signup) via estado local, sem rota separada

**Decisão:** Login e cadastro vivem na mesma rota `/login`. A troca entre os dois formulários é controlada por estado local (`useState`), sem navegação de rota.

**Razões:**
- Evita URL diferente para signup (`/signup`) que poderia vazar em analytics se o usuário compartilhar
- Transição mais suave — sem loading de rota
- Simplicidade: um único componente de shell

**Consequências:** A URL permanece `/login` tanto no login quanto no signup. O estado `mode: 'login' | 'signup'` controla qual formulário é renderizado.

---

### ADR-004 — Criação automática de perfil no primeiro login

**Decisão:** O Supabase cria automaticamente uma row em `public.users` via trigger de banco de dados no primeiro login. O frontend não precisa fazer uma chamada separada para criar o perfil.

**Contexto:** A tabela `public.users` é o perfil de aplicação que estende `auth.users`. Sem essa row, as RLS policies falham.

**Razões:**
- O trigger é mais confiável que uma chamada de frontend (pode falhar em rede)
- O frontend não precisa saber do detalhe de implementação do banco

**Consequências:** O frontend assume que o perfil existe após autenticação bem-sucedida. Se por algum motivo não existir, o middleware receberá erros de RLS nas queries subsequentes — tratar como erro de sessão e redirecionar para login.

---

## 01.3 Contrato com o BFF

Esta tela **não consome a `invoice-api`**. A autenticação é diretamente com o Supabase Auth via SDK.

### 01.3.1 Chamadas SDK

```ts
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

// Logout
await supabase.auth.signOut();
```

### 01.3.2 Códigos de erro do Supabase e mensagens de usuário

| Código Supabase | Mensagem para o usuário |
|---|---|
| `invalid_credentials` | "Email ou senha incorretos." |
| `email_not_confirmed` | "Confirme seu email antes de entrar." |
| `over_email_send_rate_limit` | "Muitas tentativas. Aguarde alguns minutos." |
| `user_already_exists` | "Este email já está cadastrado. Faça login." |
| `weak_password` | "Senha muito fraca. Use ao menos 8 caracteres." |
| Qualquer outro erro | "Algo deu errado. Tente novamente." |

### 01.3.3 Fluxo de autenticação pós-login

```
1. supabase.auth.signInWithPassword() → { session }
2. @supabase/ssr escreve cookies automaticamente
3. Next.js middleware renova session em requests seguintes
4. router.push('/upload') no cliente
5. Middleware verifica sessão e permite acesso
```

---

## 01.4 Estados de UI

### 01.4.1 Mapa de estados

```
[idle — formulário de login vazio]
    │
    ├─ usuário preenche e clica "Entrar" ───→ [submitting]
    ├─ clica "Criar conta" ─────────────────→ [idle_signup]
    │
[submitting — aguardando Supabase Auth]
    │
    ├─ erro de credencial ──────────────────→ [error_inline]
    ├─ erro de rede ────────────────────────→ [error_inline]
    ├─ sucesso ─────────────────────────────→ redirect /upload
    │
[error_inline — formulário com erro]
    │
    ├─ usuário corrige e tenta de novo ─────→ [submitting]
    │
[idle_signup — formulário de cadastro]
    │
    ├─ usuário preenche e clica "Criar conta" → [submitting_signup]
    ├─ clica "Já tenho conta" ──────────────→ [idle]
    │
[submitting_signup]
    │
    ├─ sucesso ─────────────────────────────→ redirect /upload
    ├─ erro ────────────────────────────────→ [error_inline_signup]
```

### 01.4.2 Definição de cada estado

#### `idle` (login)
| Atributo | Descrição |
|---|---|
| **O que é exibido** | Logo, campo email, campo senha, botão "Entrar" (full width), link "Criar conta" |
| **Ações disponíveis** | Preencher campos, submeter, ir para signup |
| **Transições** | → `submitting` ao submeter; → `idle_signup` ao clicar "Criar conta" |

#### `submitting`
| Atributo | Descrição |
|---|---|
| **O que é exibido** | Campos desabilitados, botão com spinner + "Entrando…" |
| **Ações disponíveis** | Nenhuma |
| **Transições** | → redirect `/upload` em sucesso; → `error_inline` em falha |

#### `error_inline`
| Atributo | Descrição |
|---|---|
| **O que é exibido** | Banner de erro abaixo do formulário (`role="alert"`). Campos habilitados novamente. |
| **Ações disponíveis** | Corrigir campos, submeter novamente |
| **Transições** | → `submitting` ao tentar novamente |

#### `idle_signup` e `submitting_signup`
Espelham os estados de login mas com campo de confirmação de senha e texto "Criar conta".

---

## 01.5 Especificação de componentes

### 01.5.1 Árvore de componentes

```
LoginPage (SC — route: /login)
└── AuthShell (CC — layout centralizado, troca login/signup)
    ├── BrandLogo (SC — estático)
    ├── LoginForm (CC — react-hook-form + zod)
    │   ├── EmailField (CC)
    │   ├── PasswordField (CC — toggle visibilidade)
    │   ├── AuthError (CC — role="alert")
    │   └── SubmitButton (CC — loading state)
    └── SignupForm (CC — mesmo padrão do LoginForm)
```

### 01.5.2 Hook principal

```ts
function useAuth(): {
  mode: "login" | "signup";
  setMode: (mode: "login" | "signup") => void;
  isSubmitting: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
}
```

### 01.5.3 Schema de validação (Zod)

```ts
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});
```

---

## 01.6 Gestão de estado

| Dado | Onde vive | Justificativa |
|---|---|---|
| Sessão do usuário | `@supabase/ssr` (cookies) | Gerenciado pelo SDK |
| `mode` (login/signup) | `useState` local | Transitório, sem persistência |
| Erros de auth | `useState` local | Específico da sessão de login |
| Campos do formulário | `react-hook-form` | Padrão do projeto |

---

## 01.7 Tratamento de erros

| Cenário | Comportamento |
|---|---|
| Credencial inválida | Banner inline: "Email ou senha incorretos." |
| Email não confirmado | Banner inline: "Confirme seu email antes de entrar." |
| Rate limit Supabase | Banner inline: "Muitas tentativas. Aguarde alguns minutos." |
| Erro de rede | Banner inline: "Sem conexão. Verifique a internet." |
| Erro desconhecido | Banner inline: "Algo deu errado. Tente novamente." |

**Regra:** nunca exibir `error.message` do Supabase diretamente. Mapear via código.

---

## 01.8 Segurança e privacidade

- [ ] JWT nunca em `localStorage` — gerenciado por `@supabase/ssr`
- [ ] Campos de senha com `type="password"` por padrão
- [ ] Toggle de visibilidade da senha usa `type="text"` — sem solução de terceiros
- [ ] `autocomplete="current-password"` no campo de senha para gerenciadores de senha
- [ ] `autocomplete="email"` no campo de email
- [ ] Sem logs de email ou senha no console

---

## 01.9 Requisitos de acessibilidade

- [ ] Labels visíveis em todos os campos (não apenas placeholder)
- [ ] `htmlFor` conectando label e input
- [ ] Mensagem de erro com `role="alert"`
- [ ] Botão de submit com `aria-busy="true"` durante submissão
- [ ] Foco movido para a mensagem de erro após falha
- [ ] Tecla Enter submete o formulário
- [ ] Contraste mínimo 4.5:1

---

## 01.10 Guia para prototipação no Paper

### 01.10.1 Frames a criar

| Frame | Estado | Prioridade |
|---|---|---|
| `Auth — login idle` | `idle` | Alta |
| `Auth — login submitting` | `submitting` | Alta |
| `Auth — login error` | `error_inline` | Alta |
| `Auth — signup idle` | `idle_signup` | Alta |
| `Auth — signup error` | `error_inline_signup` | Média |

### 01.10.2 Elementos críticos a validar

- [ ] Logo com proporção correta — sem distorção
- [ ] Card centralizado (max-width 400px) com padding generoso
- [ ] Botão "Entrar" de largura total
- [ ] Erro inline abaixo do formulário (não toast flutuante)
- [ ] Transição suave entre login e signup (sem salto de layout)
- [ ] Link "Esqueci minha senha" visível mas desabilitado com tooltip "Em breve"

---

## 01.11 Critérios de aceitação

### Funcionais
- [ ] **T-FUNC-01** — Login com credenciais válidas redireciona para `/upload`
- [ ] **T-FUNC-02** — Login com credenciais inválidas exibe mensagem amigável (não erro raw do Supabase)
- [ ] **T-FUNC-03** — Signup com email já existente exibe "Este email já está cadastrado. Faça login."
- [ ] **T-FUNC-04** — Signup bem-sucedido redireciona para `/upload` já autenticado
- [ ] **T-FUNC-05** — Botão "Entrar" fica desabilitado durante submissão (sem duplo envio)
- [ ] **T-FUNC-06** — Acesso direto a `/upload` sem sessão redireciona para `/login`
- [ ] **T-FUNC-07** — Acesso a `/login` com sessão ativa redireciona para `/upload`

### Segurança
- [ ] **T-SEC-01** — JWT não aparece em `localStorage`, `sessionStorage` ou cookies sem httpOnly
- [ ] **T-SEC-02** — Nenhum erro do Supabase aparece raw no UI (sem `AuthApiError`, stack traces, etc.)

### Performance
- [ ] **T-PERF-01** — LCP da tela de login < 1.5s em Fast 3G

---

## 01.12 O que não fazer

**Não armazenar JWT em `localStorage`.**
O `@supabase/ssr` gerencia a sessão em cookies httpOnly. Qualquer leitura manual do token via `localStorage` é insegura.

**Não exibir mensagens de erro do Supabase diretamente.**
`error.message` do Supabase retorna strings em inglês e às vezes com detalhes técnicos. Mapear sempre para PT-BR amigável.

**Não criar rota `/signup` separada.**
Manter tudo em `/login` com troca de formulário via estado. Menos surface de roteamento, menos confusão.

**Não implementar recuperação de senha no v1.**
O link fica visível com tooltip "Em breve" para não frustrar usuários que tentam clicar, mas sem funcionalidade real.

---

## Histórico de revisões

| Versão | Data | Autor | Mudança |
|---|---|---|---|
| 0.1 | 2026-04-03 | — | Rascunho inicial |
