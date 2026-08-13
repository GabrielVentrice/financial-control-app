<template>
  <Sidemenu>
    <div class="bg-background-page min-h-screen">
      <PageHeader
        title="Templates de Orcamento"
        subtitle="Configure porcentagens padrao para distribuir automaticamente seus ganhos mensais"
      />
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Person Tabs -->
        <div class="mb-6 border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="selectPerson('Gabriel')"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                !showingPersonFallback && templatePerson === 'Gabriel'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Gabriel
            </button>
            <button
              @click="selectPerson('Juliana')"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                !showingPersonFallback && templatePerson === 'Juliana'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Juliana
            </button>
          </nav>
        </div>

        <p v-if="showingPersonFallback" class="-mt-4 mb-6 text-xs text-gray-400">
          Filtro global em "Ambos" — mostrando {{ templatePerson }}, o template é por pessoa.
        </p>

        <!-- Loading State -->
        <div v-if="pending" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Carregando categorias e histórico...</p>
          </div>
        </div>

        <template v-else>
          <!-- Sticky Header: Simulation + Total -->
          <div class="sticky top-0 z-10 bg-white shadow-md rounded-xl mb-6 p-3 sm:p-4 border border-gray-200">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <!-- Simulation Income -->
              <div class="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <span class="text-xl sm:text-2xl">💰</span>
                <div class="flex-1 min-w-0">
                  <label for="simulatedIncome" class="block text-xs font-medium text-blue-900 mb-1">
                    Simulação de Renda
                  </label>
                  <div class="flex items-center gap-1 sm:gap-2">
                    <span class="text-xs sm:text-sm text-gray-600">R$</span>
                    <input
                      id="simulatedIncome"
                      type="number"
                      v-model.number="simulatedIncome"
                      min="0"
                      step="100"
                      aria-describedby="simulatedIncome-hint"
                      class="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-blue-300 rounded-lg text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  </div>
                  <p id="simulatedIncome-hint" class="text-[10px] text-blue-700/70 mt-1 hidden sm:block">
                    Apenas simulacao — salva somente neste navegador
                  </p>
                </div>
                <div class="text-right hidden sm:block">
                  <p class="text-xs text-blue-700 mb-1">Valor Total</p>
                  <p class="text-lg font-bold text-blue-900">
                    {{ formatCurrency(totalCalculated) }}
                  </p>
                </div>
                <div class="text-right sm:hidden">
                  <p class="text-xs font-bold text-blue-900">
                    {{ formatCurrency(totalCalculated) }}
                  </p>
                </div>
              </div>

              <!-- Total Percentage -->
              <div class="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border-2" :class="[
                currentTotal <= 100 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
              ]">
                <span class="text-xl sm:text-2xl">{{ currentTotal <= 100 ? '✅' : '⚠️' }}</span>
                <div class="flex-1 min-w-0">
                  <label class="block text-xs font-medium mb-1" :class="[
                    currentTotal <= 100 ? 'text-green-900' : 'text-red-900'
                  ]">
                    Total de Porcentagens
                  </label>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      :class="[
                        'h-2 rounded-full transition-all duration-200',
                        currentTotal <= 100 ? 'bg-green-500' : 'bg-red-500'
                      ]"
                      :style="{ width: `${Math.min(currentTotal, 100)}%` }"
                    ></div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xl sm:text-2xl font-bold" :class="[
                    currentTotal <= 100 ? 'text-green-600' : 'text-red-600'
                  ]">
                    {{ currentTotal.toFixed(1) }}%
                  </p>
                  <p class="text-xs text-gray-500 hidden sm:block">de 100%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="categoryBudgets.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
            <div class="text-6xl mb-4">📊</div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Nenhuma categoria de gasto encontrada
            </h3>
            <p class="text-sm text-gray-500 mb-6">
              Comece registrando algumas transações para ver as categorias aqui.
            </p>
            <NuxtLink to="/transactions" class="text-blue-600 hover:text-blue-700 font-medium">
              Ir para Transações →
            </NuxtLink>
          </div>

          <!-- Category Cards Grid -->
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <div
              v-for="category in categoryBudgets"
              :key="category.name"
              class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-blue-300 transition-all"
            >
              <!-- Header: Icon, Name, Active Toggle -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ category.icon }}</span>
                  <h3 class="text-base font-semibold text-gray-900">{{ category.name }}</h3>
                </div>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="category.active"
                    @change="updateActive(category)"
                    :aria-label="`Ativar categoria ${category.name}`"
                    class="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                  />
                </label>
              </div>

              <!-- Percentage Input + Calculated Value -->
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Porcentagem</label>
                  <div class="flex items-center gap-1">
                    <input
                      type="number"
                      :value="category.percentage"
                      @input="updatePercentage(category, $event)"
                      min="0"
                      max="100"
                      step="0.5"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                    <span class="text-xs text-gray-500">%</span>
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-blue-600 mb-1">Valor</label>
                  <p class="text-base font-bold text-blue-700 px-2 py-1.5 bg-blue-50 rounded">
                    {{ formatCurrency(getCalculatedAmount(category)) }}
                  </p>
                </div>
              </div>

              <!-- Historical Spending - Compact -->
              <div class="pt-3 border-t border-gray-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-gray-500">HISTÓRICO</span>
                  <button
                    @click="setPercentageFromAverage(category)"
                    class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Usar Média →
                  </button>
                </div>

                <div class="space-y-1.5">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600">{{ getMonthLabel(0) }}</span>
                    <span class="font-medium text-gray-900">{{ formatCurrency(category.spending.current) }}</span>
                  </div>

                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600">{{ getMonthLabel(-1) }}</span>
                    <span class="font-medium text-gray-700">{{ formatCurrency(category.spending.previous) }}</span>
                  </div>

                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600">{{ getMonthLabel(-2) }}</span>
                    <span class="font-medium text-gray-700">{{ formatCurrency(category.spending.twoMonthsBack) }}</span>
                  </div>

                  <div class="flex justify-between items-center text-xs pt-1.5 border-t border-gray-100">
                    <span class="font-semibold text-gray-700">📊 Média</span>
                    <span class="font-bold text-blue-600">{{ formatCurrency(category.spending.average) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <button
                @click="resetAllTemplates"
                :disabled="!hasModifications"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Resetar Tudo
              </button>

              <button
                @click="exportToJson"
                class="px-6 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar JSON
              </button>
            </div>

            <button
              @click="saveAllTemplates"
              :disabled="!hasModifications || currentTotal > 100 || saving"
              class="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ saving ? 'Salvando...' : 'Salvar Templates' }}
            </button>
          </div>

          <!-- Success/Error Messages -->
          <div v-if="successMessage" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center">
              <svg class="h-5 w-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-green-800">{{ successMessage }}</p>
            </div>
          </div>

          <div v-if="error" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
              <svg class="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-red-800">{{ error }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import type {
  BudgetTemplate,
  BudgetTemplateInput,
  BudgetTemplatesResponse,
} from '~/types/budgetTemplate'
import type { CategoriesResponse } from '~/types/transaction'
import { currentMonthKey, addMonthsToKey, daysInMonthKey, monthIndexOfKey } from '~/shared/dates'
import { isSpendingCategory, UNCATEGORIZED } from '~/shared/expenseRules'
import { getCategoryIcon } from '~/shared/categoryIcons'

const { formatCurrency: formatCurrencyValue, formatMonthName } = useFormatters()
const { selectedPerson: globalPerson, setPersonFilter } = usePersonFilter()

// This screen shows cents: a percentage of income rarely lands on a round real.
const formatCurrency = (value: number) => formatCurrencyValue(value, { decimals: true })

// State
const simulatedIncome = ref<number>(10000)
const successMessage = ref<string | null>(null)
const saving = ref(false)
const error = ref<string | null>(null)

// A template belongs to one person, so "Ambos" has no meaning here: fall back
// to Gabriel and tell the user which side they are looking at.
const templatePerson = computed<'Juliana' | 'Gabriel'>(() =>
  globalPerson.value === 'Ambos' ? 'Gabriel' : globalPerson.value
)
const showingPersonFallback = computed(() => globalPerson.value === 'Ambos')

/** Reference month and the two before it, in the order the payload comes back. */
const HISTORY_OFFSETS = [0, -1, -2]

// The history is anchored on the calendar month, not on a picker: this screen
// has no month selector.
const anchorMonth = currentMonthKey()

const monthRange = (key: string) => ({
  startDate: `${key}-01`,
  endDate: `${key}-${String(daysInMonthKey(key)).padStart(2, '0')}`,
})

// Data — reused across client-side navigation via getCachedData; `watch`
// still forces a refetch when the person changes.
const { data: categoriesData, status: categoriesStatus } = useAsyncData<CategoriesResponse | null>(
  'budget-templates-categories',
  () => $fetch<CategoriesResponse>('/api/categories', {
    query: { person: templatePerson.value },
  }),
  {
    default: () => null,
    watch: [templatePerson],
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

// The three history windows are one payload: they always move together, and a
// single key keeps the page from flickering through three loading states.
const { data: historyData, status: historyStatus } = useAsyncData<CategoriesResponse[]>(
  'budget-templates-history',
  () => Promise.all(HISTORY_OFFSETS.map(offset => {
    const { startDate, endDate } = monthRange(addMonthsToKey(anchorMonth, offset))
    return $fetch<CategoriesResponse>('/api/categories', {
      query: { person: templatePerson.value, startDate, endDate },
    })
  })),
  {
    default: () => [],
    watch: [templatePerson],
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

const {
  data: templatesData,
  status: templatesStatus,
  refresh: refreshTemplates,
} = useAsyncData<BudgetTemplatesResponse | null>(
  'budget-templates',
  () => $fetch<BudgetTemplatesResponse>('/api/budget-templates'),
  {
    default: () => null,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

const pending = computed(() =>
  categoriesStatus.value === 'pending' ||
  historyStatus.value === 'pending' ||
  templatesStatus.value === 'pending'
)

// Category budgets - unified view
interface CategoryBudget {
  name: string
  icon: string
  percentage: number
  active: boolean
  spending: {
    current: number
    previous: number
    twoMonthsBack: number
    average: number
  }
}

/**
 * Percentages the user changed, layered over the saved templates. Derived state
 * instead of a copy rebuilt by a watcher: watchers do not run during SSR, so a
 * copy renders as the empty state on the server and only fills after hydration.
 */
const edits = ref<Record<string, { percentage: number; active: boolean }>>({})
const hasModifications = computed(() => Object.keys(edits.value).length > 0)

const categoryBudgets = computed<CategoryBudget[]>(() =>
  (categoriesData.value?.categories || [])
    .filter(cat =>
      isSpendingCategory(cat.name) && cat.name.toLowerCase() !== UNCATEGORIZED.toLowerCase()
    )
    .map(category => {
      // Find existing template
      const existingTemplate = (templatesData.value?.templates || []).find(
        t => t.category === category.name && t.person === templatePerson.value
      )

      const edit = edits.value[category.name]

      return {
        name: category.name,
        icon: getCategoryIcon(category.name),
        percentage: edit?.percentage ?? existingTemplate?.percentage ?? 0,
        active: edit?.active ?? existingTemplate?.active ?? false,
        spending: {
          current: getCategorySpending(category.name, 0),
          previous: getCategorySpending(category.name, -1),
          twoMonthsBack: getCategorySpending(category.name, -2),
          average: getAverageSpending(category.name)
        }
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
)

function updatePercentage(category: CategoryBudget, event: Event) {
  const input = event.target as HTMLInputElement
  const percentage = parseFloat(input.value) || 0

  // Typing a percentage activates the category on its own.
  edits.value[category.name] = {
    percentage,
    active: percentage > 0 ? true : category.active,
  }
  successMessage.value = null
}

function updateActive(category: CategoryBudget) {
  edits.value[category.name] = {
    percentage: category.percentage,
    active: !category.active,
  }
  successMessage.value = null
}

// Computed para calcular o valor de cada categoria em tempo real
function getCalculatedAmount(category: CategoryBudget): number {
  return Math.round((simulatedIncome.value * (category.percentage || 0) / 100) * 100) / 100
}

// Total percentage validation
const currentTotal = computed(() => {
  return categoryBudgets.value
    .filter(c => c.active)
    .reduce((sum, c) => sum + (c.percentage || 0), 0)
})

// Total calculated value
const totalCalculated = computed(() => {
  return categoryBudgets.value
    .filter(c => c.active)
    .reduce((sum, c) => sum + getCalculatedAmount(c), 0)
})

// Helper functions
function getCategorySpending(categoryName: string, monthOffset: number): number {
  const data = historyData.value[HISTORY_OFFSETS.indexOf(monthOffset)]
  if (!data) return 0

  const category = data.categories.find(cat => cat.name === categoryName)
  return category?.total || 0
}

function getAverageSpending(categoryName: string): number {
  const total = getCategorySpending(categoryName, 0) +
                getCategorySpending(categoryName, -1) +
                getCategorySpending(categoryName, -2)
  return Math.round((total / 3) * 100) / 100
}

function getMonthLabel(monthOffset: number): string {
  const key = addMonthsToKey(anchorMonth, monthOffset)
  return `${formatMonthName(monthIndexOfKey(key), true)}/${key.slice(2, 4)}`
}

function setPercentageFromAverage(category: CategoryBudget) {
  const average = category.spending.average

  // Calculate percentage from average
  const percentage = (average / simulatedIncome.value) * 100

  // Round to 0.5%
  const roundedPercentage = Math.round(percentage * 2) / 2

  edits.value[category.name] = {
    // Limit between 0-100%
    percentage: Math.max(0, Math.min(100, roundedPercentage)),
    active: category.active,
  }
  successMessage.value = null
}

async function saveAllTemplates() {
  if (!currentTotal.value || currentTotal.value > 100) {
    error.value = 'A soma das porcentagens não pode exceder 100%'
    return
  }

  try {
    saving.value = true
    error.value = null

    // Build templates to save
    const templatesToSave: BudgetTemplateInput[] = categoryBudgets.value
      .filter(cat => cat.percentage > 0 || cat.active)
      .map(cat => ({
        category: cat.name,
        person: templatePerson.value,
        percentage: cat.percentage,
        active: cat.active
      }))

    await $fetch<BudgetTemplate[]>('/api/budget-templates', {
      method: 'POST',
      body: templatesToSave,
    })

    edits.value = {}
    successMessage.value = `Templates salvos com sucesso! Total: ${currentTotal.value.toFixed(2)}%`

    // The POST already invalidated the server-side template cache.
    await refreshTemplates()

    setTimeout(() => {
      successMessage.value = null
    }, 5000)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Erro ao salvar templates'
  } finally {
    saving.value = false
  }
}

// "Reset" means back to what is saved, which is already loaded — no refetch.
function resetAllTemplates() {
  edits.value = {}
  successMessage.value = null
}

function exportToJson() {
  const exportData = {
    exportDate: new Date().toISOString(),
    person: templatePerson.value,
    simulatedIncome: simulatedIncome.value,
    totalPercentage: currentTotal.value,
    totalCalculatedValue: totalCalculated.value,
    months: {
      current: getMonthLabel(0),
      previous: getMonthLabel(-1),
      twoMonthsBack: getMonthLabel(-2)
    },
    categories: categoryBudgets.value.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      percentage: cat.percentage,
      active: cat.active,
      calculatedValue: getCalculatedAmount(cat),
      spending: {
        [getMonthLabel(0)]: cat.spending.current,
        [getMonthLabel(-1)]: cat.spending.previous,
        [getMonthLabel(-2)]: cat.spending.twoMonthsBack,
        average: cat.spending.average
      }
    }))
  }

  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `budget-template-${templatePerson.value.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function selectPerson(person: 'Juliana' | 'Gabriel') {
  if (person === templatePerson.value && !showingPersonFallback.value) return

  if (hasModifications.value &&
      !confirm('Você tem alterações não salvas. Deseja realmente mudar de pessoa sem salvar?')) {
    return
  }

  setPersonFilter(person)
}

// Switching person changes which templates are being edited, so whatever was
// typed for the other one no longer applies.
watch(templatePerson, () => {
  edits.value = {}
  successMessage.value = null
})

// Watch simulated income and save to localStorage
watch(simulatedIncome, (newValue) => {
  if (import.meta.client) {
    localStorage.setItem('budgetSimulation', newValue.toString())
  }
})

// Lifecycle
onMounted(() => {
  // Load simulated income from localStorage
  const saved = localStorage.getItem('budgetSimulation')
  if (saved) {
    simulatedIncome.value = parseFloat(saved)
  }
})
</script>
