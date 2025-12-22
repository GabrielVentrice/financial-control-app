<template>
  <Sidemenu>
    <div class="bg-gray-50 min-h-screen">
      <!-- Header - Fixed height, consistent -->
      <header class="h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold text-gray-900">Transações</h1>
          <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="ghost" @click="refreshData" :loading="loading || refreshing">
          {{ refreshing ? 'Atualizando...' : 'Atualizar' }}
        </BaseButton>
      </header>

      <!-- Filtros - Compact area -->
      <div class="px-6 py-4 bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Buscar
              </label>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Descrição..."
                class="w-full px-3 py-2 bg-white text-gray-900 text-sm rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Data Inicial
              </label>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-3 py-2 bg-white text-gray-900 text-sm rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Data Final
              </label>
              <input
                v-model="endDate"
                type="date"
                class="w-full px-3 py-2 bg-white text-gray-900 text-sm rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
          </div>

          <!-- Limpar filtros -->
          <div v-if="startDate || endDate || searchTerm" class="mt-3 flex items-center gap-3">
            <button
              @click="clearFilters"
              class="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
            >
              Limpar filtros
            </button>
            <div v-if="startDate || endDate" class="flex items-center gap-2 text-sm text-gray-500">
              <span>Período:</span>
              <span class="font-medium text-gray-900">{{ dateRangeLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Stats - 4 columns desktop, 2 mobile -->
          <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <LightStatCard
              label="Total"
              :value="filteredTransactions.length"
              format="number"
              value-color="neutral"
              size="md"
            />

            <LightStatCard
              label="Receitas"
              :value="incomeCount"
              format="number"
              value-color="positive"
              size="md"
            />

            <LightStatCard
              label="Despesas"
              :value="expenseCount"
              format="number"
              value-color="negative"
              size="md"
            />

            <LightStatCard
              label="Saldo"
              :value="totalAmount"
              format="currency"
              :value-color="totalAmount >= 0 ? 'positive' : 'negative'"
              size="md"
            />
          </section>

          <!-- Transactions Table -->
          <section class="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col" style="max-height: calc(100vh - 400px); min-height: 500px;">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900">Transações</h3>
              <span class="text-xs text-gray-500">{{ filteredTransactions.length }} resultados</span>
            </div>

            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto overflow-y-auto flex-1">
              <table class="min-w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Origem
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Destino
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Descrição
                    </th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="transaction in paginatedTransactions"
                    :key="transaction.transactionId"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {{ formatDateCompact(transaction.date) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600 truncate max-w-[150px]">
                      {{ transaction.origin }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600 truncate max-w-[150px]">
                      {{ transaction.destination }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900 truncate max-w-md">
                      {{ transaction.description }}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold" :class="{
                      'text-positive': transaction.amount >= 0,
                      'text-negative': transaction.amount < 0
                    }">
                      {{ formatCurrencyCompact(transaction.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="lg:hidden divide-y divide-gray-100 overflow-y-auto flex-1">
              <div
                v-for="transaction in paginatedTransactions"
                :key="transaction.transactionId"
                class="p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex justify-between items-start gap-3 mb-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ transaction.description }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ formatDateCompact(transaction.date) }}</p>
                  </div>
                  <p class="text-sm font-semibold whitespace-nowrap" :class="{
                    'text-positive': transaction.amount >= 0,
                    'text-negative': transaction.amount < 0
                  }">
                    {{ formatCurrencyCompact(transaction.amount) }}
                  </p>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span class="truncate">{{ transaction.origin }}</span>
                  <span>→</span>
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

            <!-- Pagination -->
            <div v-if="filteredTransactions.length > pageSize" class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 flex-shrink-0">
              <div class="text-sm text-gray-600">
                <span class="font-semibold text-gray-900">{{ startIndex + 1 }}-{{ Math.min(endIndex, filteredTransactions.length) }}</span>
                <span class="mx-1">de</span>
                <span class="font-semibold text-gray-900">{{ filteredTransactions.length }}</span>
              </div>
              <div class="flex gap-2">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span class="px-3 py-1.5 text-sm text-gray-600">
                  {{ currentPage }} / {{ totalPages }}
                </span>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima →
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
import type { CacheRefreshResponse } from '~/types/cache'

// Composables
const { selectedPerson } = usePersonFilter()
const { fetchCacheStatus } = useCacheStatus()

// State
const transactions = ref<Transaction[]>([])
const loading = ref(false)
const refreshing = ref(false)
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

// Load data from cache (no refresh)
const loadData = async () => {
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

// Refresh cache and reload data
const refreshData = async () => {
  refreshing.value = true
  loading.value = true
  error.value = null

  try {
    // First, refresh the cache
    const cacheResponse = await $fetch<CacheRefreshResponse>('/api/cache/refresh', {
      method: 'POST'
    })

    if (cacheResponse.success) {
      console.log('Cache atualizado:', cacheResponse.message)
    }

    // Then fetch transactions from cache
    const response = await $fetch<Transaction[]>('/api/transactions')
    transactions.value = response

    // Update cache status
    await fetchCacheStatus()
  } catch (e) {
    error.value = 'Não foi possível carregar os dados. Tente novamente.'
    console.error('Error fetching transactions:', e)
  } finally {
    loading.value = false
    refreshing.value = false
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
  loadData() // Load from cache, no automatic refresh
})

// Watch for filters changes - reset to page 1
watch([searchTerm, startDate, endDate, selectedPerson], () => {
  currentPage.value = 1
})
</script>
