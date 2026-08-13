<template>
  <Sidemenu>
    <div class="bg-background-page min-h-screen">
      <!-- Header -->
      <PageHeader title="Orcamento" :subtitle="formattedMonth">
        <template #actions>
          <BaseButton size="sm" variant="secondary" @click="syncNow()" :loading="syncing">
            {{ syncing ? 'Atualizando...' : 'Atualizar' }}
          </BaseButton>
          <BaseButton
            size="sm"
            variant="secondary"
            @click="showApplyTemplateModal = true"
            :disabled="pending || saving"
          >
            Aplicar Orçamento Padrão
          </BaseButton>
          <BaseButton
            size="sm"
            variant="secondary"
            @click="copyFromPreviousMonth"
            :loading="copying"
            :disabled="pending || saving"
          >
            {{ copying ? 'Copiando...' : 'Copiar Mês Anterior' }}
          </BaseButton>
          <BaseButton size="sm" @click="saveBudgets" :loading="saving" :disabled="!hasChanges">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Month Selector & Messages -->
      <div class="px-6 py-4 bg-white border-b border-gray-200 space-y-4">
        <div class="flex items-center gap-4">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
            Período:
          </label>
          <input
            v-model="selectedMonth"
            type="month"
            class="px-3 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
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
      <main class="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <!-- Loading State -->
        <LoadingState v-if="pending" message="Carregando orçamentos..." />

        <!-- Content -->
        <template v-else>
          <!-- Tabs for Juliana and Gabriel -->
          <section>
            <div class="flex gap-2 border-b border-gray-200">
              <button
                @click="selectPerson('Juliana')"
                class="px-6 py-3 text-sm font-medium transition-colors border-b-2"
                :class="!showingPersonFallback && budgetPerson === 'Juliana'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'"
              >
                Juliana
              </button>
              <button
                @click="selectPerson('Gabriel')"
                class="px-6 py-3 text-sm font-medium transition-colors border-b-2"
                :class="!showingPersonFallback && budgetPerson === 'Gabriel'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'"
              >
                Gabriel
              </button>
            </div>
            <p v-if="showingPersonFallback" class="mt-2 text-xs text-gray-400">
              Filtro global em "Ambos" — mostrando {{ budgetPerson }}, o orçamento é por pessoa.
            </p>
          </section>

          <!-- Summary Cards in one row - Sticky -->
          <section class="sticky top-0 z-10 bg-gray-50 pt-2 pb-4">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <LightStatCard
                label="Total Orçado"
                :value="currentPersonTotalBudget"
                format="currency"
                value-color="neutral"
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
                value-color="neutral"
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
                <p class="text-sm text-gray-400 mt-1">Configure os orçamentos mensais para {{ budgetPerson }}</p>
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
                      :value="budgetInputs[category]"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      class="w-full pl-10 pr-3 py-3 text-base bg-white text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
                      @input="onBudgetInput(category, $event)"
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
                      {{ formatCurrency(getCategorySpending(category, 0)) }}
                    </span>
                  </div>

                  <!-- Previous Month -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">{{ getMonthLabel(-1) }}</span>
                    <span class="text-sm font-medium text-gray-600">
                      {{ formatCurrency(getCategorySpending(category, -1)) }}
                    </span>
                  </div>

                  <!-- 2 Months Back -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-400">{{ getMonthLabel(-2) }}</span>
                    <span class="text-sm font-normal text-gray-500">
                      {{ formatCurrency(getCategorySpending(category, -2)) }}
                    </span>
                  </div>

                  <!-- Average -->
                  <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span class="text-xs text-gray-600 font-medium">Média 3 meses</span>
                    <span class="text-sm font-semibold text-blue-600">
                      {{ formatCurrency(getCategoryAverageSpending(category)) }}
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

      <!-- Apply Template Modal -->
      <div
        v-if="showApplyTemplateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showApplyTemplateModal = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                Aplicar Orçamento Padrão - {{ budgetPerson }} - {{ formattedMonth }}
              </h3>
              <button
                @click="showApplyTemplateModal = false"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-6 space-y-6">
            <!-- Loading State -->
            <div v-if="applyingTemplate" class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p class="text-gray-600">Aplicando template...</p>
            </div>

            <!-- Preview -->
            <template v-else-if="templatePreview">
              <!-- Total Income -->
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-green-800">Ganhos Detectados no Mês:</span>
                  <span class="text-2xl font-bold text-green-700">
                    {{ formatCurrency(templatePreview.totalIncome) }}
                  </span>
                </div>
              </div>

              <!-- Templates Applied -->
              <div>
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Categorias a Preencher:</h4>

                <div v-if="templatePreview.templatesApplied.filter(t => t.applied).length === 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p class="text-sm text-yellow-800">
                    ⚠️ Todas as categorias já têm orçamento configurado manualmente. Nenhum orçamento será criado.
                  </p>
                </div>

                <div v-else class="space-y-2 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div
                    v-for="template in templatePreview.templatesApplied"
                    :key="template.category"
                    class="flex items-center justify-between py-2 px-3 bg-white rounded border"
                    :class="template.applied ? 'border-green-200' : 'border-gray-200 opacity-50'"
                  >
                    <div class="flex items-center space-x-2">
                      <span class="text-xl">{{ getCategoryIcon(template.category) }}</span>
                      <span class="text-sm font-medium text-gray-900">{{ template.category }}</span>
                      <span class="text-xs text-gray-500">{{ template.percentage.toFixed(1) }}%</span>
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-semibold" :class="template.applied ? 'text-green-700' : 'text-gray-400'">
                        {{ formatCurrency(template.calculatedAmount) }}
                      </span>
                      <p v-if="!template.applied && template.reason" class="text-xs text-gray-500">
                        {{ template.reason }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Total -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-blue-800">Total a Criar:</span>
                  <span class="text-xl font-bold text-blue-700">
                    {{ templatePreview.budgetsCreated }} orçamento(s)
                  </span>
                </div>
              </div>

              <!-- Warning -->
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p class="text-xs text-gray-600">
                  ⚠️ Categorias com orçamento manual não serão sobrescritas.
                </p>
              </div>
            </template>

            <!-- No Income Found -->
            <div v-else-if="templateError" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-sm text-red-800">{{ templateError }}</p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex items-center justify-end space-x-3">
            <button
              @click="showApplyTemplateModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              v-if="templatePreview && templatePreview.budgetsCreated > 0"
              @click="confirmApplyTemplate"
              :disabled="applyingTemplate"
              class="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirmar e Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import type { BudgetsResponse, CategoriesResponse, BudgetInput } from '~/types/transaction'
import type { ApplyTemplateResponse } from '~/types/budgetTemplate'
import { currentMonthKey, addMonthsToKey, daysInMonthKey, monthIndexOfKey } from '~/shared/dates'
import { isSpendingCategory, UNCATEGORIZED } from '~/shared/expenseRules'
import { getCategoryIcon } from '~/shared/categoryIcons'

// Composables
const { applyTemplate } = useBudgetTemplates()
const { syncNow, syncing } = useSync()
const { formatCurrency, formatMonthName } = useFormatters()
const { selectedPerson: globalPerson, setPersonFilter } = usePersonFilter()

// State
const saving = ref(false)
const copying = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const showSuccessAlert = ref(false)
const showErrorAlert = ref(false)
const searchQuery = ref('')

/**
 * Values the user typed, layered over the saved budgets. Derived state instead
 * of a copy filled by a watcher: watchers do not run during SSR, so a copy
 * renders empty on the server and only fills after hydration. `null` is an
 * emptied field — without it, clearing an input to retype it would immediately
 * write the saved amount back into it.
 */
const budgetEdits = ref<Record<string, number | null>>({})
const hasChanges = computed(() => Object.keys(budgetEdits.value).length > 0)

// A budget belongs to one person, so "Ambos" has no meaning here: fall back to
// Gabriel and tell the user which side they are looking at.
const budgetPerson = computed<'Juliana' | 'Gabriel'>(() =>
  globalPerson.value === 'Ambos' ? 'Gabriel' : globalPerson.value
)
const showingPersonFallback = computed(() => globalPerson.value === 'Ambos')

// Apply Template Modal State
const showApplyTemplateModal = ref(false)
const applyingTemplate = ref(false)
const templatePreview = ref<ApplyTemplateResponse | null>(null)
const templateError = ref<string | null>(null)

const selectedMonth = ref(currentMonthKey())

const monthNumber = computed(() => Number(selectedMonth.value.split('-')[1]))
const yearNumber = computed(() => Number(selectedMonth.value.split('-')[0]))

const monthRange = (key: string) => ({
  startDate: `${key}-01`,
  endDate: `${key}-${String(daysInMonthKey(key)).padStart(2, '0')}`,
})

// Data — every payload is reused across client-side navigation via
// getCachedData; `watch` still forces a refetch when the month/person changes.
const { data: categoriesData, status: categoriesStatus } = useAsyncData<CategoriesResponse | null>(
  'budget-categories',
  () => $fetch<CategoriesResponse>('/api/categories'),
  {
    default: () => null,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

const {
  data: budgetsData,
  status: budgetsStatus,
  refresh: refreshBudgets,
} = useAsyncData<BudgetsResponse | null>(
  'budget-budgets',
  () => $fetch<BudgetsResponse>('/api/budgets', {
    query: { month: monthNumber.value, year: yearNumber.value },
  }),
  {
    default: () => null,
    watch: [selectedMonth],
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

/** Reference month and the two before it, in the order the payload comes back. */
const HISTORY_OFFSETS = [0, -1, -2]

// The three history windows are one payload: they always move together, and a
// single key keeps the page from flickering through three loading states.
const { data: historyData, status: historyStatus } = useAsyncData<CategoriesResponse[]>(
  'budget-history',
  () => Promise.all(HISTORY_OFFSETS.map(offset => {
    const { startDate, endDate } = monthRange(addMonthsToKey(selectedMonth.value, offset))
    return $fetch<CategoriesResponse>('/api/categories', {
      query: { person: budgetPerson.value, startDate, endDate },
    })
  })),
  {
    default: () => [],
    watch: [selectedMonth, budgetPerson],
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

const pending = computed(() =>
  categoriesStatus.value === 'pending' ||
  budgetsStatus.value === 'pending' ||
  historyStatus.value === 'pending'
)

const availableCategories = computed(() =>
  (categoriesData.value?.categories || [])
    .map(cat => cat.name)
    .filter(name =>
      isSpendingCategory(name) && name.toLowerCase() !== UNCATEGORIZED.toLowerCase()
    )
    .sort()
)

const budgetInputs = computed<Record<string, number | null>>(() => {
  const inputs: Record<string, number | null> = {}

  for (const category of availableCategories.value) {
    if (category in budgetEdits.value) {
      inputs[category] = budgetEdits.value[category]
      continue
    }

    const saved = (budgetsData.value?.budgets || []).find(
      b => b.category === category && b.person === budgetPerson.value
    )

    inputs[category] = saved?.amount ?? 0
  }

  return inputs
})

// Computed
const formattedMonth = computed(() =>
  `${formatMonthName(monthIndexOfKey(selectedMonth.value))} de ${yearNumber.value}`
)

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
  return (historyData.value[0]?.categories || []).reduce((sum, cat) => sum + cat.total, 0)
})

const currentPersonCategoriesWithBudget = computed(() => {
  return Object.values(budgetInputs.value).filter(amount => amount && amount > 0).length
})

// Methods
const getMonthLabel = (offset: number): string => {
  const key = addMonthsToKey(selectedMonth.value, offset)
  const name = formatMonthName(monthIndexOfKey(key), true)

  if (offset === 0) return `${name} (atual)`

  return `${name}/${key.slice(2, 4)}`
}

const getCategorySpending = (category: string, monthOffset: number): number => {
  const data = historyData.value[HISTORY_OFFSETS.indexOf(monthOffset)]
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
  budgetEdits.value[category] = Math.round(getCategoryAverageSpending(category))
  clearMessages()
}

const onBudgetInput = (category: string, event: Event) => {
  const raw = (event.target as HTMLInputElement).value
  const parsed = Number(raw)

  budgetEdits.value[category] = raw !== '' && Number.isFinite(parsed) ? parsed : null
  clearMessages()
}

const formatMonthCompact = () =>
  `${formatMonthName(monthIndexOfKey(selectedMonth.value), true)}/${selectedMonth.value.slice(2, 4)}`

const clearMessages = () => {
  errorMessage.value = null
  successMessage.value = null
  showErrorAlert.value = false
  showSuccessAlert.value = false
}

// Switching person changes which budget is being edited, so whatever was typed
// for the other one no longer applies.
watch(budgetPerson, () => {
  budgetEdits.value = {}
})

// Set while restoring the previous month after a declined confirm, so the
// restore itself does not ask again.
let revertingMonth = false

watch(selectedMonth, (_next, previous) => {
  if (revertingMonth) {
    revertingMonth = false
    return
  }

  if (!hasChanges.value) return

  if (confirm('Você tem alterações não salvas. Deseja realmente mudar o período sem salvar?')) {
    budgetEdits.value = {}
    return
  }

  revertingMonth = true
  selectedMonth.value = previous
})

const selectPerson = (person: 'Juliana' | 'Gabriel') => {
  if (person === budgetPerson.value && !showingPersonFallback.value) return

  if (hasChanges.value &&
      !confirm('Você tem alterações não salvas. Deseja realmente mudar de pessoa sem salvar?')) {
    return
  }

  setPersonFilter(person)
}

const saveBudgets = async () => {
  saving.value = true
  clearMessages()

  try {
    const budgetsToSave: BudgetInput[] = []

    for (const category of availableCategories.value) {
      const amount = budgetInputs.value[category]

      if (amount && amount > 0) {
        budgetsToSave.push({
          category,
          person: budgetPerson.value,
          month: monthNumber.value,
          year: yearNumber.value,
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

    successMessage.value = `${budgetsToSave.length} orçamento(s) de ${budgetPerson.value} salvos com sucesso!`
    showSuccessAlert.value = true
    budgetEdits.value = {}

    // The POST already invalidated the server-side budget cache, so this reads
    // back what was just written.
    await refreshBudgets()
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
    const previousKey = addMonthsToKey(selectedMonth.value, -1)
    const [previousYear, previousMonth] = previousKey.split('-')

    // Fetch budgets from previous month for the current person
    const budgetsResponse = await $fetch<BudgetsResponse>('/api/budgets', {
      query: {
        month: Number(previousMonth),
        year: Number(previousYear),
        person: budgetPerson.value,
      },
    })

    if (budgetsResponse.budgets.length === 0) {
      errorMessage.value = `Não foram encontrados orçamentos de ${budgetPerson.value} para o mês anterior (${previousMonth}/${previousYear}).`
      showErrorAlert.value = true
      return
    }

    // Copy values to current budget inputs
    let copiedCount = 0
    for (const budget of budgetsResponse.budgets) {
      if (availableCategories.value.includes(budget.category)) {
        budgetEdits.value[budget.category] = budget.amount
        copiedCount++
      }
    }

    successMessage.value = `${copiedCount} orçamento(s) copiado(s) do mês ${previousMonth}/${previousYear}. Lembre-se de salvar as alterações!`
    showSuccessAlert.value = true
  } catch (e: any) {
    errorMessage.value = e.data?.message || e.data || 'Não foi possível copiar os orçamentos do mês anterior. Tente novamente.'
    showErrorAlert.value = true
  } finally {
    copying.value = false
  }
}

// Apply Template Functions
const loadTemplatePreview = async () => {
  applyingTemplate.value = true
  templatePreview.value = null
  templateError.value = null

  try {
    const response = await applyTemplate({
      person: budgetPerson.value,
      month: monthNumber.value,
      year: yearNumber.value,
    })

    if (response) {
      if (response.success) {
        templatePreview.value = response
      } else {
        templateError.value = response.message
      }
    }
  } catch (e: any) {
    templateError.value = e.data?.message || e.data || 'Erro ao carregar preview do template.'
  } finally {
    applyingTemplate.value = false
  }
}

const confirmApplyTemplate = async () => {
  // Close modal and reload data
  showApplyTemplateModal.value = false

  successMessage.value = templatePreview.value?.message || 'Template aplicado com sucesso!'
  showSuccessAlert.value = true

  // Reset template state
  templatePreview.value = null
  templateError.value = null

  // The endpoint already wrote the budgets and invalidated the server cache.
  await refreshBudgets()
}

watch(showApplyTemplateModal, (newValue) => {
  if (newValue) {
    // Load template preview when modal opens
    loadTemplatePreview()
  }
})
</script>
