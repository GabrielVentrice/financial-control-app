<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] text-gray-800 min-h-screen">
      <!-- Header - Clean, sem bordas pesadas -->
      <header class="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-gray-100">
        <div class="flex items-baseline gap-4">
          <h1 class="text-2xl font-normal tracking-tight text-gray-800">Categorias</h1>
          <span class="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refreshData" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Month Filter - Cards suaves -->
      <div class="px-6 lg:px-12 py-6 bg-gray-50/50 border-b border-gray-100">
        <div class="max-w-[1400px] mx-auto flex items-center gap-4">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Mês
          </label>
          <input
            v-model="selectedMonth"
            type="month"
            class="px-4 py-3 bg-white text-gray-700 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
          />
          <span class="text-sm text-gray-400 ml-2">{{ formattedMonth }}</span>
        </div>
      </div>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-10 space-y-12">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards - Todos em uma linha -->
          <section>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
              <LightStatCard
                label="Variáveis"
                :value="variableCostsTotal"
                format="currency"
                value-color="success"
                size="md"
                :secondary-stat="{ label: 'Não recorrentes', value: '' }"
              />

              <LightStatCard
                label="Total"
                :value="totalAmount"
                format="currency"
                value-color="primary"
                size="md"
                :secondary-stat="{ label: 'Transações', value: totalTransactions }"
              />

              <LightStatCard
                label="Fixos"
                :value="custosFixosTotal"
                format="currency"
                value-color="info"
                size="md"
                :secondary-stat="{ label: 'Categorias', value: custosFixosCategoriesCount }"
              />

              <LightStatCard
                label="Comprometidos"
                :value="gastosComprometidosTotal"
                format="currency"
                value-color="warning"
                size="md"
                :secondary-stat="{ label: 'Categorias', value: gastosComprometidosCategoriesCount }"
              />

              <LightStatCard
                label="Média por Categoria"
                :value="categories.length > 0 ? totalAmount / categories.length : 0"
                format="currency"
                value-color="default"
                size="md"
              />
            </div>
          </section>

          <!-- Categories List - Respirável, sem bordas pesadas -->
          <section class="bg-white rounded-2xl overflow-hidden shadow-sm">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-100">
              <h2 class="text-lg font-normal text-gray-700">Gastos por Categoria</h2>
              <p class="text-sm text-gray-400 mt-1">{{ categories.length }} categorias</p>
            </div>

            <!-- Desktop Table Header -->
            <div class="hidden lg:block px-6 py-3 bg-gray-50/50 border-b border-gray-100">
              <div class="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div class="col-span-4">Categoria</div>
                <div class="col-span-2">Gasto / Orçamento</div>
                <div class="col-span-3">Progresso</div>
                <div class="col-span-2">Restante</div>
                <div class="col-span-1 text-right">Trans.</div>
              </div>
            </div>

            <!-- Categories -->
            <div class="divide-y divide-gray-100">
              <template v-for="category in categories" :key="category.name">
                <!-- Desktop Category Row - Light Design -->
                <div
                  @click="toggleCategory(category.name)"
                  class="hidden lg:block px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  :class="{ 'bg-gray-50': expandedCategory === category.name }"
                >
                  <div class="grid grid-cols-12 gap-4 items-center">
                    <!-- Category Name -->
                    <div class="col-span-4 flex items-center gap-3">
                      <svg
                        class="h-4 w-4 text-gray-400 transition-transform duration-150 flex-shrink-0"
                        :class="{ 'rotate-90': expandedCategory === category.name }"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>

                      <span class="text-lg">{{ getCategoryIcon(category.name) }}</span>

                      <p class="text-sm font-normal text-gray-700 truncate">{{ category.name }}</p>
                    </div>

                    <!-- Gasto / Orçamento -->
                    <div class="col-span-2">
                      <div class="space-y-1">
                        <p class="text-base font-light text-gray-800">
                          {{ formatCurrencyCompact(category.total) }}
                        </p>
                        <p v-if="category.budget" class="text-xs text-gray-400">
                          de {{ formatCurrencyCompact(category.budget.total) }}
                        </p>
                        <p v-else class="text-xs text-gray-400 italic">
                          Sem orçamento
                        </p>
                      </div>
                    </div>

                    <!-- Barra de Progresso -->
                    <div class="col-span-3">
                      <template v-if="category.budget">
                        <div class="space-y-1">
                          <div class="flex items-center gap-3">
                            <div class="flex-1 bg-gray-100 rounded-full h-[3px] overflow-hidden">
                              <div
                                class="h-[3px] rounded-full transition-all"
                                :class="getBudgetProgressColor(category.budget.percentageUsed)"
                                :style="{ width: `${Math.min(category.budget.percentageUsed, 100)}%` }"
                              ></div>
                            </div>
                            <span class="text-xs font-normal whitespace-nowrap" :class="getBudgetTextColor(category.budget.percentageUsed)">
                              {{ category.budget.percentageUsed.toFixed(0) }}%
                            </span>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <span class="text-xs text-gray-400 italic">-</span>
                      </template>
                    </div>

                    <!-- Restante -->
                    <div class="col-span-2">
                      <template v-if="category.budget">
                        <p class="text-base font-light" :class="category.budget.remaining >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                          {{ formatCurrencyCompact(category.budget.remaining) }}
                        </p>
                        <p class="text-xs text-gray-400">
                          {{ category.budget.remaining >= 0 ? 'disponível' : 'excedido' }}
                        </p>
                      </template>
                      <template v-else>
                        <span class="text-xs text-gray-400 italic">-</span>
                      </template>
                    </div>

                    <!-- Transações -->
                    <div class="col-span-1 text-right">
                      <span class="text-sm text-gray-500">
                        {{ category.count }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Mobile Category Card - Light Design -->
                <div
                  @click="toggleCategory(category.name)"
                  class="lg:hidden px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  :class="{ 'bg-gray-50': expandedCategory === category.name }"
                >
                  <div class="space-y-3">
                    <!-- Header -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3 min-w-0 flex-1">
                        <span class="text-lg">{{ getCategoryIcon(category.name) }}</span>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-normal text-gray-700 truncate">{{ category.name }}</p>
                          <div class="text-xs text-gray-400">
                            <span>{{ category.count }} transações</span>
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-base font-light text-gray-800 whitespace-nowrap">
                          {{ formatCurrencyCompact(category.total) }}
                        </p>
                        <p v-if="category.budget" class="text-xs text-gray-400">
                          de {{ formatCurrencyCompact(category.budget.total) }}
                        </p>
                        <p v-else class="text-xs text-gray-400 italic">
                          Sem orçamento
                        </p>
                      </div>
                    </div>

                    <!-- Budget Progress bar -->
                    <template v-if="category.budget">
                      <div class="space-y-2">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-400">Progresso do orçamento</span>
                          <span class="font-normal" :class="getBudgetTextColor(category.budget.percentageUsed)">
                            {{ category.budget.percentageUsed.toFixed(0) }}%
                          </span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-[3px] overflow-hidden">
                          <div
                            class="h-[3px] rounded-full transition-all"
                            :class="getBudgetProgressColor(category.budget.percentageUsed)"
                            :style="{ width: `${Math.min(category.budget.percentageUsed, 100)}%` }"
                          ></div>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-400">Restante:</span>
                          <span class="font-normal" :class="category.budget.remaining >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                            {{ formatCurrencyCompact(category.budget.remaining) }}
                          </span>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Expanded Transactions - Light Design -->
                <div v-if="expandedCategory === category.name" class="bg-gray-50/50">
                  <div class="px-5 py-4">
                    <h4 class="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                      Transações ({{ getCategoryTransactions(category.name).length }})
                    </h4>
                    <div class="bg-white rounded-xl p-3 max-h-64 overflow-y-auto">
                      <div class="space-y-3">
                        <div
                          v-for="transaction in getCategoryTransactions(category.name)"
                          :key="transaction.transactionId"
                          class="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
                        >
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-700 truncate">{{ transaction.description }}</p>
                            <div class="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span>{{ formatDateCompact(transaction.date) }}</span>
                              <span>•</span>
                              <span class="truncate">{{ transaction.origin }}</span>
                            </div>
                          </div>
                          <p class="text-sm font-light text-gray-800 whitespace-nowrap">
                            {{ formatCurrencyCompact(transaction.amount) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Empty State -->
            <EmptyState
              v-if="categories.length === 0"
              icon="📊"
              title="Nenhuma transação"
              description="Selecione outro período."
            />
          </section>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { CategoriesResponse } from '~/types/transaction'

// Composables
const { selectedPerson } = usePersonFilter()

// State
const categoriesData = ref<CategoriesResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const expandedCategory = ref<string | null>(null)

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const selectedMonth = ref(getCurrentMonth())

// Computed
const categories = computed(() => categoriesData.value?.categories || [])
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
      name.includes('hospital') || name.includes('health') || name.includes('pharmacy')) return '⚕️'
  if (name.includes('educação') || name.includes('escola') || name.includes('curso') ||
      name.includes('livro') || name.includes('education')) return '📚'
  if (name.includes('aluguel') || name.includes('condomínio') || name.includes('casa') ||
      name.includes('rent') || name.includes('moradia')) return '🏠'
  if (name.includes('conta') || name.includes('luz') || name.includes('água') ||
      name.includes('internet') || name.includes('telefone') || name.includes('bill')) return '📄'
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
      name.includes('savings')) return '📈'
  if (name.includes('bar') || name.includes('bebida') || name.includes('café') ||
      name.includes('drink') || name.includes('coffee')) return '☕'
  if (name.includes('presente') || name.includes('gift')) return '🎁'
  if (name.includes('installment') || name.includes('financing') ||
      name.includes('parcela') || name.includes('parcelamento')) return '📅'

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

const refreshData = async () => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()

    if (selectedPerson.value !== 'Ambos') {
      params.append('person', selectedPerson.value)
    }

    const [year, month] = selectedMonth.value.split('-')
    const startDate = `${year}-${month}-01`
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

    params.append('startDate', startDate)
    params.append('endDate', endDate)
    params.append('includeTransactions', 'true')

    const response = await $fetch<CategoriesResponse>(`/api/categories?${params.toString()}`)
    categoriesData.value = response
  } catch (e: any) {
    error.value = e.data || 'Não foi possível carregar os dados. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})

watch(selectedPerson, () => {
  refreshData()
})

watch(selectedMonth, () => {
  refreshData()
})
</script>
