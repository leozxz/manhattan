# Manhattan — Open Finance Integration Design

**Data:** 2026-03-03
**Status:** Aprovado

---

## 1. Contexto e Objetivo

Manhattan e uma pagina de gestao financeira pessoal que conecta ao Open Finance/Open Banking via Pluggy para consolidar contas bancarias, cartoes e transacoes num unico lugar.

**Objetivo do MVP:** Conectar conta bancaria via Pluggy Connect Widget e exibir contas e transacoes.

## 2. Escopo

### Dentro do escopo
- Conectar ao Open Finance via Pluggy Connect Widget
- Listar contas bancarias (nome, tipo, saldo)
- Listar transacoes recentes (descricao, valor, data, categoria)

### Fora do escopo (neste ciclo)
- Persistencia em banco de dados
- Investimentos, emprestimos, cartoes de credito
- Dashboards analiticos / graficos
- Multi-usuario / autenticacao de usuario
- Webhooks para sync automatico

## 3. Criterios de Sucesso

- Usuario consegue conectar pelo menos 1 banco via widget
- Contas e transacoes sao exibidas apos conexao
- Credenciais Pluggy nunca expostas no client-side

## 4. Restricoes e Premissas

- **Stack:** Next.js (App Router) + TypeScript
- **Premissa:** Usuario ja tem CLIENT_ID e CLIENT_SECRET da Pluggy
- **Sem banco de dados** — dados buscados direto da API Pluggy
- **Single-user** — uso pessoal, sem autenticacao

## 5. Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
│                                                  │
│  ┌─────────────┐    ┌────────────────────────┐  │
│  │   Frontend   │    │   API Routes (server)  │  │
│  │              │    │                        │  │
│  │  /           │    │  POST /api/token       │  │
│  │  (home +     │───>│   -> auth c/ Pluggy    │  │
│  │   widget)    │    │   -> gera connectToken │  │
│  │              │    │                        │  │
│  │  /dashboard  │    │  GET /api/accounts     │  │
│  │  (contas +   │───>│   -> busca accounts    │  │
│  │  transacoes) │    │   via pluggy-sdk       │  │
│  │              │    │                        │  │
│  └─────────────┘    │  GET /api/transactions  │  │
│                      │   -> busca transactions │  │
│                      └────────────────────────┘  │
└─────────────────────────────────────────────────┘
                          │
                          v
                  ┌───────────────┐
                  │   Pluggy API   │
                  └───────────────┘
```

## 6. Fluxo de Dados

1. Usuario abre `/` e clica "Conectar meu banco"
2. Frontend chama `POST /api/token` -> backend autentica com Pluggy e retorna Connect Token
3. Widget Pluggy abre com o token
4. Usuario seleciona banco, autentica, consente
5. `onSuccess({ item })` -> salva `item.id` no localStorage
6. Redireciona para `/dashboard`
7. Dashboard chama `/api/accounts` e `/api/transactions` com o itemId
8. Dados exibidos na tela

## 7. Contratos das API Routes

### POST /api/token

```json
// Request body (opcional)
{ "itemId": "uuid" }

// Response 200
{ "accessToken": "connect-token-string" }
```

### GET /api/accounts?itemId=xxx

```json
// Response 200
{
  "accounts": [
    {
      "id": "uuid",
      "name": "Conta Corrente",
      "type": "BANK",
      "balance": 1234.56,
      "currencyCode": "BRL",
      "number": "12345-6"
    }
  ]
}
```

### GET /api/transactions?itemId=xxx&accountId=yyy

```json
// Response 200
{
  "transactions": [
    {
      "id": "uuid",
      "description": "PIX Recebido",
      "amount": 500.00,
      "date": "2026-03-01",
      "type": "DEBIT",
      "category": "Transfer"
    }
  ]
}
```

## 8. Seguranca

| Aspecto | Abordagem |
|---|---|
| Credenciais Pluggy | Somente em .env.local (server-side) |
| Connect Token | Gerado no backend, 30min, escopo limitado |
| Item ID | localStorage (UUID, nao-sensivel) |
| API Routes | Same-origin, validam itemId |

## 9. Estrutura de Arquivos

```
manhattan/
├── .env.local
├── .gitignore
├── package.json
├── next.config.js
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home: botao conectar
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard: contas + transacoes
│   │   └── api/
│   │       ├── token/
│   │       │   └── route.ts
│   │       ├── accounts/
│   │       │   └── route.ts
│   │       └── transactions/
│   │           └── route.ts
│   ├── components/
│   │   ├── ConnectButton.tsx
│   │   ├── AccountList.tsx
│   │   └── TransactionList.tsx
│   └── lib/
│       └── pluggy.ts             # PluggyClient instance
```

## 10. Pacotes

- `next` — framework
- `react` / `react-dom` — UI
- `pluggy-sdk` — SDK server-side
- `react-pluggy-connect` — Connect Widget React

## 11. Decision Log

| Decisao | Data | Motivo | Alternativas rejeitadas |
|---|---|---|---|
| Next.js App Router | 2026-03-03 | Frontend + backend num projeto so | Vite + Express separados |
| Sem banco de dados | 2026-03-03 | MVP rapido, validar integracao | SQLite/Postgres (futuro) |
| localStorage para itemId | 2026-03-03 | Simples, single-user | Cookie, session |
| Abordagem A (sem DB) | 2026-03-03 | Menor complexidade para MVP | Abordagem B com persistencia |
