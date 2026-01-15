<template>
  <Sidemenu>
    <div class="bg-gray-50 min-h-screen">
      <!-- Header -->
      <header class="h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold text-gray-900">Categorias</h1>
          <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="ghost" @click="refreshCacheAndData" :loading="loading || refreshing">
          {{ refreshing ? 'Atualizando...' : 'Atualizar' }}
        </BaseButton>
      </header>

      <!-- Month Filter -->
      <div class="px-6 py-4 bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto flex items-center gap-4">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Mês
          </label>
          <input
            v-model="selectedMonth"
            type="month"
            class="px-3 py-2 bg-white text-gray-900 text-sm rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
          <span class="text-sm text-gray-500 ml-2">{{ formattedMonth }}</span>
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
          <!-- Summary Cards - Layout mais compacto -->
          <section>
            <div class="grid grid-cols-2 gap-3">
              <LightStatCard
                label="Fixos"
                :value="custosFixosTotal"
                format="currency"
                value-color="neutral"
                size="sm"
                icon="📌"
                :secondary-stat="{ label: custosFixosCategoriesCount + ' categorias', value: '' }"
              />

              <LightStatCard
                label="Comprometidos"
                :value="gastosComprometidosTotal"
                format="currency"
                value-color="warning"
                size="sm"
                icon="📅"
                :secondary-stat="{ label: gastosComprometidosCategoriesCount + ' categorias', value: '' }"
              />
            </div>
          </section>

          <!-- Total Budget Progress Bar -->
          <section v-if="totalBudget > 0" class="bg-white rounded-xl p-6 shadow-sm">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-base font-normal text-gray-700">Orçamento Total</h2>
                  <p class="text-xs text-gray-400 mt-0.5">{{ categoriesWithBudget.length }} categorias orçadas</p>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ formatCurrencyCompact(totalUsed) }}
                  </p>
                  <p class="text-xs text-gray-400">
                    de {{ formatCurrencyCompact(totalBudget) }}
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">Progresso geral</span>
                  <span class="font-semibold" :class="getBudgetTextColor(totalBudgetPercentage)">
                    {{ totalBudgetPercentage.toFixed(1) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="getBudgetProgressColor(totalBudgetPercentage)"
                    :style="{ width: `${Math.min(totalBudgetPercentage, 100)}%` }"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-400">Restante:</span>
                  <span class="font-semibold" :class="totalBudgetRemaining >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                    {{ formatCurrencyCompact(totalBudgetRemaining) }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Categories List - Grid Layout (3 per row) -->
          <section>
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-base font-normal text-gray-700">Gastos por Categoria</h2>
                <p class="text-xs text-gray-400 mt-0.5">{{ categories.length }} categorias</p>
              </div>
            </div>

            <!-- Empty State -->
            <EmptyState
              v-if="categories.length === 0"
              icon="📊"
              title="Nenhuma transação"
              description="Selecione outro período."
            />

            <!-- Categories Grid - 3 per row -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="category in categories"
                :key="category.name"
                class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                @click="toggleCategory(category.name)"
              >
                <!-- MOBILE VERSION - Simplified (icon, title, remaining) -->
                <div class="md:hidden p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <span class="text-3xl">{{ getCategoryIcon(category.name) }}</span>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-gray-700 truncate">{{ category.name }}</p>
                      </div>
                    </div>
                    <div class="text-right ml-3">
                      <template v-if="category.budget">
                        <p class="text-lg font-semibold" :class="category.budget.remaining >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                          {{ formatCurrencyCompact(category.budget.remaining) }}
                        </p>
                      </template>
                      <template v-else>
                        <p class="text-lg font-semibold text-gray-900">
                          {{ formatCurrencyCompact(category.total) }}
                        </p>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- DESKTOP VERSION - Full details -->
                <div class="hidden md:block p-5">
                  <!-- Category Header -->
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <span class="text-2xl">{{ getCategoryIcon(category.name) }}</span>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-gray-700 truncate">{{ category.name }}</p>
                        <p class="text-xs text-gray-400 mt-0.5">{{ category.count }} transações</p>
                      </div>
                    </div>
                    <svg
                      class="h-4 w-4 text-gray-400 transition-transform duration-150 flex-shrink-0 mt-1"
                      :class="{ 'rotate-90': expandedCategory === category.name }"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  <!-- Available Amount (Highlighted) -->
                  <div class="mb-3">
                    <template v-if="category.budget">
                      <p class="text-2xl font-semibold" :class="category.budget.remaining >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                        {{ formatCurrencyCompact(category.budget.remaining) }}
                      </p>
                      <p class="text-xs text-gray-400 mt-0.5">
                        {{ category.budget.remaining >= 0 ? 'disponível' : 'excedido' }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        {{ formatCurrencyCompact(category.total) }} gastos de {{ formatCurrencyCompact(category.budget.total) }}
                      </p>
                    </template>
                    <template v-else>
                      <p class="text-2xl font-semibold text-gray-900">
                        {{ formatCurrencyCompact(category.total) }}
                      </p>
                      <p class="text-xs text-gray-400 italic mt-0.5">
                        Sem orçamento
                      </p>
                    </template>
                  </div>

                  <!-- Budget Progress -->
                  <template v-if="category.budget">
                    <div class="space-y-2">
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-gray-400">Utilizado</span>
                        <span class="font-semibold" :class="getBudgetTextColor(category.budget.percentageUsed)">
                          {{ category.budget.percentageUsed.toFixed(0) }}%
                        </span>
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          class="h-1.5 rounded-full transition-all"
                          :class="getBudgetProgressColor(category.budget.percentageUsed)"
                          :style="{ width: `${Math.min(category.budget.percentageUsed, 100)}%` }"
                        ></div>
                      </div>
                    </div>
                  </template>

                  <!-- Expanded Transactions -->
                  <div v-if="expandedCategory === category.name" class="mt-4 pt-4 border-t border-gray-100">
                    <h4 class="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                      Transações ({{ getCategoryTransactions(category.name).length }})
                    </h4>
                    <div class="space-y-3 max-h-48 overflow-y-auto">
                      <div
                        v-for="transaction in getCategoryTransactions(category.name)"
                        :key="transaction.transactionId"
                        class="pb-3 border-b border-gray-100 last:border-0"
                      >
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-700 truncate">{{ transaction.description }}</p>
                            <div class="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span>{{ formatDateCompact(transaction.date) }}</span>
                              <span>•</span>
                              <span class="truncate">{{ transaction.origin }}</span>
                            </div>
                          </div>
                          <p class="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {{ formatCurrencyCompact(transaction.amount) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
import type { CategoriesResponse } from '~/types/transaction'
import type { CacheRefreshResponse } from '~/types/cache'

// Composables
const { selectedPerson } = usePersonFilter()
const { fetchCacheStatus } = useCacheStatus()

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// Local state
const selectedMonth = ref(getCurrentMonth())
const expandedCategory = ref<string | null>(null)
const refreshing = ref(false)

// Build query object for API
const queryObject = computed(() => {
  const query: Record<string, string> = {}

  if (selectedPerson.value !== 'Ambos') {
    query.person = selectedPerson.value
  }

  const [year, month] = selectedMonth.value.split('-')
  const startDate = `${year}-${month}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

  query.startDate = startDate
  query.endDate = endDate
  query.includeTransactions = 'true'

  return query
})

// Use useAsyncData for SSR support
const {
  data: categoriesData,
  status,
  error: fetchError,
  refresh: refreshData
} = useAsyncData<CategoriesResponse>(
  'categories',
  () => $fetch<CategoriesResponse>('/api/categories', { query: queryObject.value }),
  {
    default: () => null,
    watch: [queryObject],
    immediate: true
  }
)

// Computed states
const loading = computed(() => status.value === 'pending')
const error = computed(() => fetchError.value?.message || null)

// Custom category order
const CATEGORY_ORDER = [
  'Food',
  'Supermarket',
  'Transportation',
  'Entertainment',
  'Subscriptions/Softwares',
  'Home & Maintenance',
  'Medical',
  'Personal care',
  'Pets',
  'Variable Expenses',
  'Clothing',
  'Education',
  'Utilities',
  'Gifts & Donations',
  'Taxes Due',
  'Business & Taxes',
  'Financing',
  'Insurance',
  'Rent',
  'Kids',
  'Cleaning Services'
]

// Computed
const categories = computed(() => {
  const cats = categoriesData.value?.categories || []

  // Sort by custom order
  return [...cats].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.name)
    const bIndex = CATEGORY_ORDER.indexOf(b.name)

    // If both are in the custom order, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    // If only 'a' is in custom order, it comes first
    if (aIndex !== -1) return -1

    // If only 'b' is in custom order, it comes first
    if (bIndex !== -1) return 1

    // If neither is in custom order, sort alphabetically
    return a.name.localeCompare(b.name)
  })
})
const totalAmount = computed(() => categoriesData.value?.totals.total || 0)
const totalTransactions = computed(() => categories.value.reduce((sum, cat) => sum + cat.count, 0))

const variableCostsTotal = computed(() => categoriesData.value?.totals.variableCosts || 0)
const custosFixosTotal = computed(() => categoriesData.value?.totals.fixedCosts || 0)
const gastosComprometidosTotal = computed(() => categoriesData.value?.totals.committedExpenses || 0)

const custosFixosCategoriesCount = computed(() => categoriesData.value?.totals.categoryCounts.fixedCosts || 0)
const gastosComprometidosCategoriesCount = computed(() => categoriesData.value?.totals.categoryCounts.committedExpenses || 0)

const formattedMonth = computed(() => {
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
})

// Total Budget calculations
const categoriesWithBudget = computed(() => categories.value.filter(cat => cat.budget))

const totalBudget = computed(() => {
  return categoriesWithBudget.value.reduce((sum, cat) => sum + (cat.budget?.total || 0), 0)
})

const totalUsed = computed(() => {
  return categoriesWithBudget.value.reduce((sum, cat) => sum + cat.total, 0)
})

const totalBudgetPercentage = computed(() => {
  if (totalBudget.value === 0) return 0
  return (totalUsed.value / totalBudget.value) * 100
})

const totalBudgetRemaining = computed(() => {
  return totalBudget.value - totalUsed.value
})

// Category icon mapping - each category gets unique icon
const categoryIconMap = new Map<string, string>()

// Methods
const getCategoryIcon = (categoryName: string): string => {
  // Check if we already mapped this category
  if (categoryIconMap.has(categoryName)) {
    return categoryIconMap.get(categoryName)!
  }

  const name = categoryName.toLowerCase()

  // Icon patterns ordered by priority (more specific first)
  const iconPatterns = [
    // Food & Dining
    { patterns: ['netflix', 'spotify', 'streaming'], icon: '🎬' },
    { patterns: ['uber', 'taxi', '99'], icon: '🚕' },
    { patterns: ['ifood', 'delivery'], icon: '🛵' },
    { patterns: ['restaurante', 'restaurant'], icon: '🍽️' },
    { patterns: ['mercado', 'supermercado', 'grocery'], icon: '🛒' },
    { patterns: ['padaria', 'bakery'], icon: '🥖' },
    { patterns: ['bar', 'bebida', 'drink'], icon: '🍺' },
    { patterns: ['café', 'coffee'], icon: '☕' },
    { patterns: ['lanche', 'snack'], icon: '🍕' },
    { patterns: ['comida', 'food', 'alimentação'], icon: '🍴' },
    { patterns: ['jantar', 'dinner'], icon: '🌙' },
    { patterns: ['almoço', 'lunch'], icon: '🌞' },

    // Transportation
    { patterns: ['combustível', 'gasolina', 'fuel', 'gas'], icon: '⛽' },
    { patterns: ['transporte', 'transport'], icon: '🚗' },
    { patterns: ['estacionamento', 'parking'], icon: '🅿️' },
    { patterns: ['passagem', 'ticket'], icon: '🎫' },
    { patterns: ['pedágio', 'toll'], icon: '🛣️' },

    // Health & Wellness
    { patterns: ['farmácia', 'pharmacy'], icon: '💊' },
    { patterns: ['médico', 'doctor', 'consulta'], icon: '👨‍⚕️' },
    { patterns: ['hospital', 'clínica', 'clinic'], icon: '🏥' },
    { patterns: ['dentista', 'dental'], icon: '🦷' },
    { patterns: ['saúde', 'health'], icon: '⚕️' },
    { patterns: ['academia', 'gym'], icon: '💪' },
    { patterns: ['esporte', 'sport'], icon: '⚽' },
    { patterns: ['fitness'], icon: '🏃' },

    // Education
    { patterns: ['escola', 'school'], icon: '🏫' },
    { patterns: ['curso', 'course'], icon: '🎓' },
    { patterns: ['livro', 'book'], icon: '📚' },
    { patterns: ['educação', 'education'], icon: '📖' },
    { patterns: ['material escolar'], icon: '✏️' },

    // Housing
    { patterns: ['aluguel', 'rent'], icon: '🏠' },
    { patterns: ['condomínio'], icon: '🏢' },
    { patterns: ['casa', 'home'], icon: '🏡' },
    { patterns: ['moradia', 'housing'], icon: '🏘️' },
    { patterns: ['móveis', 'furniture'], icon: '🛋️' },

    // Utilities & Bills
    { patterns: ['luz', 'eletricidade', 'electric'], icon: '💡' },
    { patterns: ['água', 'water'], icon: '💧' },
    { patterns: ['internet'], icon: '📡' },
    { patterns: ['telefone', 'phone', 'celular'], icon: '📱' },
    { patterns: ['gás', 'gas'], icon: '🔥' },
    { patterns: ['conta', 'bill'], icon: '📄' },

    // Entertainment
    { patterns: ['cinema', 'movie'], icon: '🎥' },
    { patterns: ['lazer', 'leisure'], icon: '🎪' },
    { patterns: ['entertainment'], icon: '🎭' },
    { patterns: ['jogo', 'game'], icon: '🎮' },
    { patterns: ['música', 'music'], icon: '🎵' },

    // Shopping
    { patterns: ['roupa', 'clothes'], icon: '👕' },
    { patterns: ['vestuário', 'fashion'], icon: '👔' },
    { patterns: ['sapato', 'shoe'], icon: '👟' },
    { patterns: ['loja', 'shop', 'store'], icon: '🏪' },
    { patterns: ['shopping', 'mall'], icon: '🛍️' },

    // Technology
    { patterns: ['computador', 'computer'], icon: '💻' },
    { patterns: ['tecnologia', 'tech'], icon: '⚙️' },
    { patterns: ['eletrônico', 'electronic'], icon: '🔌' },
    { patterns: ['software', 'app'], icon: '📲' },

    // Travel
    { patterns: ['hotel', 'hospedagem'], icon: '🏨' },
    { patterns: ['viagem', 'travel'], icon: '✈️' },
    { patterns: ['flight', 'voo'], icon: '🛫' },
    { patterns: ['turismo', 'tourism'], icon: '🗺️' },

    // Pets
    { patterns: ['veterinário', 'vet'], icon: '👨‍⚕️' },
    { patterns: ['pet', 'animal'], icon: '🐾' },
    { patterns: ['ração', 'pet food'], icon: '🦴' },

    // Beauty & Personal Care
    { patterns: ['salão', 'salon'], icon: '💇' },
    { patterns: ['cabelo', 'hair'], icon: '💇‍♀️' },
    { patterns: ['beleza', 'beauty'], icon: '💄' },
    { patterns: ['cosmético', 'cosmetic'], icon: '💅' },
    { patterns: ['perfume'], icon: '🌸' },

    // Finance
    { patterns: ['pix'], icon: '💸' },
    { patterns: ['transferência', 'transfer'], icon: '💳' },
    { patterns: ['pagamento', 'payment'], icon: '💰' },
    { patterns: ['investimento', 'invest'], icon: '📈' },
    { patterns: ['poupança', 'savings'], icon: '🏦' },
    { patterns: ['installment', 'financing', 'parcela', 'parcelamento'], icon: '📅' },
    { patterns: ['empréstimo', 'loan'], icon: '💵' },
    { patterns: ['taxa', 'fee'], icon: '🧾' },
    { patterns: ['seguro', 'insurance'], icon: '🛡️' },
    { patterns: ['imposto', 'tax'], icon: '📊' },

    // Gifts & Special
    { patterns: ['presente', 'gift'], icon: '🎁' },
    { patterns: ['doação', 'donation'], icon: '❤️' },
    { patterns: ['caridade', 'charity'], icon: '🤝' },

    // Work & Business
    { patterns: ['negócio', 'business'], icon: '💼' },
    { patterns: ['escritório', 'office'], icon: '🏢' },
    { patterns: ['trabalho', 'work'], icon: '👔' },

    // Miscellaneous
    { patterns: ['outros', 'other', 'diversos'], icon: '📦' },
    { patterns: ['emergência', 'emergency'], icon: '🚨' },
    { patterns: ['manutenção', 'maintenance'], icon: '🔧' },
    { patterns: ['jardinagem', 'garden'], icon: '🌱' },
    { patterns: ['limpeza', 'cleaning'], icon: '🧹' },
  ]

  // Find matching icon
  for (const { patterns, icon } of iconPatterns) {
    if (patterns.some(pattern => name.includes(pattern))) {
      // Check if icon is already used by another category
      const usedIcons = Array.from(categoryIconMap.values())
      if (!usedIcons.includes(icon)) {
        categoryIconMap.set(categoryName, icon)
        return icon
      }
    }
  }

  // Fallback: generate unique icon from pool
  const fallbackIcons = [
    '🌟', '🎯', '🎨', '🔑', '🌈', '🎪', '🎲', '🎰', '🧩', '🎭',
    '🎪', '🎨', '🎯', '🔮', '💎', '🏆', '🎖️', '🏅', '🥇', '🥈',
    '🥉', '🎃', '🎄', '🎆', '🎇', '✨', '🎉', '🎊', '🎈', '🎀',
    '🎗️', '🏵️', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌸', '💮',
    '🏮', '🪔', '🧧', '🎐', '🧿', '🪬', '🛎️', '🔔', '🔕', '📯'
  ]

  const usedIcons = Array.from(categoryIconMap.values())
  const availableIcon = fallbackIcons.find(icon => !usedIcons.includes(icon))

  const finalIcon = availableIcon || '💠'
  categoryIconMap.set(categoryName, finalIcon)
  return finalIcon
}

const formatCurrencyCompact = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatDateCompact = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return dateString
  }
}

const toggleCategory = (categoryName: string) => {
  expandedCategory.value = expandedCategory.value === categoryName ? null : categoryName
}

const getCategoryTransactions = (categoryName: string) => {
  const category = categories.value.find(cat => cat.name === categoryName)
  return category?.transactions || []
}

const getBudgetProgressColor = (percentageUsed: number): string => {
  if (percentageUsed >= 100) return 'bg-gradient-to-r from-rose-400 to-rose-500'
  if (percentageUsed >= 90) return 'bg-gradient-to-r from-amber-400 to-amber-500'
  if (percentageUsed >= 75) return 'bg-gradient-to-r from-blue-400 to-blue-500'
  return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
}

const getBudgetTextColor = (percentageUsed: number): string => {
  if (percentageUsed >= 100) return 'text-rose-400'
  if (percentageUsed >= 90) return 'text-amber-500'
  if (percentageUsed >= 75) return 'text-blue-500'
  return 'text-emerald-500'
}

// Refresh cache and reload data
const refreshCacheAndData = async () => {
  refreshing.value = true

  try {
    // First, refresh the cache
    const cacheResponse = await $fetch<CacheRefreshResponse>('/api/cache/refresh', {
      method: 'POST'
    })

    if (cacheResponse.success) {
      console.log('Cache atualizado:', cacheResponse.message)
    }

    // Then refresh categories data
    await refreshData()

    // Update cache status display
    await fetchCacheStatus()
  } catch (e: any) {
    console.error('Erro ao atualizar:', e)
  } finally {
    refreshing.value = false
  }
}

// No onMounted needed - useAsyncData fetches data on SSR automatically
// Watches are also handled by useAsyncData via the watch option
</script>
