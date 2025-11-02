<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] text-gray-800 min-h-screen">
      <!-- Header - Clean, sem bordas pesadas -->
      <header class="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-gray-100">
        <div class="flex items-baseline gap-4">
          <h1 class="text-2xl font-normal tracking-tight text-gray-800">Orçamento</h1>
        </div>
        <div class="flex items-center gap-3">
          <BaseButton size="sm" variant="secondary" @click="loadData" :loading="loading">
            Atualizar
          </BaseButton>
          <BaseButton size="sm" @click="saveBudgets" :loading="saving" :disabled="!hasChanges">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </BaseButton>
        </div>
      </header>

      <!-- Month Selector & Messages - Light Design -->
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
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-8 space-y-8">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando orçamentos..." />

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards - 3 COLUNAS principais -->
          <section>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LightStatCard
                label="Total Orçado"
                :value="totalBudget"
                format="currency"
                value-color="primary"
                size="lg"
                :secondary-stat="{ label: formatMonthCompact(), value: '' }"
              />

              <LightStatCard
                label="Juliana"
                :value="totalBudgetJuliana"
                format="currency"
                value-color="info"
                size="lg"
                :secondary-stat="{ label: categoriesWithBudgetJuliana + ' categorias', value: '' }"
              />

              <LightStatCard
                label="Gabriel"
                :value="totalBudgetGabriel"
                format="currency"
                value-color="success"
                size="lg"
                :secondary-stat="{ label: categoriesWithBudgetGabriel + ' categorias', value: '' }"
              />
            </div>

            <!-- Secondary stats - 2 colunas -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <LightStatCard
                label="Categorias Configuradas"
                :value="categoriesWithBudget"
                format="number"
                value-color="warning"
                size="md"
                :secondary-stat="{ label: 'de ' + availableCategories.length + ' disponíveis', value: '' }"
              />

              <LightStatCard
                label="Média por Categoria"
                :value="categoriesWithBudget > 0 ? totalBudget / categoriesWithBudget : 0"
                format="currency"
                value-color="default"
                size="md"
              />
            </div>
          </section>

          <!-- Budget Configuration - Light Design com scroll interno -->
          <section class="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col" style="max-height: calc(100vh - 480px); min-height: 500px;">
            <!-- Header with Search -->
            <div class="px-6 py-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-shrink-0">
              <div>
                <h2 class="text-lg font-normal text-gray-700">Orçamentos por Categoria</h2>
                <p class="text-sm text-gray-400 mt-1">Configure os orçamentos mensais</p>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar categoria..."
                class="px-4 py-3 text-sm bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all lg:w-64"
              />
            </div>

            <!-- Desktop Table Header -->
            <div class="hidden lg:block px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
              <div class="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div class="col-span-5">Categoria</div>
                <div class="col-span-3 text-center">Juliana</div>
                <div class="col-span-3 text-center">Gabriel</div>
                <div class="col-span-1 text-center">Total</div>
              </div>
            </div>

            <!-- Categories List - Scroll interno -->
            <div class="divide-y divide-gray-100 overflow-y-auto flex-1">
              <div
                v-for="category in filteredCategories"
                :key="category"
                class="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <!-- Desktop Layout - Light Design -->
                <div class="hidden lg:grid grid-cols-12 gap-4 items-center">
                  <!-- Category Name -->
                  <div class="col-span-5 flex items-center gap-3">
                    <span class="text-lg">{{ getCategoryIcon(category) }}</span>
                    <p class="text-sm font-normal text-gray-700 truncate">{{ category }}</p>
                  </div>

                  <!-- Juliana Input - Neutral colors -->
                  <div class="col-span-3">
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">R$</span>
                      <input
                        v-model.number="budgetInputsJuliana[category]"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        class="w-full pl-10 pr-3 py-2.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
                        @input="markAsChanged"
                      />
                    </div>
                  </div>

                  <!-- Gabriel Input - Neutral colors -->
                  <div class="col-span-3">
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">R$</span>
                      <input
                        v-model.number="budgetInputsGabriel[category]"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        class="w-full pl-10 pr-3 py-2.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
                        @input="markAsChanged"
                      />
                    </div>
                  </div>

                  <!-- Total -->
                  <div class="col-span-1 text-center">
                    <span class="text-sm font-light text-gray-700">
                      {{ formatCurrencyShort(getCategoryTotal(category)) }}
                    </span>
                  </div>
                </div>

                <!-- Mobile Layout - Light Design -->
                <div class="lg:hidden space-y-3">
                  <!-- Category Header -->
                  <div class="flex items-center gap-3">
                    <span class="text-lg">{{ getCategoryIcon(category) }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-normal text-gray-700 truncate">{{ category }}</p>
                      <p v-if="getCategoryTotal(category) > 0" class="text-xs text-gray-400">
                        Total: {{ formatCurrencyShort(getCategoryTotal(category)) }}
                      </p>
                    </div>
                  </div>

                  <!-- Budget Inputs -->
                  <div class="grid grid-cols-2 gap-3">
                    <!-- Juliana Input - Neutral -->
                    <div>
                      <label class="block text-xs font-normal text-gray-600 mb-2">Juliana</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">R$</span>
                        <input
                          v-model.number="budgetInputsJuliana[category]"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          class="w-full pl-10 pr-3 py-2.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
                          @input="markAsChanged"
                        />
                      </div>
                    </div>

                    <!-- Gabriel Input - Neutral -->
                    <div>
                      <label class="block text-xs font-normal text-gray-600 mb-2">Gabriel</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">R$</span>
                        <input
                          v-model.number="budgetInputsGabriel[category]"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          class="w-full pl-10 pr-3 py-2.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
                          @input="markAsChanged"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <EmptyState
              v-if="filteredCategories.length === 0"
              icon="🔍"
              :title="searchQuery ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria disponível'"
              :description="searchQuery ? 'Tente usar termos de busca diferentes.' : 'Não há categorias disponíveis para configurar orçamentos.'"
            />
          </section>

          <!-- Info Note - Light Design -->
          <div class="bg-blue-50/30 rounded-xl px-6 py-5">
            <p class="text-sm text-gray-700 leading-relaxed">
              <span class="font-normal text-gray-800">Nota:</span> Apenas categorias de gastos são exibidas aqui. Categorias de sistema (contas bancárias, cartões de crédito, etc.) são automaticamente excluídas.
            </p>
          </div>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { BudgetsResponse, CategoriesResponse, BudgetInput } from '~/types/transaction'

// Composables

// State
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const showSuccessAlert = ref(false)
const showErrorAlert = ref(false)
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

    // Fetch existing budgets
    const budgetsResponse = await $fetch<BudgetsResponse>(
      `/api/budgets?month=${month}&year=${year}`
    )

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
      showErrorAlert.value = true
      return
    }

    await $fetch('/api/budgets', {
      method: 'POST',
      body: budgetsToSave,
    })

    successMessage.value = `${budgetsToSave.length} orçamento(s) salvos com sucesso!`
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
</script>
