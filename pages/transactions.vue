<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] text-gray-800 min-h-screen">
      <!-- Header - Clean, sem bordas pesadas -->
      <header class="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-gray-100">
        <div class="flex items-baseline gap-4">
          <h1 class="text-2xl font-normal tracking-tight text-gray-800">Transações</h1>
          <span class="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refreshData" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Filtros - Cards suaves, não inputs com bordas -->
      <div class="px-6 lg:px-12 py-6 bg-gray-50/50 border-b border-gray-100">
        <div class="max-w-[1400px] mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Buscar
              </label>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Descrição..."
                class="w-full px-4 py-3 bg-white text-gray-700 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Data Inicial
              </label>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-4 py-3 bg-white text-gray-700 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Data Final
              </label>
              <input
                v-model="endDate"
                type="date"
                class="w-full px-4 py-3 bg-white text-gray-700 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
              />
            </div>
          </div>

          <!-- Limpar filtros -->
          <div v-if="startDate || endDate || searchTerm" class="mt-6 flex items-center gap-4">
            <button
              @click="clearFilters"
              class="px-4 py-2 text-sm text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpar filtros
            </button>
            <div v-if="startDate || endDate" class="flex items-center gap-2 text-sm text-gray-500">
              <span>Período:</span>
              <span class="font-medium text-gray-700">{{ dateRangeLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-8 space-y-8">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Stats - 3 COLUNAS principais -->
          <section>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LightStatCard
                label="Total de Transações"
                :value="filteredTransactions.length"
                format="number"
                value-color="primary"
                size="lg"
              />

              <LightStatCard
                label="Receitas"
                :value="incomeCount"
                format="number"
                value-color="success"
                size="lg"
                :secondary-stat="{ label: 'Entradas', value: '' }"
              />

              <LightStatCard
                label="Despesas"
                :value="expenseCount"
                format="number"
                value-color="danger"
                size="lg"
                :secondary-stat="{ label: 'Saídas', value: '' }"
              />
            </div>

            <!-- Secondary stats - 2 colunas -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <LightStatCard
                label="Soma Total"
                :value="totalAmount"
                format="currency"
                :value-color="totalAmount >= 0 ? 'success' : 'danger'"
                size="md"
              />

              <LightStatCard
                label="Valor Médio"
                :value="filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0"
                format="currency"
                value-color="info"
                size="md"
              />
            </div>
          </section>

          <!-- Transactions Table - Respirável com scroll interno -->
          <section class="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col" style="max-height: calc(100vh - 520px); min-height: 500px;">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h2 class="text-lg font-normal text-gray-700">Transações</h2>
              <p class="text-sm text-gray-400 mt-1">{{ filteredTransactions.length }} resultados</p>
            </div>

            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto overflow-y-auto flex-1">
              <table class="min-w-full">
                <thead class="bg-gray-50/50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Origem
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Destino
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th class="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="transaction in paginatedTransactions"
                    :key="transaction.transactionId"
                    class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ formatDateCompact(transaction.date) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px]">
                      {{ transaction.origin }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px]">
                      {{ transaction.destination }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-700 truncate max-w-md">
                      {{ transaction.description }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-base font-light" :class="{
                      'text-emerald-500': transaction.amount >= 0,
                      'text-rose-400': transaction.amount < 0
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
                class="p-5 space-y-3 hover:bg-gray-50 transition-colors"
              >
                <div class="flex justify-between items-start gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-gray-700 font-normal truncate">{{ transaction.description }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ formatDateCompact(transaction.date) }}</p>
                  </div>
                  <p class="text-base font-light whitespace-nowrap" :class="{
                    'text-emerald-500': transaction.amount >= 0,
                    'text-rose-400': transaction.amount < 0
                  }">
                    {{ formatCurrencyCompact(transaction.amount) }}
                  </p>
                </div>
                <div class="flex justify-between text-xs text-gray-500">
                  <span class="truncate">{{ transaction.origin }}</span>
                  <span class="mx-2">→</span>
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

            <!-- Pagination - Minimalista -->
            <div v-if="filteredTransactions.length > pageSize" class="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-100 flex-shrink-0">
              <div class="text-sm text-gray-500">
                <span class="font-medium text-gray-700">{{ startIndex + 1 }}-{{ Math.min(endIndex, filteredTransactions.length) }}</span>
                <span class="mx-1">de</span>
                <span class="font-medium text-gray-700">{{ filteredTransactions.length }}</span>
              </div>
              <div class="flex gap-2">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span class="px-4 py-2 text-sm text-gray-500">
                  {{ currentPage }} / {{ totalPages }}
                </span>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
