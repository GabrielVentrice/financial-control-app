<template>
  <Sidemenu>
    <div class="bg-background-page min-h-screen">
      <main class="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <LoadingState v-if="loading" message="Carregando transações..." />
        <ErrorState v-else-if="error" :message="error" />

        <template v-else>
          <!-- 1. Header -->
          <header class="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div class="min-w-0">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider">Transações</p>
              <h1 class="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">Todos os lançamentos</h1>
            </div>

            <div class="sm:ml-auto flex items-start gap-3">
              <SyncButton />
            </div>
          </header>

          <div class="space-y-6">
            <!-- 2. KPIs -->
            <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-background-card border border-border-subtle rounded-xl px-5 py-5">
                <p class="text-[13px] text-text-muted">Entradas</p>
                <p class="text-kpi-md text-positive mt-1.5 whitespace-nowrap">{{ formatCurrency(totals.income) }}</p>
                <p class="text-[12px] text-text-muted mt-1">{{ totals.incomeCount }} lançamentos</p>
              </div>

              <div class="bg-background-card border border-border-subtle rounded-xl px-5 py-5">
                <p class="text-[13px] text-text-muted">Saídas</p>
                <p class="text-kpi-md text-negative mt-1.5 whitespace-nowrap">{{ formatCurrency(totals.expenses) }}</p>
                <p class="text-[12px] text-text-muted mt-1">{{ totals.expenseCount }} lançamentos</p>
              </div>

              <div class="bg-background-card border border-border-subtle rounded-xl px-5 py-5">
                <p class="text-[13px] text-text-muted">Saldo</p>
                <p
                  class="text-kpi-md mt-1.5 whitespace-nowrap"
                  :class="totals.balance >= 0 ? 'text-positive' : 'text-negative'"
                >{{ formatCurrency(totals.balance) }}</p>
                <p class="text-[12px] text-text-muted mt-1">entradas − saídas</p>
              </div>

              <div class="bg-background-card border border-border-subtle rounded-xl px-5 py-5">
                <p class="text-[13px] text-text-muted">Transferências</p>
                <p class="text-kpi-md text-text-secondary mt-1.5 whitespace-nowrap">{{ formatCurrency(totals.transfers) }}</p>
                <p class="text-[12px] text-text-muted mt-1">entre contas · não é gasto</p>
              </div>
            </section>

            <!-- 3. Filters -->
            <section class="bg-background-card border border-border-subtle rounded-xl p-5">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    v-model="searchTerm"
                    type="search"
                    aria-label="Buscar por descrição"
                    placeholder="buscar por descrição…"
                    class="w-full h-11 pl-9 pr-3 rounded-lg bg-background-section border border-border-subtle text-[14px] text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1"
                  />
                </div>

                <div>
                  <label for="tx-start" class="sr-only">Data inicial</label>
                  <input
                    id="tx-start"
                    v-model="startDate"
                    type="date"
                    class="w-full h-11 px-3 rounded-lg bg-background-section border border-border-subtle text-[14px] text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1"
                  />
                </div>

                <div>
                  <label for="tx-end" class="sr-only">Data final</label>
                  <input
                    id="tx-end"
                    v-model="endDate"
                    type="date"
                    class="w-full h-11 px-3 rounded-lg bg-background-section border border-border-subtle text-[14px] text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1"
                  />
                </div>
              </div>

              <!-- Active filter chips -->
              <div v-if="hasActiveFilters" class="mt-3 flex items-center flex-wrap gap-2">
                <span v-if="searchTerm" class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-background-section text-text-secondary text-[13px] rounded-full">
                  "{{ searchTerm }}"
                  <button
                    @click="searchTerm = ''"
                    aria-label="Remover filtro de busca"
                    class="w-4 h-4 inline-flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                  >×</button>
                </span>
                <span v-if="originFilter" class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-background-section text-text-secondary text-[13px] rounded-full">
                  {{ originFilter }}
                  <button
                    @click="originFilter = ''"
                    aria-label="Remover filtro de conta"
                    class="w-4 h-4 inline-flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                  >×</button>
                </span>
                <span v-if="startDate || endDate" class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-background-section text-text-secondary text-[13px] rounded-full">
                  {{ dateRangeLabel }}
                  <button
                    @click="startDate = ''; endDate = ''"
                    aria-label="Remover filtro de data"
                    class="w-4 h-4 inline-flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                  >×</button>
                </span>
                <button
                  @click="clearFilters"
                  class="px-2.5 py-1 text-[13px] font-medium text-accent hover:underline transition-colors"
                >
                  Limpar tudo
                </button>
              </div>
            </section>

            <!-- 4. List -->
            <section class="bg-background-card border border-border-subtle rounded-xl p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">Lançamentos</h2>
                <span class="text-[11px] text-text-muted">
                  {{ filteredTransactions.length }} {{ filteredTransactions.length === 1 ? 'resultado' : 'resultados' }}
                </span>
              </div>

              <EmptyState
                v-if="filteredTransactions.length === 0"
                icon="🔍"
                :title="hasActiveFilters ? 'Nenhum resultado' : 'Nenhuma transação'"
                :description="hasActiveFilters ? 'Nenhuma transação corresponde aos filtros atuais.' : 'Não há transações para exibir.'"
              >
                <template v-if="hasActiveFilters" #action>
                  <button
                    @click="clearFilters"
                    class="px-4 py-2 text-[13px] font-medium text-text-inverse bg-accent-primary hover:bg-accent-primary-hover rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2"
                  >
                    Limpar filtros
                  </button>
                </template>
              </EmptyState>

              <ul v-else class="divide-y divide-border-subtle">
                <li
                  v-for="transaction in paginatedTransactions"
                  :key="transaction.transactionId"
                  class="flex items-center gap-3 py-3.5 px-2 -mx-2 rounded-lg hover:bg-background-section/60 transition-colors"
                >
                  <span
                    class="w-2 h-2 rounded-full flex-shrink-0"
                    :class="dotClass(transaction)"
                    aria-hidden="true"
                  ></span>

                  <div class="min-w-0 flex-1">
                    <p class="text-[15px] font-medium text-text-primary truncate">{{ transaction.description }}</p>
                    <p class="text-[13px] text-text-muted mt-0.5 truncate">
                      {{ formatDate(transaction.date, 'medium') }} ·
                      {{ transaction.origin || '—' }} → {{ transaction.destination || 'Sem categoria' }}
                    </p>
                  </div>

                  <span
                    class="text-[15px] font-semibold whitespace-nowrap"
                    :class="amountClass(transaction)"
                  >
                    {{ amountPrefix(transaction) }}{{ formatCurrency(Math.abs(transaction.amount)) }}
                  </span>
                </li>
              </ul>

              <!-- Pagination -->
              <div
                v-if="filteredTransactions.length > pageSize"
                class="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between"
              >
                <p class="text-[13px] text-text-muted">
                  <span class="font-medium text-text-secondary">{{ startIndex + 1 }}–{{ Math.min(endIndex, filteredTransactions.length) }}</span>
                  de <span class="font-medium text-text-secondary">{{ filteredTransactions.length }}</span>
                </p>
                <div class="flex items-center gap-2">
                  <button
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="px-3 h-9 rounded-full text-[13px] font-medium text-text-secondary hover:bg-background-section disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  >← Anterior</button>
                  <span class="text-[13px] text-text-muted tabular-nums">{{ currentPage }} / {{ totalPages }}</span>
                  <button
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    class="px-3 h-9 rounded-full text-[13px] font-medium text-text-secondary hover:bg-background-section disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  >Próxima →</button>
                </div>
              </div>
            </section>
          </div>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Transaction } from '~/types/transaction'
import { isIncome, isRealExpense, isTransfer, expenseAmount } from '~/shared/expenseRules'

const { transactions, loading, error } = useTransactions()
const { selectedPerson } = usePersonFilter()
const { formatCurrency, formatDate } = useFormatters()
const route = useRoute()

const searchTerm = ref('')
const startDate = ref('')
const endDate = ref('')
// Seeded from the query string so "ver fatura" on the dashboard lands here
// already scoped to that card.
const originFilter = ref((route.query.origin as string) || '')
const currentPage = ref(1)
const pageSize = 50

const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(t => t.person === selectedPerson.value)
  }

  if (originFilter.value) {
    filtered = filtered.filter(t => t.origin === originFilter.value)
  }

  if (searchTerm.value) {
    const q = searchTerm.value.toLowerCase()
    filtered = filtered.filter(t => (t.description || '').toLowerCase().includes(q))
  }

  // Dates are plain calendar days, so comparing the ISO strings is both correct
  // and immune to the UTC-parsing shift that bit the other screens.
  if (startDate.value) filtered = filtered.filter(t => t.date >= startDate.value)
  if (endDate.value) filtered = filtered.filter(t => t.date <= endDate.value)

  return [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1))
})

/**
 * Totals by what the transaction *is*, not by the sign of the amount. Amounts
 * in the sheet are unsigned, so the old `amount >= 0` split reported every row
 * as income and exactly zero expenses.
 */
const totals = computed(() => {
  let income = 0, incomeCount = 0
  let expenses = 0, expenseCount = 0
  let transfers = 0

  for (const t of filteredTransactions.value) {
    if (isIncome(t)) {
      income += expenseAmount(t)
      incomeCount++
    } else if (isRealExpense(t)) {
      expenses += expenseAmount(t)
      expenseCount++
    } else if (isTransfer(t)) {
      transfers += expenseAmount(t)
    }
  }

  return { income, incomeCount, expenses, expenseCount, transfers, balance: income - expenses }
})

const kindOf = (t: Transaction): 'income' | 'expense' | 'transfer' => {
  if (isIncome(t)) return 'income'
  if (isRealExpense(t)) return 'expense'
  return 'transfer'
}

const dotClass = (t: Transaction) => ({
  income: 'bg-positive/60',
  expense: 'bg-negative/50',
  transfer: 'bg-text-muted/40',
}[kindOf(t)])

const amountClass = (t: Transaction) => ({
  income: 'text-positive',
  expense: 'text-negative',
  transfer: 'text-text-muted',
}[kindOf(t)])

const amountPrefix = (t: Transaction) => ({
  income: '+ ',
  expense: '– ',
  transfer: '',
}[kindOf(t)])

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTransactions.value.length / pageSize)))
const startIndex = computed(() => (currentPage.value - 1) * pageSize)
const endIndex = computed(() => startIndex.value + pageSize)
const paginatedTransactions = computed(() =>
  filteredTransactions.value.slice(startIndex.value, endIndex.value)
)

const hasActiveFilters = computed(() =>
  Boolean(searchTerm.value || startDate.value || endDate.value || originFilter.value)
)

const dateRangeLabel = computed(() => {
  if (startDate.value && endDate.value) return `${formatDate(startDate.value, 'medium')} – ${formatDate(endDate.value, 'medium')}`
  if (startDate.value) return `Desde ${formatDate(startDate.value, 'medium')}`
  if (endDate.value) return `Até ${formatDate(endDate.value, 'medium')}`
  return ''
})

const clearFilters = () => {
  searchTerm.value = ''
  startDate.value = ''
  endDate.value = ''
  originFilter.value = ''
  currentPage.value = 1
}

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

watch([searchTerm, startDate, endDate, originFilter, selectedPerson], () => {
  currentPage.value = 1
})
</script>
