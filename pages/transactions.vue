<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] min-h-screen">
      <!-- Header -->
      <header class="h-14 px-6 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-10">
        <div>
          <h1 class="text-lg font-semibold text-[#111111] tracking-tight">Transacoes</h1>
          <p class="text-[13px] text-gray-500 mt-0.5">{{ selectedPerson }}</p>
        </div>
        <button
          @click="refreshData"
          :disabled="loading || refreshing"
          class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Atualizar dados"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      <!-- Filters -->
      <div class="px-6 py-4 bg-white">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Buscar descricao..."
                class="w-full px-3 py-2 bg-gray-50 text-gray-700 text-[13px] rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>

            <div>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-3 py-2 bg-gray-50 text-gray-700 text-[13px] rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>

            <div>
              <input
                v-model="endDate"
                type="date"
                class="w-full px-3 py-2 bg-gray-50 text-gray-700 text-[13px] rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>

          <!-- Clear filters -->
          <div v-if="startDate || endDate || searchTerm" class="mt-3 flex items-center gap-3">
            <button
              @click="clearFilters"
              class="px-3 py-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              Limpar filtros
            </button>
            <div v-if="startDate || endDate" class="text-[13px] text-gray-500">
              <span class="font-medium text-gray-700">{{ dateRangeLabel }}</span>
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
          <!-- Summary Stats -->
          <section class="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
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
          <section class="overflow-hidden flex flex-col" style="max-height: calc(100vh - 400px); min-height: 500px;">
            <!-- Header -->
            <div class="px-1 py-3 flex-shrink-0 flex items-center justify-between">
              <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Transacoes</h2>
              <span class="text-[11px] text-gray-500">{{ filteredTransactions.length }} resultados</span>
            </div>

            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto overflow-y-auto flex-1">
              <table class="min-w-full">
                <thead>
                  <tr>
                    <th class="px-4 py-3 text-left text-[11px] font-normal text-gray-500">
                      Data
                    </th>
                    <th class="px-4 py-3 text-left text-[11px] font-normal text-gray-500">
                      Origem
                    </th>
                    <th class="px-4 py-3 text-left text-[11px] font-normal text-gray-500">
                      Destino
                    </th>
                    <th class="px-4 py-3 text-left text-[11px] font-normal text-gray-500">
                      Descricao
                    </th>
                    <th class="px-4 py-3 text-right text-[11px] font-normal text-gray-500">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="transaction in paginatedTransactions"
                    :key="transaction.transactionId"
                    class="hover:bg-gray-50/80 transition-colors"
                  >
                    <td class="px-4 py-3.5 whitespace-nowrap text-[13px] text-gray-500">
                      {{ formatDateCompact(transaction.date) }}
                    </td>
                    <td class="px-4 py-3.5 text-[13px] text-gray-500 truncate max-w-[150px]">
                      {{ transaction.origin }}
                    </td>
                    <td class="px-4 py-3.5 text-[13px] text-gray-500 truncate max-w-[150px]">
                      {{ transaction.destination }}
                    </td>
                    <td class="px-4 py-3.5 text-[15px] font-medium text-gray-700 truncate max-w-md">
                      {{ transaction.description }}
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap text-right text-[15px] font-semibold" :class="{
                      'text-positive': transaction.amount >= 0,
                      'text-negative': transaction.amount < 0
                    }">
                      {{ formatCurrencyCompact(transaction.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards - whitespace separation -->
            <div class="lg:hidden overflow-y-auto flex-1">
              <div
                v-for="transaction in paginatedTransactions"
                :key="transaction.transactionId"
                class="px-4 py-3.5 hover:bg-gray-50/80 transition-colors"
              >
                <div class="flex justify-between items-start gap-3 mb-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-[15px] font-medium text-gray-700 truncate">{{ transaction.description }}</p>
                    <p class="text-[13px] text-gray-500 mt-0.5">{{ formatDateCompact(transaction.date) }}</p>
                  </div>
                  <p class="text-[15px] font-semibold whitespace-nowrap" :class="{
                    'text-positive': transaction.amount >= 0,
                    'text-negative': transaction.amount < 0
                  }">
                    {{ formatCurrencyCompact(transaction.amount) }}
                  </p>
                </div>
                <div class="flex items-center gap-2 text-[13px] text-gray-500">
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
              title="Nenhuma transacao"
              description="Ajuste os filtros para ver transacoes."
            />

            <!-- Pagination -->
            <div v-if="filteredTransactions.length > pageSize" class="px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div class="text-[13px] text-gray-500">
                <span class="font-medium text-gray-700">{{ startIndex + 1 }}-{{ Math.min(endIndex, filteredTransactions.length) }}</span>
                <span class="mx-1">de</span>
                <span class="font-medium text-gray-700">{{ filteredTransactions.length }}</span>
              </div>
              <div class="flex gap-2">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="px-3 py-1.5 text-[13px] text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span class="px-3 py-1.5 text-[13px] text-gray-500">
                  {{ currentPage }} / {{ totalPages }}
                </span>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-1.5 text-[13px] text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Proxima →
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
import { ref, computed, watch } from 'vue'

// Composables - transactions fetched automatically via SSR
const {
  transactions,
  loading,
  error,
  refreshing,
  refreshCache
} = useTransactions()

const { selectedPerson } = usePersonFilter()
const { fetchCacheStatus } = useCacheStatus()

// Local filter state
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
    return `Ate ${formatDateCompact(endDate.value)}`
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

// Refresh cache and reload data
const refreshData = async () => {
  try {
    const result = await refreshCache()

    if (result.success) {
      console.log('Cache atualizado:', result.message)
    }

    await fetchCacheStatus()
  } catch (e) {
    console.error('Error refreshing data:', e)
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

// Watch for filters changes - reset to page 1
watch([searchTerm, startDate, endDate, selectedPerson], () => {
  currentPage.value = 1
})
</script>
