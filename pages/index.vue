<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-8 py-6">
        <h1 class="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-600 mt-1">Visão geral das suas finanças</p>
      </div>
    </div>

    <!-- Controls -->
    <div class="px-8 py-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center gap-4 flex-wrap">
          <button
            @click="refresh"
            :disabled="loading"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
          >
            {{ loading ? 'Carregando...' : 'Atualizar Dados' }}
          </button>

          <div class="flex-1 min-w-[300px]">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar por descrição..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <!-- Filter info -->
        <div class="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span class="font-medium">Filtro ativo:</span>
          <span class="px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
            {{ selectedPerson }}
          </span>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="px-8 pb-8">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-800 font-medium">Erro ao carregar dados</p>
        <p class="text-red-600 text-sm mt-2">{{ error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="px-8 py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      <p class="mt-4 text-gray-600">Carregando transações...</p>
    </div>

    <!-- Content -->
    <div v-else-if="!error" class="px-8 pb-8">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Total de Transações</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ filteredTransactions.length }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Valor Total</p>
          <p class="text-3xl font-bold text-primary-600 mt-2">{{ formatCurrency(totalAmount) }}</p>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrado em
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="transaction in filteredTransactions"
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
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ transaction.description }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {{ formatCurrency(transaction.amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(transaction.recordedAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTransactions.length === 0" class="text-center py-12">
          <p class="text-gray-500">Nenhuma transação encontrada</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Composables
const {
  transactions,
  loading,
  error,
  fetchTransactions,
  getTotalAmount,
  getTransactionsByDescription,
} = useTransactions()

const { selectedPerson, identifyPerson } = usePersonFilter()

// State
const searchTerm = ref('')

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

  // Then filter by search term
  if (searchTerm.value) {
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  }

  return filtered
})

const totalAmount = computed(() => {
  return getTotalAmount(filteredTransactions.value)
})

// Methods
const refresh = async () => {
  await fetchTransactions()
}

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

// Lifecycle
onMounted(() => {
  fetchTransactions()
})

// Watch for person filter changes
watch(selectedPerson, () => {
  // Data will be automatically recomputed due to computed properties
})
</script>
