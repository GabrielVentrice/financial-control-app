<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] text-gray-800 min-h-screen">
      <!-- Header -->
      <header class="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-gray-100">
        <div class="flex items-baseline gap-4">
          <h1 class="text-2xl font-normal tracking-tight text-gray-800">Orçamento</h1>
        </div>
        <div class="flex items-center gap-3">
          <BaseButton size="sm" variant="secondary" @click="loadData" :loading="loading">
            Atualizar
          </BaseButton>
          <BaseButton
            size="sm"
            variant="secondary"
            @click="copyFromPreviousMonth"
            :loading="copying"
            :disabled="loading || saving"
          >
            {{ copying ? 'Copiando...' : 'Copiar Mês Anterior' }}
          </BaseButton>
          <BaseButton size="sm" @click="saveBudgets" :loading="saving" :disabled="!hasChanges">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </BaseButton>
        </div>
      </header>

      <!-- Month Selector & Messages -->
      <div class="px-6 lg:px-12 py-6 bg-gray-50/50 border-b border-gray-100 space-y-4">
        <div class="flex items-center gap-4">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            Período:
          </label>
          <input
            v-model="selectedMonth"
            type="month"
            class="px-4 py-3 text-sm bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
          />
          <span class="text-sm text-gray-400">{{ formattedMonth }}</span>
        </div>

        <!-- Alert Messages -->
        <Alert
          v-if="successMessage"
          v-model="showSuccessAlert"
          variant="success"
          :message="successMessage"
          :auto-dismiss="true"
          :auto-dismiss-delay="5000"
          @dismiss="successMessage = null"
        />

        <Alert
          v-if="errorMessage"
          v-model="showErrorAlert"
          variant="error"
          :message="errorMessage"
          @dismiss="errorMessage = null"
        />
      </div>

      <!-- Content -->
      <main class="w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-8 space-y-6">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando orçamentos..." />

        <!-- Content -->
        <template v-else>
          <!-- Tabs for Juliana and Gabriel -->
          <section>
            <div class="flex gap-2 border-b border-gray-200">
              <button
                @click="selectedPerson = 'Juliana'"
                class="px-6 py-3 text-sm font-medium transition-colors border-b-2"
                :class="selectedPerson === 'Juliana'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'"
              >
                Juliana
              </button>
              <button
                @click="selectedPerson = 'Gabriel'"
                class="px-6 py-3 text-sm font-medium transition-colors border-b-2"
                :class="selectedPerson === 'Gabriel'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'"
              >
                Gabriel
              </button>
            </div>
          </section>

          <!-- Summary Cards in one row - Sticky -->
          <section class="sticky top-0 z-10 bg-[#FAFBFC] pt-2 pb-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <LightStatCard
                label="Total Orçado"
                :value="currentPersonTotalBudget"
                format="currency"
                value-color="primary"
                size="md"
                :secondary-stat="{ label: formatMonthCompact(), value: '' }"
              />

              <LightStatCard
                label="Gasto no Mês"
                :value="currentPersonTotalSpent"
                format="currency"
                value-color="warning"
                size="md"
                :secondary-stat="{
                  label: currentPersonTotalBudget > 0
                    ? `${((currentPersonTotalSpent / currentPersonTotalBudget) * 100).toFixed(0)}% usado`
                    : '',
                  value: ''
                }"
              />

              <LightStatCard
                label="Disponível"
                :value="currentPersonTotalBudget - currentPersonTotalSpent"
                format="currency"
                :value-color="currentPersonTotalBudget - currentPersonTotalSpent >= 0 ? 'success' : 'error'"
                size="md"
              />

              <LightStatCard
                label="Categorias Configuradas"
                :value="currentPersonCategoriesWithBudget"
                format="number"
                value-color="info"
                size="md"
                :secondary-stat="{ label: 'de ' + availableCategories.length + ' disponíveis', value: '' }"
              />
            </div>
          </section>

          <!-- Budget Configuration Cards - 3 per row with flex wrap -->
          <section>
            <div class="mb-6 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-normal text-gray-700">Orçamentos por Categoria</h2>
                <p class="text-sm text-gray-400 mt-1">Configure os orçamentos mensais para {{ selectedPerson }}</p>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar categoria..."
                class="px-4 py-3 text-sm bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all w-64"
              />
            </div>

            <!-- Empty State -->
            <EmptyState
              v-if="filteredCategories.length === 0"
              icon="🔍"
              :title="searchQuery ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria disponível'"
              :description="searchQuery ? 'Tente usar termos de busca diferentes.' : 'Não há categorias disponíveis para configurar orçamentos.'"
            />

            <!-- Categories Grid - 3 per row -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="category in filteredCategories"
                :key="category"
                class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <!-- Category Header -->
                <div class="flex items-center gap-3 mb-4">
                  <span class="text-2xl">{{ getCategoryIcon(category) }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-700 truncate">{{ category }}</p>
                  </div>
                </div>

                <!-- Budget Input -->
                <div class="mb-4">
                  <label class="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    Orçamento do Mês
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">R$</span>
                    <input
                      v-model.number="budgetInputs[category]"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      class="w-full pl-10 pr-3 py-3 text-base bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
                      @input="markAsChanged"
                    />
                  </div>
                </div>

                <!-- Historical Spending -->
                <div class="space-y-3 pt-4 border-t border-gray-100">
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Histórico de Gastos
                  </p>

                  <!-- Current Month -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-600">{{ getMonthLabel(0) }}</span>
                    <span class="text-sm font-semibold text-gray-900">
                      {{ formatCurrencyCompact(getCategorySpending(category, 0)) }}
                    </span>
                  </div>

                  <!-- Previous Month -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">{{ getMonthLabel(-1) }}</span>
                    <span class="text-sm font-medium text-gray-600">
                      {{ formatCurrencyCompact(getCategorySpending(category, -1)) }}
                    </span>
                  </div>

                  <!-- 2 Months Back -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-400">{{ getMonthLabel(-2) }}</span>
                    <span class="text-sm font-normal text-gray-500">
                      {{ formatCurrencyCompact(getCategorySpending(category, -2)) }}
                    </span>
                  </div>

                  <!-- Average -->
                  <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span class="text-xs text-gray-600 font-medium">Média 3 meses</span>
                    <span class="text-sm font-semibold text-blue-600">
                      {{ formatCurrencyCompact(getCategoryAverageSpending(category)) }}
                    </span>
                  </div>
                </div>

                <!-- Quick Set to Average Button -->
                <button
                  @click="setBudgetToAverage(category)"
                  class="w-full mt-4 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Usar média como orçamento
                </button>
              </div>
            </div>
          </section>

          <!-- Info Note -->
          <div class="bg-blue-50/30 rounded-xl px-6 py-5">
            <p class="text-sm text-gray-700 leading-relaxed">
              <span class="font-normal text-gray-800">Nota:</span> Apenas categorias de gastos são exibidas aqui. Categorias de sistema (contas bancárias, cartões de crédito, etc.) são automaticamente excluídas. Os valores históricos ajudam você a definir orçamentos mais realistas.
            </p>
          </div>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { BudgetsResponse, CategoriesResponse, BudgetInput, CategoryData } from '~/types/transaction'

// State
const loading = ref(false)
const saving = ref(false)
const copying = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const showSuccessAlert = ref(false)
const showErrorAlert = ref(false)
const searchQuery = ref('')
const hasChanges = ref(false)
const selectedPerson = ref<'Juliana' | 'Gabriel'>('Gabriel')

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
const budgetInputs = ref<Record<string, number>>({})

// Historical data for current month, -1 month, -2 months
const historicalData = ref<{
  current: CategoriesResponse | null
  previous: CategoriesResponse | null
  twoMonthsBack: CategoriesResponse | null
}>({
  current: null,
  previous: null,
  twoMonthsBack: null
})

// Excluded categories
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

const currentPersonTotalBudget = computed(() => {
  return Object.values(budgetInputs.value).reduce((sum, amount) => sum + (amount || 0), 0)
})

const currentPersonTotalSpent = computed(() => {
  if (!historicalData.value.current) return 0

  return historicalData.value.current.categories.reduce((sum, cat) => {
    return sum + cat.total
  }, 0)
})

const currentPersonCategoriesWithBudget = computed(() => {
  return Object.values(budgetInputs.value).filter(amount => amount && amount > 0).length
})

// Methods
const getMonthLabel = (offset: number): string => {
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  date.setMonth(date.getMonth() + offset)

  if (offset === 0) {
    return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + ' (atual)'
  }

  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
}

const getCategorySpending = (category: string, monthOffset: number): number => {
  let data: CategoriesResponse | null = null

  if (monthOffset === 0) {
    data = historicalData.value.current
  } else if (monthOffset === -1) {
    data = historicalData.value.previous
  } else if (monthOffset === -2) {
    data = historicalData.value.twoMonthsBack
  }

  if (!data) return 0

  const categoryData = data.categories.find(cat => cat.name === category)
  return categoryData?.total || 0
}

const getCategoryAverageSpending = (category: string): number => {
  const current = getCategorySpending(category, 0)
  const previous = getCategorySpending(category, -1)
  const twoMonthsBack = getCategorySpending(category, -2)

  return (current + previous + twoMonthsBack) / 3
}

const setBudgetToAverage = (category: string) => {
  const average = getCategoryAverageSpending(category)
  budgetInputs.value[category] = Math.round(average)
  markAsChanged()
}

const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase()

  if (name.includes('restaurante') || name.includes('comida') || name.includes('alimentação') ||
      name.includes('almoço') || name.includes('jantar') || name.includes('lanche') ||
      name.includes('food') || name.includes('restaurant')) return '🍽️'
  if (name.includes('mercado') || name.includes('supermercado') || name.includes('grocery')) return '🛒'
  if (name.includes('uber') || name.includes('taxi') || name.includes('transporte') ||
      name.includes('combustível') || name.includes('gasolina') || name.includes('transport')) return '🚗'
  if (name.includes('saúde') || name.includes('farmácia') || name.includes('médico') ||
      name.includes('hospital') || name.includes('health') || name.includes('pharmacy') || name.includes('medical')) return '⚕️'
  if (name.includes('educação') || name.includes('escola') || name.includes('curso') ||
      name.includes('livro') || name.includes('education')) return '📚'
  if (name.includes('aluguel') || name.includes('condomínio') || name.includes('casa') ||
      name.includes('rent') || name.includes('moradia')) return '🏠'
  if (name.includes('conta') || name.includes('luz') || name.includes('água') ||
      name.includes('internet') || name.includes('telefone') || name.includes('bill') ||
      name.includes('utilities')) return '📄'
  if (name.includes('cinema') || name.includes('streaming') || name.includes('netflix') ||
      name.includes('spotify') || name.includes('lazer') || name.includes('entertainment')) return '🎬'
  if (name.includes('roupa') || name.includes('vestuário') || name.includes('loja') ||
      name.includes('clothes') || name.includes('fashion')) return '👕'
  if (name.includes('tecnologia') || name.includes('eletrônico') || name.includes('tech') ||
      name.includes('computador') || name.includes('celular')) return '💻'
  if (name.includes('viagem') || name.includes('hotel') || name.includes('passagem') ||
      name.includes('travel') || name.includes('flight')) return '✈️'
  if (name.includes('pet') || name.includes('veterinário') || name.includes('animal')) return '🐾'
  if (name.includes('beleza') || name.includes('salão') || name.includes('cabelo') ||
      name.includes('beauty') || name.includes('cosmético')) return '💄'
  if (name.includes('academia') || name.includes('esporte') || name.includes('fitness') ||
      name.includes('gym')) return '💪'
  if (name.includes('pagamento') || name.includes('transferência') || name.includes('pix') ||
      name.includes('payment') || name.includes('transfer')) return '💳'
  if (name.includes('investimento') || name.includes('poupança') || name.includes('invest') ||
      name.includes('savings') || name.includes('investment')) return '📈'
  if (name.includes('bar') || name.includes('bebida') || name.includes('café') ||
      name.includes('drink') || name.includes('coffee')) return '☕'
  if (name.includes('presente') || name.includes('gift')) return '🎁'
  if (name.includes('installment') || name.includes('financing') ||
      name.includes('parcela') || name.includes('parcelamento')) return '📅'
  if (name.includes('business') || name.includes('tax') || name.includes('negócio')) return '💼'
  if (name.includes('insurance') || name.includes('seguro')) return '🛡️'
  if (name.includes('subscri') || name.includes('software') || name.includes('assinatura')) return '📱'

  return '💰'
}

const formatCurrencyCompact = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatMonthCompact = () => {
  if (!selectedMonth.value) return ''
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const markAsChanged = () => {
  hasChanges.value = true
  clearMessages()
}

const clearMessages = () => {
  errorMessage.value = null
  successMessage.value = null
  showErrorAlert.value = false
  showSuccessAlert.value = false
}

const getMonthDateRange = (monthOffset: number = 0) => {
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  date.setMonth(date.getMonth() + monthOffset)

  const targetYear = date.getFullYear()
  const targetMonth = date.getMonth() + 1

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
  const lastDay = new Date(targetYear, targetMonth, 0).getDate()
  const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { startDate, endDate }
}

const loadData = async () => {
  loading.value = true
  clearMessages()

  try {
    const [year, month] = selectedMonth.value.split('-')

    // Fetch all categories
    const categoriesResponse = await $fetch<CategoriesResponse>(`/api/categories`)

    const allCategories = categoriesResponse.categories
      .map(cat => cat.name)
      .filter(name => !EXCLUDED_CATEGORIES.some(excluded =>
        excluded.toLowerCase() === name.toLowerCase()
      ))
      .sort()

    availableCategories.value = allCategories

    // Fetch existing budgets for selected month
    const budgetsResponse = await $fetch<BudgetsResponse>(
      `/api/budgets?month=${month}&year=${year}`
    )

    // Initialize budget inputs for current person
    const inputs: Record<string, number> = {}

    for (const category of allCategories) {
      const personBudget = budgetsResponse.budgets.find(
        b => b.category === category && b.person === selectedPerson.value
      )

      inputs[category] = personBudget?.amount || 0
    }

    budgetInputs.value = inputs

    // Fetch historical spending data (current month, -1, -2)
    const currentRange = getMonthDateRange(0)
    const previousRange = getMonthDateRange(-1)
    const twoMonthsBackRange = getMonthDateRange(-2)

    const [currentData, previousData, twoMonthsBackData] = await Promise.all([
      $fetch<CategoriesResponse>(
        `/api/categories?person=${selectedPerson.value}&startDate=${currentRange.startDate}&endDate=${currentRange.endDate}`
      ),
      $fetch<CategoriesResponse>(
        `/api/categories?person=${selectedPerson.value}&startDate=${previousRange.startDate}&endDate=${previousRange.endDate}`
      ),
      $fetch<CategoriesResponse>(
        `/api/categories?person=${selectedPerson.value}&startDate=${twoMonthsBackRange.startDate}&endDate=${twoMonthsBackRange.endDate}`
      )
    ])

    historicalData.value = {
      current: currentData,
      previous: previousData,
      twoMonthsBack: twoMonthsBackData
    }

    hasChanges.value = false
  } catch (e: any) {
    errorMessage.value = e.data || 'Não foi possível carregar os dados. Tente novamente.'
    showErrorAlert.value = true
  } finally {
    loading.value = false
  }
}

const saveBudgets = async () => {
  saving.value = true
  clearMessages()

  try {
    const [year, month] = selectedMonth.value.split('-')

    const budgetsToSave: BudgetInput[] = []

    for (const category of availableCategories.value) {
      const amount = budgetInputs.value[category]

      if (amount && amount > 0) {
        budgetsToSave.push({
          category,
          person: selectedPerson.value,
          month: parseInt(month),
          year: parseInt(year),
          amount: amount,
        })
      }
    }

    if (budgetsToSave.length === 0) {
      errorMessage.value = 'Nenhum orçamento foi definido. Defina pelo menos um orçamento para salvar.'
      showErrorAlert.value = true
      return
    }

    await $fetch('/api/budgets', {
      method: 'POST',
      body: budgetsToSave,
    })

    successMessage.value = `${budgetsToSave.length} orçamento(s) de ${selectedPerson.value} salvos com sucesso!`
    showSuccessAlert.value = true
    hasChanges.value = false

    setTimeout(() => {
      loadData()
    }, 1000)
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.data || 'Não foi possível salvar os orçamentos. Tente novamente.'
    showErrorAlert.value = true
  } finally {
    saving.value = false
  }
}

const copyFromPreviousMonth = async () => {
  copying.value = true
  clearMessages()

  try {
    // Calculate previous month
    const [year, month] = selectedMonth.value.split('-')
    const currentDate = new Date(parseInt(year), parseInt(month) - 1)
    currentDate.setMonth(currentDate.getMonth() - 1)

    const previousYear = currentDate.getFullYear()
    const previousMonth = currentDate.getMonth() + 1

    // Fetch budgets from previous month for the current person
    const budgetsResponse = await $fetch<BudgetsResponse>(
      `/api/budgets?month=${previousMonth}&year=${previousYear}&person=${selectedPerson.value}`
    )

    if (budgetsResponse.budgets.length === 0) {
      errorMessage.value = `Não foram encontrados orçamentos de ${selectedPerson.value} para o mês anterior (${previousMonth.toString().padStart(2, '0')}/${previousYear}).`
      showErrorAlert.value = true
      return
    }

    // Copy values to current budget inputs
    let copiedCount = 0
    for (const budget of budgetsResponse.budgets) {
      if (availableCategories.value.includes(budget.category)) {
        budgetInputs.value[budget.category] = budget.amount
        copiedCount++
      }
    }

    successMessage.value = `${copiedCount} orçamento(s) copiado(s) do mês ${previousMonth.toString().padStart(2, '0')}/${previousYear}. Lembre-se de salvar as alterações!`
    showSuccessAlert.value = true
    markAsChanged()
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.data || 'Não foi possível copiar os orçamentos do mês anterior. Tente novamente.'
    showErrorAlert.value = true
  } finally {
    copying.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})

watch(selectedMonth, () => {
  if (hasChanges.value) {
    if (confirm('Você tem alterações não salvas. Deseja realmente mudar o período sem salvar?')) {
      loadData()
    }
  } else {
    loadData()
  }
})

watch(selectedPerson, () => {
  if (hasChanges.value) {
    if (confirm('Você tem alterações não salvas. Deseja realmente mudar de pessoa sem salvar?')) {
      loadData()
    }
  } else {
    loadData()
  }
})
</script>
