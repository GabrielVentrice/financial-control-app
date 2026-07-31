# Auditoria — correções P0 + P1 + P2

Branch: `fix/auditoria-consistencia-dados-e-telas`

## P0 — Quebrado agora

- [x] Mover declaração do cron para `vercel.json` (caminho documentado, visível no dashboard)
- [x] Botão "Atualizar" chamar `POST /api/sync` (Postgres) em vez de `/api/cache/refresh`
- [x] Superficializar erro do sync na UI (hoje só `console.error`)
- [x] `GET /api/sync` expondo último sync; indicador "atualizado há X" (renderizado no servidor)

## P1 — Consistência de dados

- [x] `shared/expenseRules.ts`: definição única de receita/gasto/transferência/exclusões
- [x] `shared/dates.ts`: bucketização por `YYYY-MM` + `parseLocalDate`
- [x] Aplicar regras únicas em: `useDashboardAnalytics`, `categories.vue`, `fixed-costs.vue`, `categories.get.ts`, `transactions.vue`
- [x] `/api/categories` ler do Postgres via `loadTransactions` compartilhado
- [x] Corrigir ordem filtro→parcela no caminho Postgres
- [x] `fixed-costs.vue`: bucketização de mês por timezone
- [x] `transactions.vue`: Receitas/Despesas/Saldo por sinal do valor
- [x] `personIdentifier`: fallback para destination quando origin não identifica
- [x] `cacheManager`: `escape(t.id)` → `t.transactionId`
- [x] **(novo)** Marcar parcelas projetadas (`projected`) — mês sem sync exibia total de gastos

## P2 — Telas

- [x] Redesenhar `transactions.vue` no padrão Coluna Refinada
- [x] Redesenhar `fixed-costs.vue` no padrão Coluna Refinada
- [x] `MonthSelector` compartilhado + navegação de mês no dashboard
- [x] Fatura do cartão seguindo o filtro de pessoa + link "ver fatura" filtrado
- [x] Modais: Esc global + scroll lock (`useModalDismiss`)
- [x] `getUpcomingExpenses` usar `isRealExpense`
- [x] Remover `generateAlerts` (morto) e `currentMonthLabel` em fixed-costs

## Verificação

- `npm test` → 28 testes, 2 fusos (local + `TZ=Pacific/Midway`) ✅
- `npx nuxt build` ✅
- Smoke das 5 telas no dev server ✅
- Invariante da ordem filtro→parcela: `/api/transactions?startDate=2026-06-01&endDate=2026-06-30`
  devolve 62 linhas, idêntico a fatiar junho do conjunto completo ✅

## Review

### O que mudou de número na tela

1. **Gastos sobem um pouco.** `isExpense` deixou de exigir que `origin` fosse conta,
   então ~20 compras financiadas (`origin='Installments/Financing'`) passam a contar.
2. **Categorias e dashboard passam a bater.** A tela de categorias não excluía
   `pagamento debito automatico`; agora exclui.
3. **Tela de transações muda de cara.** "Despesas: 0" era artefato do critério por sinal.
4. **Julho fica honesto.** Antes exibia R$ 1.826 de "gasto" com zero transações
   sincronizadas — eram parcelas projetadas.

### Pendente (P3, fora do escopo escolhido)

- 8 endpoints de debug/teste públicos sem auth (`debug-drive`, `test-drive`, …)
- `POST /api/sync` sem autenticação (agora chamado pelo browser, então precisa de
  rate limit em vez de auth simples)
- `/api/transactions` sem limite: 4040 linhas por page load
- Órfãos no repo: `debug-installments.json`, `DEBUG_FILTRO.md`, docs de migração do Drive
- `transactionCount: serial(...)` em `schema.ts` deveria ser `integer`
- `/api/cache/refresh` ficou sem nenhum consumidor na UI

### Ação manual necessária

O `vercel.json` só passa a valer no próximo deploy. Depois de subir, confirmar em
**Vercel → Settings → Cron Jobs** que `/api/cron/sync` aparece listado. Enquanto
isso não acontecer, o botão Atualizar resolve manualmente.
