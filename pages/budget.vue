<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Header -->
      <header class="h-[72px] px-4 sm:px-6 lg:px-10 flex items-center justify-between border-b border-border-base">
        <div class="min-w-0 flex-1 flex items-center gap-3">
          <!-- Mobile Menu Button -->
          <button
            @click="toggleMobileMenu"
            class="lg:hidden p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          
          <div class="min-w-0 flex-1">
            <h1 class="text-18 sm:text-20 lg:text-22 font-medium tracking-tight truncate">Configuração de Orçamento</h1>
            <p class="text-13 text-text-secondary mt-0.5 leading-normal hidden sm:block">Defina orçamentos mensais separados para Juliana e Gabriel</p>
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <button
            @click="loadData"
            :disabled="loading"
            class="px-3 py-2 sm:px-[18px] sm:py-[10px] bg-background-section hover:bg-background-hover text-text-primary rounded-md transition-all duration-200 ease-out font-medium text-13 sm:text-15 disabled:opacity-40 disabled:cursor-not-allowed border border-border-base"
          >
            <span class="hidden sm:inline">{{ loading ? 'Carregando...' : 'Atualizar' }}</span>
            <span class="sm:hidden">🔄</span>
          </button>
          <button
            @click="saveBudgets"
            :disabled="saving || !hasChanges"
            class="px-3 py-2 sm:px-[18px] sm:py-[10px] bg-accent-success hover:bg-accent-success/90 text-text-inverse rounded-md transition-all duration-200 ease-out font-medium text-13 sm:text-15 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <span class="hidden sm:inline">{{ saving ? 'Salvando...' : 'Salvar Orçamentos' }}</span>
            <span class="sm:hidden">💾</span>
          </button>
        </div>
      </header>

      <!-- Month Selector & Messages -->
      <div class="px-4 sm:px-6 lg:px-10 py-4 border-b border-border-base space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <label class="text-13 font-medium text-text-secondary whitespace-nowrap">
            Período:
          </label>
          <input
            v-model="selectedMonth"
            type="month"
            class="px-3 sm:px-4 py-2 text-14 sm:text-15 bg-background-input text-text-primary border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-accent-info transition-all"
          />
          <span class="text-13 text-text-muted">{{ formattedMonth }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="border-l-[3px] border-accent-success bg-background-card p-3 sm:p-4 rounded-lg">
          <p class="text-text-primary text-14 sm:text-15 font-medium">{{ successMessage }}</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="border-l-[3px] border-accent-danger bg-background-card p-3 sm:p-4 rounded-lg">
          <p class="text-text-primary text-14 sm:text-15 font-medium">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Content -->
      <main class="max-w-[1280px] px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-8 lg:space-y-12">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
          <p class="mt-4 text-text-secondary text-15">Carregando dados...</p>
        </div>

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards -->
          <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Orçamento Juliana
              </p>
              <p class="text-[24px] sm:text-[28px] lg:text-[32px] font-normal font-serif text-accent-info break-all">
                {{ formatCurrency(totalBudgetJuliana) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">{{ categoriesWithBudgetJuliana }} categorias</p>
            </div>

            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Orçamento Gabriel
              </p>
              <p class="text-[24px] sm:text-[28px] lg:text-[32px] font-normal font-serif text-accent-primary tracking-tight break-all">
                {{ formatCurrency(totalBudgetGabriel) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">{{ categoriesWithBudgetGabriel }} categorias</p>
            </div>

            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Orçamento Total
              </p>
              <p class="text-[24px] sm:text-[28px] lg:text-[32px] font-normal font-serif text-accent-success tracking-tight break-all">
                {{ formatCurrency(totalBudget) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Para {{ formattedMonth }}</p>
            </div>

            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Categorias Config.
              </p>
              <p class="text-[24px] sm:text-[28px] lg:text-[32px] font-normal font-serif text-accent-warning">
                {{ categoriesWithBudget }}
              </p>
              <p class="text-text-muted text-13 leading-normal">de {{ availableCategories.length }} categorias</p>
            </div>
          </section>

          <!-- Budget Configuration -->
          <section class="bg-background-card border border-border-base rounded-lg overflow-hidden">
            <!-- Header with Search -->
            <div class="px-4 sm:px-6 py-4 bg-background-section border-b border-border-base flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 class="text-15 sm:text-16 font-medium text-text-primary tracking-tight">Orçamentos por Categoria</h2>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar categoria..."
                class="px-3 sm:px-4 py-2 text-14 sm:text-15 bg-background-input text-text-primary border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-accent-info transition-all w-full sm:w-64"
              />
            </div>

            <!-- Desktop Table Header -->
            <div class="hidden lg:block px-6 py-3 bg-background-section border-b border-border-base">
              <div class="grid grid-cols-12 gap-4 items-center text-13 font-medium text-text-secondary uppercase tracking-wide">
                <div class="col-span-5">Categoria</div>
                <div class="col-span-3 text-center">Juliana</div>
                <div class="col-span-3 text-center">Gabriel</div>
                <div class="col-span-1 text-center">Total</div>
              </div>
            </div>

            <!-- Mobile Header -->
            <div class="lg:hidden px-4 py-3 bg-background-section border-b border-border-base">
              <p class="text-13 font-medium text-text-secondary uppercase tracking-wide">Configure os orçamentos</p>
            </div>

            <!-- Categories List -->
            <div class="divide-y divide-border-base">
              <div
                v-for="category in filteredCategories"
                :key="category"
                class="px-4 sm:px-6 py-4 hover:bg-background-hover transition-colors"
              >
                <!-- Desktop Layout -->
                <div class="hidden lg:grid grid-cols-12 gap-4 items-center">
                  <!-- Category Name -->
                  <div class="col-span-5 flex items-center gap-3">
                    <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-background-section border border-border-base">
                      <span class="text-xl">{{ getCategoryIcon(category) }}</span>
                    </div>
                    <p class="text-15 font-medium text-text-primary truncate">{{ category }}</p>
                  </div>

                  <!-- Juliana Input -->
                  <div class="col-span-3">
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted text-13">R$</span>
                      <input
                        v-model.number="budgetInputsJuliana[category]"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        class="w-full pl-10 pr-3 py-2 text-15 bg-background-input text-text-primary border border-accent-info/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-info transition-all"
                        @input="markAsChanged"
                      />
                    </div>
                  </div>

                  <!-- Gabriel Input -->
                  <div class="col-span-3">
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted text-13">R$</span>
                      <input
                        v-model.number="budgetInputsGabriel[category]"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        class="w-full pl-10 pr-3 py-2 text-15 bg-background-input text-text-primary border border-accent-primary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all"
                        @input="markAsChanged"
                      />
                    </div>
                  </div>

                  <!-- Total -->
                  <div class="col-span-1 text-center">
                    <span class="text-13 font-semibold text-text-primary">
                      {{ formatCurrencyShort(getCategoryTotal(category)) }}
                    </span>
                  </div>
                </div>

                <!-- Mobile Layout -->
                <div class="lg:hidden space-y-4">
                  <!-- Category Header -->
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-background-section border border-border-base">
                      <span class="text-lg">{{ getCategoryIcon(category) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-15 font-medium text-text-primary truncate">{{ category }}</p>
                      <p v-if="getCategoryTotal(category) > 0" class="text-13 text-text-muted">
                        Total: {{ formatCurrencyShort(getCategoryTotal(category)) }}
                      </p>
                    </div>
                  </div>

                  <!-- Budget Inputs -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <!-- Juliana Input -->
                    <div>
                      <label class="block text-12 font-medium text-accent-info mb-1">Juliana</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted text-13">R$</span>
                        <input
                          v-model.number="budgetInputsJuliana[category]"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          class="w-full pl-10 pr-3 py-2 text-15 bg-background-input text-text-primary border border-accent-info/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-info transition-all"
                          @input="markAsChanged"
                        />
                      </div>
                    </div>

                    <!-- Gabriel Input -->
                    <div>
                      <label class="block text-12 font-medium text-accent-primary mb-1">Gabriel</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted text-13">R$</span>
                        <input
                          v-model.number="budgetInputsGabriel[category]"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          class="w-full pl-10 pr-3 py-2 text-15 bg-background-input text-text-primary border border-accent-primary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all"
                          @input="markAsChanged"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredCategories.length === 0" class="text-center py-12">
              <p class="text-text-secondary text-15">
                {{ searchQuery ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria disponível' }}
              </p>
            </div>
          </section>

          <!-- Info Note -->
          <div class="border-l-[3px] border-accent-info bg-background-card p-4 sm:p-5 rounded-lg">
            <p class="text-14 sm:text-15 text-text-primary leading-normal">
              <strong>Nota:</strong> Apenas categorias de gastos são exibidas aqui. Categorias de sistema (contas bancárias, cartões de crédito, etc.) são automaticamente excluídas.
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
const { toggleMobileMenu } = useMobileMenu()

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
      return
    }

    await $fetch('/api/budgets', {
      method: 'POST',
      body: budgetsToSave,
    })

    successMessage.value = `${budgetsToSave.length} orçamento(s) salvos com sucesso!`
    hasChanges.value = false

    setTimeout(() => {
      loadData()
    }, 1000)
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.data || 'Não foi possível salvar os orçamentos. Tente novamente.'
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
