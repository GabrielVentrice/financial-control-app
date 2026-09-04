# Controle Financeiro

App de controle financeiro pessoal sobre um livro **Bkper**, desenvolvido com Nuxt 3.

## Arquitetura de dados

```
Bkper API ──► snapshot em memória no servidor (TTL 60min, botão "Atualizar" força refresh)
                    ├─► /api/transactions, /api/categories  (parcelas expandidas + filtros)
                    ├─► /api/month                          (o mês medido contra o orçamento)
                    └─► /api/debt                           (snapshot cru + analytics em JS)

Postgres (Neon) ──► debt_plans      (âncora do cheque especial)
                └─► budget_targets  (meta mensal por categoria)
```

- **Fonte da verdade das transações é o Bkper** (REST API v5). O servidor lê o livro inteiro
  (~4k transações, ~7s), enriquece com a pessoa (Gabriel/Juliana), ordena e mantém em memória
  de instância por 60 minutos. Não há espelho em banco nem cache em disco.
- **Postgres** guarda só o que o livro não pode conter: a âncora da dívida (`debt_plans`) e a
  meta de gasto por categoria (`budget_targets`). Nenhum cache — são leituras diretas.

## Funcionalidades

- **Meu Mês** (tela principal): quanto ainda dá pra gastar, o mês por categoria contra a meta,
  e o acompanhamento do plano de mudança
- Dashboard com análises, alertas e fatura do cartão por ciclo
- Lista completa de transações com filtros (pessoa, data, busca)
- Gastos por categoria, custos fixos (6 meses) e parcelas ativas com projeção de 12 meses
- Plano de quitação do cheque especial com projeção mês a mês
- Metas de gasto por categoria, editáveis na própria tela

## Setup

1. **Bkper**: `npm i -g bkper && bkper auth login`, copie o `refresh_token` de
   `~/.config/bkper/.bkper-credentials.json` para `NUXT_BKPER_REFRESH_TOKEN` (com
   `NUXT_BKPER_CLIENT_ID`/`NUXT_BKPER_CLIENT_SECRET` do próprio CLI) e o id do book em
   `NUXT_BKPER_BOOK_ID` (`GET https://api.bkper.app/v5/books` lista os seus).
2. **Neon Postgres**: `DATABASE_URL`. As tabelas `debt_plans` e `budget_targets` precisam
   existir — o orçamento do plano é semeado na primeira leitura de `budget_targets` vazia.
3. Copie `.env.example` para `.env` e preencha. **Todas as vars também precisam existir no
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
