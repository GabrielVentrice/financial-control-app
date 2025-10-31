<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Compact Header with inline filter -->
      <header class="h-14 px-6 lg:px-10 flex items-center justify-between border-b border-border-base">
        <div class="flex items-baseline gap-3">
          <h1 class="text-[18px] font-medium tracking-tight">Transações</h1>
          <span class="px-2 py-0.5 text-[11px] font-medium bg-accent-primary/10 text-accent-primary rounded border border-accent-primary/20">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refreshData" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Compact Filters -->
      <div class="px-6 lg:px-10 py-4 border-b border-border-base bg-background-card">
        <div class="max-w-[1400px] mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-text-muted mb-1.5 uppercase tracking-wide">
                Buscar
              </label>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Descrição..."
                class="w-full px-3 py-2 bg-background-input text-text-primary text-[13px] rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
              />
            </div>

            <div>
              <label class="block text-[11px] font-medium text-text-muted mb-1.5 uppercase tracking-wide">
                Data Inicial
              </label>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-3 py-2 bg-background-input text-text-primary text-[13px] rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
              />
            </div>

            <div>
              <label class="block text-[11px] font-medium text-text-muted mb-1.5 uppercase tracking-wide">
                Data Final
              </label>
              <input
                v-model="endDate"
                type="date"
                class="w-full px-3 py-2 bg-background-input text-text-primary text-[13px] rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
              />
            </div>

            <div class="flex items-end">
              <button
                @click="clearFilters"
                class="w-full px-3 py-2 text-[13px] text-text-secondary bg-background-section rounded hover:bg-background-hover transition-all"
              >
                Limpar
              </button>
            </div>
          </div>

          <!-- Active Filters Badge -->
          <div v-if="startDate || endDate" class="mt-2 flex items-center gap-2">
            <span class="text-[10px] text-text-muted">PERÍODO:</span>
            <span class="px-2 py-0.5 text-[10px] bg-accent-info/10 text-accent-info rounded border border-accent-info/20">
              {{ dateRangeLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-5 space-y-4">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary - DENSE -->
          <section class="grid grid-cols-3 lg:grid-cols-5 gap-3">
            <DenseStatCard
              label="Total"
              :value="filteredTransactions.length"
              format="number"
              value-color="info"
            />

            <DenseStatCard
              label="Soma"
              :value="totalAmount"
              format="currency"
              :value-color="totalAmount >= 0 ? 'success' : 'danger'"
            />

            <DenseStatCard
              label="Média"
              :value="filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0"
              format="currency"
              value-color="default"
            />

            <!-- Additional stats visible on larger screens -->
            <DenseStatCard
              class="hidden lg:block"
              label="Receitas"
              :value="incomeCount"
              format="number"
              value-color="success"
            />

            <DenseStatCard
              class="hidden lg:block"
              label="Despesas"
              :value="expenseCount"
              format="number"
              value-color="danger"
            />
          </section>

          <!-- Transactions Table - FLAT -->
          <section class="border-t border-border-base overflow-hidden">
            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto">
              <table class="min-w-full divide-y divide-border-base">
                <thead class="bg-background-section">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                      Data
                    </th>
                    <th class="px-4 py-2.5 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                      Origem
                    </th>
                    <th class="px-4 py-2.5 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                      Destino
                    </th>
                    <th class="px-4 py-2.5 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                      Descrição
                    </th>
                    <th class="px-4 py-2.5 text-right text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-background-card divide-y divide-border-base">
                  <tr
                    v-for="transaction in paginatedTransactions"
                    :key="transaction.transactionId"
                    class="hover:bg-background-hover transition-colors"
                  >
                    <td class="px-4 py-2.5 whitespace-nowrap text-[13px] text-text-secondary">
                      {{ formatDateCompact(transaction.date) }}
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap text-[13px] text-text-muted truncate max-w-[150px]">
                      {{ transaction.origin }}
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap text-[13px] text-text-muted truncate max-w-[150px]">
                      {{ transaction.destination }}
                    </td>
                    <td class="px-4 py-2.5 text-[13px] text-text-primary truncate max-w-md">
                      {{ transaction.description }}
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap text-right text-[13px] font-semibold" :class="{
                      'text-accent-success': transaction.amount >= 0,
                      'text-accent-danger': transaction.amount < 0
                    }">
                      {{ formatCurrencyCompact(transaction.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards - COMPACT -->
            <div class="lg:hidden divide-y divide-border-base">
              <div
                v-for="transaction in paginatedTransactions"
                :key="transaction.transactionId"
                class="p-3 space-y-2"
              >
                <div class="flex justify-between items-start gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] text-text-primary font-medium truncate">{{ transaction.description }}</p>
                    <p class="text-[11px] text-text-muted mt-0.5">{{ formatDateCompact(transaction.date) }}</p>
                  </div>
                  <p class="text-[13px] font-semibold whitespace-nowrap" :class="{
                    'text-accent-success': transaction.amount >= 0,
                    'text-accent-danger': transaction.amount < 0
                  }">
                    {{ formatCurrencyCompact(transaction.amount) }}
                  </p>
                </div>
                <div class="flex justify-between text-[11px] text-text-secondary">
                  <span class="truncate">{{ transaction.origin }}</span>
                  <span class="mx-1.5">→</span>
                  <span class="truncate">{{ transaction.destination }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <EmptyState
              v-if="filteredTransactions.length === 0"
              icon="🔍"
              title="Nenhuma transação"
              description="Ajuste os filtros para ver transações."
            />

            <!-- Pagination - COMPACT -->
            <div v-if="filteredTransactions.length > pageSize" class="bg-background-section px-4 py-2.5 flex items-center justify-between border-t border-border-base">
              <div class="text-[11px] text-text-secondary">
                <span class="font-medium text-text-primary">{{ startIndex + 1 }}-{{ Math.min(endIndex, filteredTransactions.length) }}</span>
                <span class="mx-1">de</span>
                <span class="font-medium text-text-primary">{{ filteredTransactions.length }}</span>
              </div>
              <div class="flex gap-1.5">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="px-2.5 py-1.5 text-[12px] font-medium text-text-secondary bg-background-card border border-border-base rounded hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>
                <span class="px-2.5 py-1.5 text-[12px] text-text-muted">
                  {{ currentPage }} / {{ totalPages }}
                </span>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="px-2.5 py-1.5 text-[12px] font-medium text-text-secondary bg-background-card border border-border-base rounded hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Transaction } from '~/types/transaction'

// Composables
const { selectedPerson } = usePersonFilter()

// State
const transactions = ref<Transaction[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchTerm = ref('')
const startDate = ref('')
const endDate = ref('')
const currentPage = ref(1)
const pageSize = 50

// Computed
const filteredTransactions = computed(() => {
  let filtered = transactions.value

  // Filter by person
  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => {
      return transaction.person === selectedPerson.value
    })
  }

  // Filter by search term
  if (searchTerm.value) {
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  }

  // Filter by date range
  if (startDate.value) {
    const start = new Date(startDate.value)
    filtered = filtered.filter(t => new Date(t.date) >= start)
  }

  if (endDate.value) {
    const end = new Date(endDate.value)
    filtered = filtered.filter(t => new Date(t.date) <= end)
  }

  // Sort by date (newest first)
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const totalAmount = computed(() => {
  return filteredTransactions.value.reduce((sum, t) => sum + t.amount, 0)
})

const incomeCount = computed(() => {
  return filteredTransactions.value.filter(t => t.amount >= 0).length
})

const expenseCount = computed(() => {
  return filteredTransactions.value.filter(t => t.amount < 0).length
})

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / pageSize)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize
})

const endIndex = computed(() => {
  return startIndex.value + pageSize
})

const paginatedTransactions = computed(() => {
  return filteredTransactions.value.slice(startIndex.value, endIndex.value)
})

const dateRangeLabel = computed(() => {
  if (startDate.value && endDate.value) {
    return `${formatDateCompact(startDate.value)} - ${formatDateCompact(endDate.value)}`
  } else if (startDate.value) {
    return `Desde ${formatDateCompact(startDate.value)}`
  } else if (endDate.value) {
    return `Até ${formatDateCompact(endDate.value)}`
  }
  return ''
})

// Methods
const formatDateCompact = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
  } catch {
    return dateString
  }
}

const formatCurrencyCompact = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const refreshData = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<Transaction[]>('/api/transactions')
    transactions.value = response
  } catch (e) {
    error.value = 'Não foi possível carregar os dados. Tente novamente.'
    console.error('Error fetching transactions:', e)
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  searchTerm.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})

// Watch for filters changes - reset to page 1
watch([searchTerm, startDate, endDate, selectedPerson], () => {
  currentPage.value = 1
})
</script>
