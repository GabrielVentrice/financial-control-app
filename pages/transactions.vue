<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Header -->
      <header class="h-[72px] px-10 flex items-center justify-between border-b border-border-base">
        <div>
          <h1 class="text-22 font-medium tracking-tight">Todas as Transações</h1>
          <p class="text-13 text-text-secondary mt-0.5 leading-normal">Visualize e filtre todas as suas transações</p>
        </div>
        <button
          @click="refreshData"
          :disabled="loading"
          class="px-[18px] py-[10px] bg-accent-primary hover:bg-accent-primary-hover text-text-inverse rounded-md transition-all duration-200 ease-out font-medium text-15 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </header>

      <!-- Filters -->
      <div class="px-10 py-6 border-b border-border-base">
        <div class="bg-background-card border border-border-base rounded-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-13 font-medium text-text-secondary mb-2">
                Buscar por descrição
              </label>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Buscar..."
                class="w-full px-4 py-2.5 bg-background-input text-text-primary text-15 rounded-md border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-info transition-all"
              />
            </div>

            <div>
              <label class="block text-13 font-medium text-text-secondary mb-2">
                Data inicial
              </label>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-4 py-2.5 bg-background-input text-text-primary text-15 rounded-md border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-info transition-all"
              />
            </div>

            <div>
              <label class="block text-13 font-medium text-text-secondary mb-2">
                Data final
              </label>
              <input
                v-model="endDate"
                type="date"
                class="w-full px-4 py-2.5 bg-background-input text-text-primary text-15 rounded-md border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-info transition-all"
              />
            </div>
          </div>

          <div class="mt-6 flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3 text-13">
              <span class="font-medium text-text-secondary">Filtros ativos:</span>
              <span class="px-3 py-1.5 bg-accent-primary/10 text-accent-primary rounded-md font-semibold border border-accent-primary/20">
                {{ selectedPerson }}
              </span>
              <span v-if="startDate || endDate" class="px-3 py-1.5 bg-accent-info/10 text-accent-info rounded-md font-semibold border border-accent-info/20">
                {{ dateRangeLabel }}
              </span>
            </div>

            <div class="flex gap-3">
              <button
                @click="clearFilters"
                class="px-4 py-2 text-text-secondary bg-background-section rounded-md hover:bg-background-hover border border-border-base transition-all duration-150 ease-out text-15"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main class="max-w-[1280px] px-10 py-8 space-y-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
          <p class="mt-4 text-text-secondary text-15">Carregando transações...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="border-l-[3px] border-l-accent-danger bg-background-card border border-border-base p-5 rounded-lg">
          <h4 class="text-text-primary font-medium text-15">Erro ao carregar dados</h4>
          <p class="text-text-secondary text-13 mt-1 leading-normal">{{ error }}</p>
        </div>

        <!-- Content -->
        <template v-else>
          <!-- Summary -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Transações Filtradas
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-info tracking-tight">
                {{ filteredTransactions.length }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Total de registros</p>
            </div>
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Valor Total
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-primary tracking-tight">
                {{ formatCurrency(totalAmount) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Soma dos valores</p>
            </div>
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Valor Médio
              </p>
              <p class="text-[32px] font-normal font-serif text-text-primary tracking-tight">
                {{ formatCurrency(filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Média por transação</p>
            </div>
          </section>

          <!-- Transactions Table -->
          <section class="bg-background-card border border-border-base rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-border-base">
                <thead class="bg-background-section">
                  <tr>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide">
                      Data
                    </th>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide">
                      Origem
                    </th>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide">
                      Destino
                    </th>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide">
                      Descrição
                    </th>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-background-card divide-y divide-border-base">
                  <tr
                    v-for="transaction in paginatedTransactions"
                    :key="transaction.transactionId"
                    class="hover:bg-background-hover transition-all duration-150 ease-out"
                  >
                    <td class="px-6 py-4 whitespace-nowrap text-15 text-text-primary">
                      {{ formatDate(transaction.date) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-15 text-text-secondary">
                      {{ transaction.origin }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-15 text-text-secondary">
                      {{ transaction.destination }}
                    </td>
                    <td class="px-6 py-4 text-15 text-text-primary max-w-md truncate">
                      {{ transaction.description }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-15 font-semibold" :class="{
                      'text-accent-success': transaction.amount >= 0,
                      'text-accent-danger': transaction.amount < 0
                    }">
                      {{ formatCurrency(transaction.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Empty State -->
            <div v-if="filteredTransactions.length === 0" class="text-center py-12">
              <p class="text-text-secondary text-15">Nenhuma transação encontrada com os filtros aplicados</p>
            </div>

            <!-- Pagination -->
            <div v-if="filteredTransactions.length > pageSize" class="bg-background-section px-6 py-4 flex items-center justify-between border-t border-border-base">
              <div class="text-13 text-text-secondary">
                Mostrando <span class="font-medium text-text-primary">{{ startIndex + 1 }}</span> a
                <span class="font-medium text-text-primary">{{ Math.min(endIndex, filteredTransactions.length) }}</span> de
                <span class="font-medium text-text-primary">{{ filteredTransactions.length }}</span> resultados
              </div>
              <div class="flex gap-2">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="px-4 py-2 text-15 font-medium text-text-secondary bg-background-card border border-border-base rounded-md hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ease-out"
                >
                  Anterior
                </button>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="px-4 py-2 text-15 font-medium text-text-secondary bg-background-card border border-border-base rounded-md hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ease-out"
                >
                  Próxima
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
