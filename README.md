# Controle Financeiro

App de controle financeiro pessoal sobre um livro **Bkper**, desenvolvido com Nuxt 3.

## Arquitetura de dados

```
Bkper API ──► snapshot em memória no servidor (TTL 60min, botão "Atualizar" força refresh)
                    ├─► /api/transactions, /api/categories  (parcelas expandidas + filtros)
                    └─► /api/debt                           (snapshot cru + analytics em JS)

Google Sheets ──► /api/budgets, /api/budget-templates       (só orçamentos, mesmo cache TTL)
Postgres (Neon) ──► tabela debt_plans                       (âncora do cheque especial)
```

- **Fonte da verdade das transações é o Bkper** (REST API v5). O servidor lê o livro inteiro
  (~4k transações, ~7s), enriquece com a pessoa (Gabriel/Juliana), ordena e mantém em memória
  de instância por 60 minutos. Não há espelho em banco nem cache em disco.
- **Orçamentos** continuam no Google Sheets (abas `Budgets_v2` e `Budget_Templates`), atrás do
  mesmo cache com TTL; salvar invalida o cache.
- **Postgres** guarda apenas o plano de quitação da dívida (`debt_plans`).

## Funcionalidades

- Dashboard com análises, alertas e fatura do cartão por ciclo
- Lista completa de transações com filtros (pessoa, data, busca)
- Gastos por categoria, custos fixos (6 meses) e parcelas ativas com projeção de 12 meses
- Plano de quitação do cheque especial com projeção mês a mês
- Orçamentos mensais e templates percentuais por pessoa

## Setup

1. **Bkper**: `npm i -g bkper && bkper auth login`, copie o `refresh_token` de
   `~/.config/bkper/.bkper-credentials.json` para `NUXT_BKPER_REFRESH_TOKEN` (com
   `NUXT_BKPER_CLIENT_ID`/`NUXT_BKPER_CLIENT_SECRET` do próprio CLI) e o id do book em
   `NUXT_BKPER_BOOK_ID` (`GET https://api.bkper.app/v5/books` lista os seus).
2. **Google Sheets** (só para os orçamentos): service account com a Sheets API habilitada,
   planilha compartilhada com o e-mail da service account, credenciais em
   `NUXT_GOOGLE_CLIENT_EMAIL`/`NUXT_GOOGLE_PRIVATE_KEY` e o id em
   `NUXT_PUBLIC_GOOGLE_SPREADSHEET_ID`.
3. **Neon Postgres** (só para a tela de dívida): `DATABASE_URL`; `npm run db:push` cria a tabela.
4. Copie `.env.example` para `.env` e preencha. **Todas as vars também precisam existir no
   projeto Vercel.**

```bash
npm install
npm run dev        # localhost:3000
npm test           # vitest, roda 2x (a 2a sob TZ=Pacific/Midway)
npm run build      # produção (preset vercel)
```

## Documentação da API

OpenAPI gerado pelo Nitro em `/api/docs` (Swagger UI em `/_swagger`, Scalar em `/_scalar`).

Contexto completo de arquitetura, convenções e gotchas em [claude.md](claude.md).
