<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-8 py-6">
        <h1 class="text-3xl font-bold text-gray-800">Todas as Transações</h1>
        <p class="text-gray-600 mt-1">Visualize e filtre todas as suas transações</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="px-8 py-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Buscar por descrição
            </label>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Data inicial
            </label>
            <input
              v-model="startDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Data final
            </label>
            <input
              v-model="endDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="font-medium">Filtros ativos:</span>
            <span class="px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
              {{ selectedPerson }}
            </span>
            <span v-if="startDate || endDate" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {{ dateRangeLabel }}
            </span>
          </div>

          <div class="flex gap-2">
            <button
              @click="clearFilters"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              @click="refreshData"
              :disabled="loading"
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
            >
              {{ loading ? 'Carregando...' : 'Atualizar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="px-8 py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      <p class="mt-4 text-gray-600">Carregando transações...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="px-8 pb-8">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-800 font-medium">Erro ao carregar dados</p>
        <p class="text-red-600 text-sm mt-2">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="px-8 pb-8">
      <!-- Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Transações Filtradas</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ filteredTransactions.length }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Valor Total</p>
          <p class="text-3xl font-bold text-primary-600 mt-2">{{ formatCurrency(totalAmount) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Valor Médio</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">
            {{ formatCurrency(filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0) }}
          </p>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destino
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="transaction in paginatedTransactions"
                :key="transaction.transactionId"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ transaction.origin }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ transaction.destination }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                  {{ transaction.description }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {{ formatCurrency(transaction.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTransactions.length === 0" class="text-center py-12">
          <p class="text-gray-500">Nenhuma transação encontrada com os filtros aplicados</p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredTransactions.length > pageSize" class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div class="text-sm text-gray-700">
            Mostrando <span class="font-medium">{{ startIndex + 1 }}</span> a
            <span class="font-medium">{{ Math.min(endIndex, filteredTransactions.length) }}</span> de
            <span class="font-medium">{{ filteredTransactions.length }}</span> resultados
          </div>
          <div class="flex gap-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Transaction } from '~/types/transaction'

// Composables
const { selectedPerson, identifyPerson } = usePersonFilter()

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
      const person = identifyPerson(transaction.origin)
      return person === selectedPerson.value
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
    return `${formatDate(startDate.value)} - ${formatDate(endDate.value)}`
  } else if (startDate.value) {
    return `Desde ${formatDate(startDate.value)}`
  } else if (endDate.value) {
    return `Até ${formatDate(endDate.value)}`
  }
  return ''
})

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
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
