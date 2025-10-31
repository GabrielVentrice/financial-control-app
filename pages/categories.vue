<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Compact Header -->
      <header class="h-14 px-6 lg:px-10 flex items-center justify-between border-b border-border-base">
        <div class="flex items-baseline gap-3">
          <h1 class="text-[18px] font-medium tracking-tight">Categorias</h1>
          <span class="px-2 py-0.5 text-[11px] font-medium bg-accent-primary/10 text-accent-primary rounded border border-accent-primary/20">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refreshData" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Compact Month Filter -->
      <div class="px-6 lg:px-10 py-3 border-b border-border-base bg-background-card">
        <div class="max-w-[1400px] mx-auto flex items-center gap-2">
          <label class="text-[11px] font-medium text-text-muted uppercase tracking-wide">
            Mês
          </label>
          <input
            v-model="selectedMonth"
            type="month"
            class="px-3 py-1.5 text-[13px] bg-background-input text-text-primary border border-border-subtle rounded focus:outline-none focus:ring-1 focus:ring-accent-info transition-all"
          />
          <span class="text-[11px] text-text-muted ml-2">{{ formattedMonth }}</span>
        </div>
      </div>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-5 space-y-4">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary - DENSE 4 cards -->
          <section class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <DenseStatCard
              label="Variáveis"
              :value="variableCostsTotal"
              format="currency"
              value-color="success"
              :secondary-stat="{ label: 'Não recorrentes', value: '' }"
            />

            <DenseStatCard
              label="Fixos"
              :value="custosFixosTotal"
              format="currency"
              value-color="info"
              :secondary-stat="{ label: 'Categorias', value: custosFixosCategoriesCount }"
            />

            <DenseStatCard
              label="Comprometidos"
              :value="gastosComprometidosTotal"
              format="currency"
              value-color="warning"
              :secondary-stat="{ label: 'Categorias', value: gastosComprometidosCategoriesCount }"
            />

            <DenseStatCard
              label="Total"
              :value="totalAmount"
              format="currency"
              value-color="primary"
              :secondary-stat="{ label: 'Transações', value: totalTransactions }"
            />
          </section>

          <!-- Categories List - FLAT -->
          <section class="border-t border-border-base overflow-hidden">
            <!-- Desktop Table Header -->
            <div class="hidden lg:block px-4 py-2.5 bg-background-section border-b border-border-base">
              <div class="grid grid-cols-12 gap-3 items-center text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                <div class="col-span-5">Categoria</div>
                <div class="col-span-2">Transações</div>
                <div class="col-span-2">Valor</div>
                <div class="col-span-2">% Total</div>
                <div class="col-span-1 text-right">Média</div>
              </div>
            </div>

            <!-- Mobile Header -->
            <div class="lg:hidden px-4 py-2.5 bg-background-section border-b border-border-base">
              <h3 class="text-[13px] font-medium text-text-primary">Gastos por Categoria</h3>
            </div>

            <!-- Categories -->
            <div class="divide-y divide-border-base">
              <template v-for="category in categories" :key="category.name">
                <!-- Desktop Category Row - COMPACT -->
                <div
                  @click="toggleCategory(category.name)"
                  class="hidden lg:block px-4 py-2.5 hover:bg-background-hover transition-colors cursor-pointer"
                  :class="{ 'bg-background-section': expandedCategory === category.name }"
                >
                  <div class="grid grid-cols-12 gap-3 items-center">
                    <!-- Category Name -->
                    <div class="col-span-5 flex items-center gap-2">
                      <svg
                        class="h-3 w-3 text-text-muted transition-transform duration-150 flex-shrink-0"
                        :class="{ 'rotate-90': expandedCategory === category.name }"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>

                      <div class="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded bg-background-section border border-border-base">
                        <span class="text-[16px]">{{ getCategoryIcon(category.name) }}</span>
                      </div>

                      <p class="text-[13px] font-medium text-text-primary truncate">{{ category.name }}</p>
                    </div>

                    <!-- Transaction Count -->
                    <div class="col-span-2">
                      <span class="inline-block px-2 py-0.5 bg-background-section text-accent-info text-[11px] font-semibold rounded border border-border-base">
                        {{ category.count }}
                      </span>
                    </div>

                    <!-- Total Value -->
                    <div class="col-span-2">
                      <p class="text-[13px] font-semibold text-text-primary">
                        {{ formatCurrencyCompact(category.total) }}
                      </p>
                    </div>

                    <!-- Percentage -->
                    <div class="col-span-2">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 bg-background-section rounded-full h-1">
                          <div
                            class="bg-accent-primary h-1 rounded-full transition-all"
                            :style="{ width: `${category.percentage}%` }"
                          ></div>
                        </div>
                        <span class="text-[11px] font-medium text-text-secondary whitespace-nowrap">{{ category.percentage.toFixed(0) }}%</span>
                      </div>
                    </div>

                    <!-- Average -->
                    <div class="col-span-1 text-right">
                      <p class="text-[11px] text-text-muted">
                        {{ formatCurrencyCompact(category.average) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Mobile Category Card - COMPACT -->
                <div
                  @click="toggleCategory(category.name)"
                  class="lg:hidden px-3 py-3 hover:bg-background-hover transition-colors cursor-pointer"
                  :class="{ 'bg-background-section': expandedCategory === category.name }"
                >
                  <div class="space-y-2">
                    <!-- Header -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 min-w-0 flex-1">
                        <div class="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded bg-background-section border border-border-base">
                          <span class="text-[16px]">{{ getCategoryIcon(category.name) }}</span>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-[13px] font-medium text-text-primary truncate">{{ category.name }}</p>
                          <div class="flex items-center gap-2 text-[11px] text-text-muted">
                            <span>{{ category.count }} trans.</span>
                            <span>•</span>
                            <span>{{ category.percentage.toFixed(0) }}%</span>
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-[13px] font-semibold text-text-primary whitespace-nowrap">
                          {{ formatCurrencyCompact(category.total) }}
                        </p>
                        <p class="text-[11px] text-text-muted">
                          {{ formatCurrencyCompact(category.average) }}
                        </p>
                      </div>
                    </div>

                    <!-- Progress bar -->
                    <div class="w-full bg-background-section rounded-full h-1">
                      <div
                        class="bg-accent-primary h-1 rounded-full transition-all"
                        :style="{ width: `${category.percentage}%` }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Expanded Transactions - COMPACT -->
                <div v-if="expandedCategory === category.name" class="bg-background-section">
                  <div class="px-4 py-3">
                    <h4 class="text-[12px] font-medium text-text-primary mb-2 uppercase tracking-wide">
                      Transações ({{ getCategoryTransactions(category.name).length }})
                    </h4>
                    <div class="bg-background-page rounded border border-border-base p-2 max-h-64 overflow-y-auto">
                      <div class="space-y-1.5">
                        <div
                          v-for="transaction in getCategoryTransactions(category.name)"
                          :key="transaction.transactionId"
                          class="flex items-start justify-between gap-2 py-1.5 border-b border-divider last:border-0"
                        >
                          <div class="flex-1 min-w-0">
                            <p class="text-[12px] text-text-primary truncate">{{ transaction.description }}</p>
                            <div class="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                              <span>{{ formatDateCompact(transaction.date) }}</span>
                              <span>•</span>
                              <span class="truncate">{{ transaction.origin }}</span>
                            </div>
                          </div>
                          <p class="text-[12px] font-semibold text-accent-primary whitespace-nowrap">
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
