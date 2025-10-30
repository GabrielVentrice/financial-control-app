<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-8 py-6">
        <h1 class="text-3xl font-bold text-gray-800">Configuração de Orçamento</h1>
        <p class="text-gray-600 mt-1">Defina orçamentos mensais separados para Juliana e Gabriel</p>
      </div>
    </div>

    <!-- Month/Year Selector -->
    <div class="px-8 py-4">
      <div class="bg-white rounded-lg shadow px-6 py-3">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-gray-700">
              Período:
            </label>
            <input
              v-model="selectedMonth"
              type="month"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="loadData"
              :disabled="loading"
              class="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
            >
              {{ loading ? 'Carregando...' : 'Atualizar' }}
            </button>

            <button
              @click="saveBudgets"
              :disabled="saving || !hasChanges"
              class="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {{ saving ? 'Salvando...' : 'Salvar Orçamentos' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="mt-3 px-6 py-3 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-green-800 text-sm font-medium">{{ successMessage }}</p>
      </div>

      <div v-if="errorMessage" class="mt-3 px-6 py-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-800 text-sm font-medium">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="px-8 py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      <p class="mt-4 text-gray-600">Carregando dados...</p>
    </div>

    <!-- Budget Configuration -->
    <div v-else class="px-8 pb-8">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Orçamento Juliana</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(totalBudgetJuliana) }}</p>
          <p class="text-purple-100 text-xs mt-2">{{ categoriesWithBudgetJuliana }} categorias</p>
        </div>

        <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Orçamento Gabriel</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(totalBudgetGabriel) }}</p>
          <p class="text-blue-100 text-xs mt-2">{{ categoriesWithBudgetGabriel }} categorias</p>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Orçamento Total</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(totalBudget) }}</p>
          <p class="text-green-100 text-xs mt-2">Para {{ formattedMonth }}</p>
        </div>

        <div class="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg shadow-lg p-6">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Categorias Configuradas</p>
          <p class="text-4xl font-bold text-white mt-2">{{ categoriesWithBudget }}</p>
          <p class="text-orange-100 text-xs mt-2">de {{ availableCategories.length }} categorias</p>
        </div>
      </div>

      <!-- Categories List with Budget Inputs -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-800">Orçamentos por Categoria</h2>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar categoria..."
                class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        <!-- Table Header -->
        <div class="px-6 py-3 bg-gray-100 border-b border-gray-200">
          <div class="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-600 uppercase">
            <div class="col-span-5">Categoria</div>
            <div class="col-span-3 text-center">Juliana</div>
            <div class="col-span-3 text-center">Gabriel</div>
            <div class="col-span-1 text-center">Total</div>
          </div>
        </div>

        <!-- Categories -->
        <div class="divide-y divide-gray-200">
          <div
            v-for="category in filteredCategories"
            :key="category"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="grid grid-cols-12 gap-4 items-center">
              <!-- Category Name -->
              <div class="col-span-5 flex items-center gap-3">
                <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200">
                  <span class="text-xl">{{ getCategoryIcon(category) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ category }}</p>
                </div>
              </div>

              <!-- Juliana Input -->
              <div class="col-span-3">
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                  <input
                    v-model.number="budgetInputsJuliana[category]"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    class="w-full pl-10 pr-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    @input="markAsChanged"
                  />
                </div>
              </div>

              <!-- Gabriel Input -->
              <div class="col-span-3">
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                  <input
                    v-model.number="budgetInputsGabriel[category]"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    class="w-full pl-10 pr-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    @input="markAsChanged"
                  />
                </div>
              </div>

              <!-- Total -->
              <div class="col-span-1 text-center">
                <span class="text-sm font-semibold text-gray-700">
                  {{ formatCurrencyShort(getCategoryTotal(category)) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredCategories.length === 0" class="text-center py-12">
          <p class="text-gray-500">
            {{ searchQuery ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria disponível' }}
          </p>
        </div>
      </div>

      <!-- Info about excluded categories -->
      <div class="mt-6 px-6 py-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-800">
          <strong>Nota:</strong> Apenas categorias de gastos são exibidas aqui. Categorias de sistema (contas bancárias, cartões de crédito, etc.) são automaticamente excluídas.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { BudgetsResponse, CategoriesResponse, BudgetInput } from '~/types/transaction'

// State
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const searchQuery = ref('')
const hasChanges = ref(false)

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const selectedMonth = ref(getCurrentMonth())

// Data
const availableCategories = ref<string[]>([])
const budgetInputsJuliana = ref<Record<string, number>>({})
const budgetInputsGabriel = ref<Record<string, number>>({})
const existingBudgets = ref<BudgetsResponse | null>(null)

// Excluded categories (same as in categories.vue)
const EXCLUDED_CATEGORIES = [
  'Sem Categoria',
  'Credit Account Juliana',
  'Credit Account Gabriel',
  'Bank Account Juliana',
  'Bank Account Gabriel',
  'Credit Card Juliana',
  'Credit Card Gabriel',
  'Adjustment'
]

// Computed
const formattedMonth = computed(() => {
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return availableCategories.value
  }

  const query = searchQuery.value.toLowerCase()
  return availableCategories.value.filter(cat =>
    cat.toLowerCase().includes(query)
  )
})

const getCategoryTotal = (category: string): number => {
  return (budgetInputsJuliana.value[category] || 0) + (budgetInputsGabriel.value[category] || 0)
}

const categoriesWithBudgetJuliana = computed(() => {
  return Object.values(budgetInputsJuliana.value).filter(amount => amount && amount > 0).length
})

const categoriesWithBudgetGabriel = computed(() => {
  return Object.values(budgetInputsGabriel.value).filter(amount => amount && amount > 0).length
})

const categoriesWithBudget = computed(() => {
  const categoriesSet = new Set<string>()

  for (const category of availableCategories.value) {
    if ((budgetInputsJuliana.value[category] && budgetInputsJuliana.value[category] > 0) ||
        (budgetInputsGabriel.value[category] && budgetInputsGabriel.value[category] > 0)) {
      categoriesSet.add(category)
    }
  }

  return categoriesSet.size
})

const totalBudgetJuliana = computed(() => {
  return Object.values(budgetInputsJuliana.value).reduce((sum, amount) => sum + (amount || 0), 0)
})

const totalBudgetGabriel = computed(() => {
  return Object.values(budgetInputsGabriel.value).reduce((sum, amount) => sum + (amount || 0), 0)
})

const totalBudget = computed(() => {
  return totalBudgetJuliana.value + totalBudgetGabriel.value
})

// Methods
const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase()

  if (name.includes('restaurante') || name.includes('comida') || name.includes('alimentação') ||
      name.includes('almoço') || name.includes('jantar') || name.includes('lanche') ||
      name.includes('food') || name.includes('restaurant')) {
    return '🍽️'
  }

  if (name.includes('mercado') || name.includes('supermercado') || name.includes('grocery')) {
    return '🛒'
  }

  if (name.includes('uber') || name.includes('taxi') || name.includes('transporte') ||
      name.includes('combustível') || name.includes('gasolina') || name.includes('transport')) {
    return '🚗'
  }

  if (name.includes('saúde') || name.includes('farmácia') || name.includes('médico') ||
      name.includes('hospital') || name.includes('health') || name.includes('pharmacy') || name.includes('medical')) {
    return '⚕️'
  }

  if (name.includes('educação') || name.includes('escola') || name.includes('curso') ||
      name.includes('livro') || name.includes('education')) {
    return '📚'
  }

  if (name.includes('aluguel') || name.includes('condomínio') || name.includes('casa') ||
      name.includes('rent') || name.includes('moradia')) {
    return '🏠'
  }

  if (name.includes('conta') || name.includes('luz') || name.includes('água') ||
      name.includes('internet') || name.includes('telefone') || name.includes('bill') ||
      name.includes('utilities')) {
    return '📄'
  }

  if (name.includes('cinema') || name.includes('streaming') || name.includes('netflix') ||
      name.includes('spotify') || name.includes('lazer') || name.includes('entertainment')) {
    return '🎬'
  }

  if (name.includes('roupa') || name.includes('vestuário') || name.includes('loja') ||
      name.includes('clothes') || name.includes('fashion')) {
    return '👕'
  }

  if (name.includes('tecnologia') || name.includes('eletrônico') || name.includes('tech') ||
      name.includes('computador') || name.includes('celular')) {
    return '💻'
  }

  if (name.includes('viagem') || name.includes('hotel') || name.includes('passagem') ||
      name.includes('travel') || name.includes('flight')) {
    return '✈️'
  }

  if (name.includes('pet') || name.includes('veterinário') || name.includes('animal')) {
    return '🐾'
  }

  if (name.includes('beleza') || name.includes('salão') || name.includes('cabelo') ||
      name.includes('beauty') || name.includes('cosmético')) {
    return '💄'
  }

  if (name.includes('academia') || name.includes('esporte') || name.includes('fitness') ||
      name.includes('gym')) {
    return '💪'
  }

  if (name.includes('pagamento') || name.includes('transferência') || name.includes('pix') ||
      name.includes('payment') || name.includes('transfer')) {
    return '💳'
  }

  if (name.includes('investimento') || name.includes('poupança') || name.includes('invest') ||
      name.includes('savings') || name.includes('investment')) {
    return '📈'
  }

  if (name.includes('bar') || name.includes('bebida') || name.includes('café') ||
      name.includes('drink') || name.includes('coffee')) {
    return '☕'
  }

  if (name.includes('presente') || name.includes('gift')) {
    return '🎁'
  }

  if (name.includes('installment') || name.includes('financing') ||
      name.includes('parcela') || name.includes('parcelamento')) {
    return '📅'
  }

  if (name.includes('business') || name.includes('tax') || name.includes('negócio')) {
    return '💼'
  }

  if (name.includes('insurance') || name.includes('seguro')) {
    return '🛡️'
  }

  if (name.includes('subscri') || name.includes('software') || name.includes('assinatura')) {
    return '📱'
  }

  return '💰'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatCurrencyShort = (value: number) => {
  if (value === 0) return '-'
  if (value >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const markAsChanged = () => {
  hasChanges.value = true
  clearMessages()
}

const clearMessages = () => {
  errorMessage.value = null
  successMessage.value = null
}

const loadData = async () => {
  loading.value = true
  clearMessages()

  try {
    // Parse selected month
    const [year, month] = selectedMonth.value.split('-')

    // Fetch all categories from transactions
    const categoriesResponse = await $fetch<CategoriesResponse>(`/api/categories`)

    // Filter out excluded categories
    const allCategories = categoriesResponse.categories
      .map(cat => cat.name)
      .filter(name => !EXCLUDED_CATEGORIES.some(excluded =>
        excluded.toLowerCase() === name.toLowerCase()
      ))
      .sort()

    availableCategories.value = allCategories

    // Fetch existing budgets for selected month/year
    const budgetsResponse = await $fetch<BudgetsResponse>(
      `/api/budgets?month=${month}&year=${year}`
    )

    existingBudgets.value = budgetsResponse

    // Initialize budget inputs
    const inputsJuliana: Record<string, number> = {}
    const inputsGabriel: Record<string, number> = {}

    for (const category of allCategories) {
      const julianaBudget = budgetsResponse.budgets.find(
        b => b.category === category && b.person === 'Juliana'
      )
      const gabrielBudget = budgetsResponse.budgets.find(
        b => b.category === category && b.person === 'Gabriel'
      )

      inputsJuliana[category] = julianaBudget?.amount || 0
      inputsGabriel[category] = gabrielBudget?.amount || 0
    }

    budgetInputsJuliana.value = inputsJuliana
    budgetInputsGabriel.value = inputsGabriel
    hasChanges.value = false

    console.log('Loaded data:', {
      categories: allCategories.length,
      budgets: budgetsResponse.budgets.length,
    })
  } catch (e: any) {
    console.error('Error loading data:', e)
    errorMessage.value = e.data || 'Não foi possível carregar os dados. Tente novamente.'
  } finally {
    loading.value = false
  }
}

const saveBudgets = async () => {
  saving.value = true
  clearMessages()

  try {
    const [year, month] = selectedMonth.value.split('-')

    // Prepare budgets to save (only non-zero values)
    const budgetsToSave: BudgetInput[] = []

    for (const category of availableCategories.value) {
      const julianaAmount = budgetInputsJuliana.value[category]
      const gabrielAmount = budgetInputsGabriel.value[category]

      if (julianaAmount && julianaAmount > 0) {
        budgetsToSave.push({
          category,
          person: 'Juliana',
          month: parseInt(month),
          year: parseInt(year),
          amount: julianaAmount,
        })
      }

      if (gabrielAmount && gabrielAmount > 0) {
        budgetsToSave.push({
          category,
          person: 'Gabriel',
          month: parseInt(month),
          year: parseInt(year),
          amount: gabrielAmount,
        })
      }
    }

    if (budgetsToSave.length === 0) {
      errorMessage.value = 'Nenhum orçamento foi definido. Defina pelo menos um orçamento para salvar.'
      return
    }

    console.log('Saving budgets:', budgetsToSave)

    // Save to API
    await $fetch('/api/budgets', {
      method: 'POST',
      body: budgetsToSave,
    })

    successMessage.value = `${budgetsToSave.length} orçamento(s) salvos com sucesso!`
    hasChanges.value = false

    // Reload data to get updated timestamps
    setTimeout(() => {
      loadData()
    }, 1000)
  } catch (e: any) {
    console.error('Error saving budgets:', e)
    errorMessage.value = e.data?.message || e.data || 'Não foi possível salvar os orçamentos. Tente novamente.'
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})

// Watch for month changes
watch(selectedMonth, () => {
  if (hasChanges.value) {
    if (confirm('Você tem alterações não salvas. Deseja realmente mudar o período sem salvar?')) {
      loadData()
    }
  } else {
    loadData()
  }
})
</script>
