<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-8 py-6">
        <h1 class="text-3xl font-bold text-gray-800">Gastos por Categoria</h1>
        <p class="text-gray-600 mt-1">Análise de despesas organizadas por categoria</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="px-8 py-4">
      <div class="bg-white rounded-lg shadow px-6 py-3">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-gray-700">
              Mês:
            </label>
            <input
              v-model="selectedMonth"
              type="month"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="font-medium">Pessoa:</span>
            <span class="px-3 py-1 bg-primary-100 text-primary-800 rounded-full font-medium">
              {{ selectedPerson }}
            </span>
          </div>

          <button
            @click="refreshData"
            :disabled="loading"
            class="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
          >
            {{ loading ? 'Carregando...' : 'Atualizar' }}
          </button>
        </div>
      </div>

      <!-- Excluded Categories Info -->
      <div v-if="EXCLUDED_CATEGORIES.length > 0" class="mt-3 px-6 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <details class="text-sm">
          <summary class="cursor-pointer text-yellow-800 font-medium hover:text-yellow-900">
            ⚠️ {{ EXCLUDED_CATEGORIES.length }} categoria(s) excluída(s) da análise
          </summary>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="category in EXCLUDED_CATEGORIES"
              :key="category"
              class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-300"
            >
              {{ category }}
            </span>
          </div>
          <p class="mt-2 text-xs text-yellow-700">
            Para modificar, edite EXCLUDED_CATEGORIES em pages/categories.vue
          </p>
        </details>
      </div>

      <!-- Fixed Costs Categories Info -->
      <div v-if="CUSTOS_FIXOS_CATEGORIES.length > 0" class="mt-3 px-6 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <details class="text-sm">
          <summary class="cursor-pointer text-blue-800 font-medium hover:text-blue-900">
            💵 {{ CUSTOS_FIXOS_CATEGORIES.length }} categoria(s) configurada(s) como custo fixo (mesmo valor)
          </summary>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="category in CUSTOS_FIXOS_CATEGORIES"
              :key="category"
              class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-300"
            >
              {{ category }}
            </span>
          </div>
          <p class="mt-2 text-xs text-blue-700">
            Para modificar, edite CUSTOS_FIXOS_CATEGORIES em pages/categories.vue
          </p>
        </details>
      </div>

      <!-- Committed Expenses Categories Info -->
      <div v-if="GASTOS_COMPROMETIDOS_CATEGORIES.length > 0" class="mt-3 px-6 py-2 bg-orange-50 border border-orange-200 rounded-lg">
        <details class="text-sm">
          <summary class="cursor-pointer text-orange-800 font-medium hover:text-orange-900">
            📌 {{ GASTOS_COMPROMETIDOS_CATEGORIES.length }} categoria(s) configurada(s) como gasto comprometido (valor variável)
          </summary>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="category in GASTOS_COMPROMETIDOS_CATEGORIES"
              :key="category"
              class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full border border-orange-300"
            >
              {{ category }}
            </span>
          </div>
          <p class="mt-2 text-xs text-orange-700">
            Para modificar, edite GASTOS_COMPROMETIDOS_CATEGORIES em pages/categories.vue
          </p>
        </details>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="px-8 py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      <p class="mt-4 text-gray-600">Carregando dados...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="px-8 py-12">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-800 font-medium">Erro ao carregar dados</p>
        <p class="text-red-600 text-sm mt-2">{{ error }}</p>
      </div>
    </div>

    <!-- Categories Grid -->
    <div v-else class="px-8 pb-8">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Gastos Variáveis</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(variableCostsTotal) }}</p>
          <p class="text-green-100 text-xs mt-2">Gastos não recorrentes</p>
        </div>
        <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Custos Fixos</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(custosFixosTotal) }}</p>
          <p class="text-blue-100 text-xs mt-2">{{ custosFixosCategoriesCount }} {{ custosFixosCategoriesCount === 1 ? 'categoria' : 'categorias' }} • Mesmo valor</p>
        </div>
        <div class="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Gastos Comprometidos</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(gastosComprometidosTotal) }}</p>
          <p class="text-orange-100 text-xs mt-2">{{ gastosComprometidosCategoriesCount }} {{ gastosComprometidosCategoriesCount === 1 ? 'categoria' : 'categorias' }} • Valor variável</p>
        </div>
        <div class="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Gasto Total</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(totalAmount) }}</p>
          <p class="text-primary-100 text-xs mt-2">Soma de todos os gastos</p>
        </div>
      </div>

      <!-- Categories List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transações
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % do Total
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Média por Transação
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="category in categories" :key="category.name">
              <tr
                @click="toggleCategory(category.name)"
                class="hover:bg-gray-50 transition-colors cursor-pointer"
                :class="{ 'bg-primary-50': expandedCategory === category.name }"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <!-- Indicador de expansão -->
                    <svg
                      class="h-5 w-5 text-gray-400 transition-transform"
                      :class="{ 'rotate-90': expandedCategory === category.name }"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>

                    <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200">
                      <span class="text-2xl">{{ getCategoryIcon(category.name) }}</span>
                    </div>
                    <div class="ml-2">
                      <div class="text-sm font-semibold text-gray-900">{{ category.name }}</div>
                      <div class="text-xs text-gray-500">Clique para ver transações</div>
                    </div>
                  </div>
                </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {{ category.count }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-lg font-bold text-primary-600">
                  {{ formatCurrency(category.total) }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex-1 min-w-[120px]">
                    <div class="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                      <div
                        class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 shadow"
                        :style="{ width: `${category.percentage}%` }"
                      ></div>
                    </div>
                  </div>
                  <span class="text-sm font-semibold text-gray-700 min-w-[45px] text-right">{{ category.percentage.toFixed(1) }}%</span>
                </div>
              </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ formatCurrency(category.average) }}
                </td>
              </tr>

              <!-- Linha expandida com transações -->
              <tr v-if="expandedCategory === category.name" class="bg-gray-50">
                <td colspan="5" class="px-6 py-4">
                  <div class="space-y-2">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3">
                      Transações de {{ category.name }} ({{ getCategoryTransactions(category.name).length }})
                    </h4>
                    <div class="bg-white rounded-lg shadow-inner p-4 max-h-96 overflow-y-auto">
                      <table class="min-w-full text-sm">
                        <thead class="bg-gray-100 sticky top-0">
                          <tr>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-600">Data</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-600">Origem</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-600">Descrição</th>
                            <th class="px-3 py-2 text-right text-xs font-medium text-gray-600">Valor</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                          <tr
                            v-for="transaction in getCategoryTransactions(category.name)"
                            :key="transaction.transactionId"
                            class="hover:bg-gray-50"
                          >
                            <td class="px-3 py-2 whitespace-nowrap text-gray-900">
                              {{ formatDate(transaction.date) }}
                            </td>
                            <td class="px-3 py-2 whitespace-nowrap text-gray-600">
                              {{ transaction.origin }}
                            </td>
                            <td class="px-3 py-2 text-gray-900">
                              {{ transaction.description }}
                            </td>
                            <td class="px-3 py-2 whitespace-nowrap text-right font-medium text-primary-600">
                              {{ formatCurrency(transaction.amount) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="categories.length === 0" class="text-center py-12">
          <p class="text-gray-500">Nenhuma transação encontrada para o período selecionado</p>
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
const { processInstallments } = useInstallments()

// State
const rawTransactions = ref<Transaction[]>([]) // Transações originais do Google Sheets
const transactions = ref<Transaction[]>([]) // Transações processadas (com parcelas expandidas)
const loading = ref(false)
const error = ref<string | null>(null)
const expandedCategory = ref<string | null>(null) // Categoria expandida para ver transações

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const selectedMonth = ref(getCurrentMonth())

// ===== CONFIGURAÇÃO: Categorias Excluídas =====
// Adicione aqui os nomes das categorias que NÃO devem aparecer na análise
// A comparação é case-insensitive (não diferencia maiúsculas de minúsculas)
const EXCLUDED_CATEGORIES = [
  'Sem Categoria',
  'Credit Account Juliana',
  'Credit Account Gabriel',
  'Bank Account Juliana',
  'Bank Account Gabriel',
  'Credit Card Juliana',
  'Credit Card Gabriel',
  'Adjustment'
  // Adicione mais categorias aqui conforme necessário
]

// ===== CONFIGURAÇÃO: Categorias de Custos Fixos =====
// Adicione aqui os nomes das categorias que têm o mesmo valor todo mês
// A comparação usa includes e é case-insensitive
const CUSTOS_FIXOS_CATEGORIES = [
  'Rent',
  'Subscriptions/Softwares',
  'Insurance',
  'Utilities',
  'Business & Taxes',
  'Medical',
  // Adicione mais categorias aqui conforme necessário
]

// ===== CONFIGURAÇÃO: Categorias de Gastos Comprometidos =====
// Adicione aqui os nomes das categorias que são recorrentes mas com valor variável
// A comparação usa includes e é case-insensitive
const GASTOS_COMPROMETIDOS_CATEGORIES = [
  'Installments/Financing',
  'Financing',
  'Utilities',
  'Business & Taxes',
  'Investments',
  'Medical',
  'Rent',
  'Subscriptions/Softwares',
  'Insurance'
  // Adicione mais categorias aqui conforme necessário
]

// Função auxiliar para verificar se uma categoria deve ser excluída
const shouldExcludeCategory = (categoryName: string): boolean => {
  const lowerCaseName = categoryName.toLowerCase()
  return EXCLUDED_CATEGORIES.some(excluded =>
    excluded.toLowerCase() === lowerCaseName
  )
}

// Função auxiliar para verificar se uma categoria é de custo fixo (mesmo valor todo mês)
const isCustoFixoCategory = (categoryName: string): boolean => {
  const lowerCaseName = categoryName.toLowerCase()
  return CUSTOS_FIXOS_CATEGORIES.some(fixed =>
    lowerCaseName.includes(fixed.toLowerCase())
  )
}

// Função auxiliar para verificar se uma categoria é de gasto comprometido (valor variável)
const isGastoComprometidoCategory = (categoryName: string): boolean => {
  const lowerCaseName = categoryName.toLowerCase()
  return GASTOS_COMPROMETIDOS_CATEGORIES.some(comprometido =>
    lowerCaseName.includes(comprometido.toLowerCase())
  )
}

// Computed
const formattedMonth = computed(() => {
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const filteredTransactions = computed(() => {
  let filtered = transactions.value

  // Filter by person
  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => {
      const person = identifyPerson(transaction.origin)
      return person === selectedPerson.value
    })
  }

  // Filter by month
  const [year, month] = selectedMonth.value.split('-')
  filtered = filtered.filter(t => {
    const date = new Date(t.date)
    return date.getFullYear() === parseInt(year) &&
           date.getMonth() === parseInt(month) - 1
  })

  return filtered
})

interface CategoryData {
  name: string
  count: number
  total: number
  percentage: number
  average: number
}

const categories = computed(() => {
  const categoryMap = new Map<string, { count: number; total: number }>()

  filteredTransactions.value.forEach(transaction => {
    const category = transaction.destination || 'Sem Categoria'
    const existing = categoryMap.get(category) || { count: 0, total: 0 }

    categoryMap.set(category, {
      count: existing.count + 1,
      total: existing.total + transaction.amount
    })
  })

  const total = totalAmount.value
  const result: CategoryData[] = []

  categoryMap.forEach((data, name) => {
    // Filtrar categorias excluídas
    if (!shouldExcludeCategory(name)) {
      result.push({
        name,
        count: data.count,
        total: data.total,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
        average: data.total / data.count
      })
    }
  })

  // Sort by total (descending)
  return result.sort((a, b) => b.total - a.total)
})

// Computed para transações não excluídas (considera filtro de categorias excluídas)
const nonExcludedTransactions = computed(() => {
  return filteredTransactions.value.filter(t => {
    const category = t.destination || 'Sem Categoria'
    return !shouldExcludeCategory(category)
  })
})

const totalTransactions = computed(() => nonExcludedTransactions.value.length)

const totalAmount = computed(() => {
  return nonExcludedTransactions.value.reduce((sum, t) => sum + t.amount, 0)
})

// Computed para calcular o total de custos fixos (mesmo valor todo mês)
const custosFixosTotal = computed(() => {
  return nonExcludedTransactions.value
    .filter(t => {
      const category = t.destination || 'Sem Categoria'
      return isCustoFixoCategory(category)
    })
    .reduce((sum, t) => sum + t.amount, 0)
})

// Computed para contar quantas categorias de custo fixo existem no período atual
const custosFixosCategoriesCount = computed(() => {
  const categoriesSet = new Set<string>()
  nonExcludedTransactions.value.forEach(t => {
    const category = t.destination || 'Sem Categoria'
    if (isCustoFixoCategory(category)) {
      categoriesSet.add(category)
    }
  })
  return categoriesSet.size
})

// Computed para calcular o total de gastos comprometidos (valor variável)
const gastosComprometidosTotal = computed(() => {
  return nonExcludedTransactions.value
    .filter(t => {
      const category = t.destination || 'Sem Categoria'
      return isGastoComprometidoCategory(category)
    })
    .reduce((sum, t) => sum + t.amount, 0)
})

// Computed para contar quantas categorias de gasto comprometido existem no período atual
const gastosComprometidosCategoriesCount = computed(() => {
  const categoriesSet = new Set<string>()
  nonExcludedTransactions.value.forEach(t => {
    const category = t.destination || 'Sem Categoria'
    if (isGastoComprometidoCategory(category)) {
      categoriesSet.add(category)
    }
  })
  return categoriesSet.size
})

// Computed para calcular o total de gastos variáveis (não fixos e não comprometidos)
const variableCostsTotal = computed(() => {
  return nonExcludedTransactions.value
    .filter(t => {
      const category = t.destination || 'Sem Categoria'
      return !isCustoFixoCategory(category) && !isGastoComprometidoCategory(category)
    })
    .reduce((sum, t) => sum + t.amount, 0)
})

// Methods
const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase()

  // Alimentação e Restaurantes
  if (name.includes('restaurante') || name.includes('comida') || name.includes('alimentação') ||
      name.includes('almoço') || name.includes('jantar') || name.includes('lanche') ||
      name.includes('food') || name.includes('restaurant')) {
    return '🍽️'
  }

  // Mercado e Supermercado
  if (name.includes('mercado') || name.includes('supermercado') || name.includes('grocery')) {
    return '🛒'
  }

  // Transporte
  if (name.includes('uber') || name.includes('taxi') || name.includes('transporte') ||
      name.includes('combustível') || name.includes('gasolina') || name.includes('transport')) {
    return '🚗'
  }

  // Saúde
  if (name.includes('saúde') || name.includes('farmácia') || name.includes('médico') ||
      name.includes('hospital') || name.includes('health') || name.includes('pharmacy')) {
    return '⚕️'
  }

  // Educação
  if (name.includes('educação') || name.includes('escola') || name.includes('curso') ||
      name.includes('livro') || name.includes('education')) {
    return '📚'
  }

  // Moradia
  if (name.includes('aluguel') || name.includes('condomínio') || name.includes('casa') ||
      name.includes('rent') || name.includes('moradia')) {
    return '🏠'
  }

  // Contas e Serviços
  if (name.includes('conta') || name.includes('luz') || name.includes('água') ||
      name.includes('internet') || name.includes('telefone') || name.includes('bill')) {
    return '📄'
  }

  // Entretenimento
  if (name.includes('cinema') || name.includes('streaming') || name.includes('netflix') ||
      name.includes('spotify') || name.includes('lazer') || name.includes('entertainment')) {
    return '🎬'
  }

  // Roupas e Vestuário
  if (name.includes('roupa') || name.includes('vestuário') || name.includes('loja') ||
      name.includes('clothes') || name.includes('fashion')) {
    return '👕'
  }

  // Tecnologia
  if (name.includes('tecnologia') || name.includes('eletrônico') || name.includes('tech') ||
      name.includes('computador') || name.includes('celular')) {
    return '💻'
  }

  // Viagem
  if (name.includes('viagem') || name.includes('hotel') || name.includes('passagem') ||
      name.includes('travel') || name.includes('flight')) {
    return '✈️'
  }

  // Pets
  if (name.includes('pet') || name.includes('veterinário') || name.includes('animal')) {
    return '🐾'
  }

  // Beleza
  if (name.includes('beleza') || name.includes('salão') || name.includes('cabelo') ||
      name.includes('beauty') || name.includes('cosmético')) {
    return '💄'
  }

  // Academia e Esportes
  if (name.includes('academia') || name.includes('esporte') || name.includes('fitness') ||
      name.includes('gym')) {
    return '💪'
  }

  // Pagamentos e Transferências
  if (name.includes('pagamento') || name.includes('transferência') || name.includes('pix') ||
      name.includes('payment') || name.includes('transfer')) {
    return '💳'
  }

  // Investimentos
  if (name.includes('investimento') || name.includes('poupança') || name.includes('invest') ||
      name.includes('savings')) {
    return '📈'
  }

  // Bebidas
  if (name.includes('bar') || name.includes('bebida') || name.includes('café') ||
      name.includes('drink') || name.includes('coffee')) {
    return '☕'
  }

  // Presentes
  if (name.includes('presente') || name.includes('gift')) {
    return '🎁'
  }

  // Parcelas e Financiamentos
  if (name.includes('installment') || name.includes('financing') ||
      name.includes('parcela') || name.includes('parcelamento')) {
    return '📅'
  }

  // Default - Sem categoria ou outros
  return '💰'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
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

const toggleCategory = (categoryName: string) => {
  if (expandedCategory.value === categoryName) {
    expandedCategory.value = null
  } else {
    expandedCategory.value = categoryName
  }
}

const getCategoryTransactions = (categoryName: string): Transaction[] => {
  return nonExcludedTransactions.value
    .filter(t => {
      const category = t.destination || 'Sem Categoria'
      return category === categoryName
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const refreshData = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<Transaction[]>('/api/transactions')
    rawTransactions.value = response

    // Processar e expandir parcelas ao longo dos meses
    const processed = processInstallments(response)

    transactions.value = processed
  } catch (e) {
    error.value = 'Não foi possível carregar os dados. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})

// Watch for person filter changes
watch(selectedPerson, () => {
  // Data will be automatically recomputed due to computed properties
})
</script>
