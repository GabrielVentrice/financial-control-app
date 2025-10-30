<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Header -->
      <header class="h-[72px] px-10 flex items-center justify-between border-b border-border-base">
        <div>
          <h1 class="text-22 font-medium tracking-tight">Gastos por Categoria</h1>
          <p class="text-13 text-text-secondary mt-0.5 leading-normal">Análise de despesas organizadas por categoria</p>
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
      <div class="px-10 py-4 border-b border-border-base">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <label class="text-13 font-medium text-text-secondary">
              Mês:
            </label>
            <input
              v-model="selectedMonth"
              type="month"
              class="px-4 py-2 text-15 bg-background-input text-text-primary border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-accent-info transition-all"
            />
          </div>

          <div class="flex items-center gap-2 text-13">
            <span class="font-medium text-text-secondary">Pessoa:</span>
            <span class="px-3 py-1.5 bg-accent-primary/10 text-accent-primary rounded-md font-semibold border border-accent-primary/20">
              {{ selectedPerson }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main class="max-w-[1280px] px-10 py-8 space-y-12">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
          <p class="mt-4 text-text-secondary text-15">Carregando dados...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="border-l-[3px] border-accent-danger bg-background-card p-5 rounded-lg">
          <h4 class="text-text-primary font-medium text-15">Erro ao carregar dados</h4>
          <p class="text-text-secondary text-13 mt-1 leading-normal">{{ error }}</p>
        </div>

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards -->
          <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Gastos Variáveis
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-success">
                {{ formatCurrency(variableCostsTotal) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Gastos não recorrentes</p>
            </div>

            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Custos Fixos
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-info tracking-tight">
                {{ formatCurrency(custosFixosTotal) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">
                {{ custosFixosCategoriesCount }} {{ custosFixosCategoriesCount === 1 ? 'categoria' : 'categorias' }}
              </p>
            </div>

            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Gastos Comprometidos
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-warning tracking-tight">
                {{ formatCurrency(gastosComprometidosTotal) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">
                {{ gastosComprometidosCategoriesCount }} {{ gastosComprometidosCategoriesCount === 1 ? 'categoria' : 'categorias' }}
              </p>
            </div>

            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Gasto Total
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-primary">
                {{ formatCurrency(totalAmount) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">{{ totalTransactions }} transações</p>
            </div>
          </section>

          <!-- Categories List -->
          <section class="bg-background-card border border-border-base rounded-lg overflow-hidden">
            <!-- Table Header -->
            <div class="px-6 py-4 bg-background-section border-b border-border-base">
              <div class="grid grid-cols-12 gap-4 items-center text-13 font-medium text-text-secondary uppercase tracking-wide">
                <div class="col-span-5">Categoria</div>
                <div class="col-span-2">Transações</div>
                <div class="col-span-2">Valor Total</div>
                <div class="col-span-2">% do Total</div>
                <div class="col-span-1">Média</div>
              </div>
            </div>

            <!-- Categories -->
            <div class="divide-y divide-border-base">
              <template v-for="category in categories" :key="category.name">
                <!-- Category Row -->
                <div
                  @click="toggleCategory(category.name)"
                  class="px-6 py-4 hover:bg-background-hover transition-all cursor-pointer"
                  :class="{ 'bg-background-section': expandedCategory === category.name }"
                >
                  <div class="grid grid-cols-12 gap-4 items-center">
                    <!-- Category Name -->
                    <div class="col-span-5 flex items-center gap-3">
                      <svg
                        class="h-4 w-4 text-text-muted transition-transform duration-150"
                        :class="{ 'rotate-90': expandedCategory === category.name }"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>

                      <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-background-section border border-border-base">
                        <span class="text-xl">{{ getCategoryIcon(category.name) }}</span>
                      </div>

                      <div>
                        <p class="text-15 font-medium text-text-primary">{{ category.name }}</p>
                        <p class="text-13 text-text-muted">Clique para expandir</p>
                      </div>
                    </div>

                    <!-- Transaction Count -->
                    <div class="col-span-2">
                      <span class="inline-block px-3 py-1 bg-background-section text-accent-info text-13 font-semibold rounded-md border border-border-base">
                        {{ category.count }}
                      </span>
                    </div>

                    <!-- Total Value -->
                    <div class="col-span-2">
                      <p class="text-16 font-semibold text-text-primary">
                        {{ formatCurrency(category.total) }}
                      </p>
                    </div>

                    <!-- Percentage -->
                    <div class="col-span-2">
                      <div class="space-y-1">
                        <div class="w-full bg-background-section rounded-full h-2">
                          <div
                            class="bg-accent-primary h-2 rounded-full transition-all duration-300"
                            :style="{ width: `${category.percentage}%` }"
                          ></div>
                        </div>
                        <span class="text-13 font-medium text-text-secondary">{{ category.percentage.toFixed(1) }}%</span>
                      </div>
                    </div>

                    <!-- Average -->
                    <div class="col-span-1">
                      <p class="text-13 text-text-secondary">
                        {{ formatCurrency(category.average) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Expanded Transactions -->
                <div v-if="expandedCategory === category.name" class="bg-background-section">
                  <div class="px-6 py-4">
                    <h4 class="text-15 font-medium text-text-primary mb-4">
                      Transações de {{ category.name }} ({{ getCategoryTransactions(category.name).length }})
                    </h4>
                    <div class="bg-background-page rounded-lg border border-border-base p-4 max-h-96 overflow-y-auto">
                      <div class="space-y-3">
                        <div
                          v-for="transaction in getCategoryTransactions(category.name)"
                          :key="transaction.transactionId"
                          class="flex items-center justify-between py-3 border-b border-divider last:border-0"
                        >
                          <div class="flex-1 space-y-1">
                            <p class="text-15 text-text-primary">{{ transaction.description }}</p>
                            <div class="flex items-center gap-3 text-13 text-text-muted">
                              <span>{{ formatDate(transaction.date) }}</span>
                              <span>•</span>
                              <span>{{ transaction.origin }}</span>
                            </div>
                          </div>
                          <p class="text-15 font-semibold text-accent-primary ml-4">
                            {{ formatCurrency(transaction.amount) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Empty State -->
            <div v-if="categories.length === 0" class="text-center py-12">
              <p class="text-text-secondary text-15">Nenhuma transação encontrada para o período selecionado</p>
            </div>
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
