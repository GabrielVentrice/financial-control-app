<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Header -->
      <header class="h-[72px] px-4 sm:px-6 lg:px-10 flex items-center justify-between border-b border-border-base">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <!-- Mobile menu button -->
        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="lg:hidden p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>          <div class="min-w-0 flex-1">
            <h1 class="text-18 sm:text-20 lg:text-22 font-medium tracking-tight truncate">Dashboard Financeiro</h1>
            <p class="text-13 text-text-secondary mt-0.5 leading-normal hidden sm:block">{{ getCurrentMonthName() }}</p>
          </div>
        </div>
        <button
          @click="refresh"
          :disabled="loading"
          class="px-3 py-2 sm:px-[18px] sm:py-[10px] bg-accent-primary hover:bg-accent-primary-hover text-text-inverse rounded-md transition-all duration-200 ease-out font-medium text-13 sm:text-15 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <span class="hidden sm:inline">{{ loading ? 'Atualizando...' : 'Atualizar' }}</span>
          <span class="sm:hidden">🔄</span>
        </button>
      </header>

      <!-- Content -->
      <main class="max-w-[1280px] px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-8 lg:space-y-12">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
          <p class="mt-4 text-text-secondary text-15">Carregando dados financeiros...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="border-l-[3px] border-l-accent-danger bg-background-card border border-border-base p-5 rounded-lg">
          <h4 class="text-text-primary font-medium text-15">Erro ao carregar dados</h4>
          <p class="text-text-secondary text-13 mt-1 leading-normal">{{ error }}</p>
        </div>

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Alerts -->
          <section v-if="alerts.length > 0" class="space-y-4">
            <div
              v-for="(alert, index) in alerts"
              :key="index"
              :class="{
                'border-l-accent-warning': alert.type === 'warning',
                'border-l-accent-danger': alert.type === 'danger',
                'border-l-accent-info': alert.type === 'info'
              }"
              class="border-l-[3px] bg-background-card border border-border-base px-6 py-[14px] rounded-lg"
            >
              <h4 class="text-text-primary font-medium text-15">{{ alert.title }}</h4>
              <p class="text-text-secondary text-13 mt-1 leading-normal">
                {{ alert.message }}
                <span v-if="alert.amount" class="font-medium text-text-primary">
                  ({{ formatCurrency(alert.amount) }})
                </span>
              </p>
            </div>
          </section>

          <!-- Summary Cards -->
          <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Balance Card -->
            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Saldo do Mês
              </p>
              <p
                :class="{
                  'text-accent-success': monthlyStats.balance >= 0,
                  'text-accent-danger': monthlyStats.balance < 0
                }"
                class="text-[28px] sm:text-[32px] lg:text-[40px] font-normal font-serif tracking-tight break-all"
              >
                {{ formatCurrency(monthlyStats.balance) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">
                {{ monthlyStats.transactionCount }} transações
              </p>
            </div>

            <!-- Income Card -->
            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Receitas
              </p>
              <p class="text-[28px] sm:text-[32px] lg:text-[40px] font-normal font-serif text-accent-success tracking-tight break-all">
                {{ formatCurrency(monthlyStats.income) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Entradas do mês</p>
            </div>

            <!-- Expenses Card -->
            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Despesas
              </p>
              <p class="text-[28px] sm:text-[32px] lg:text-[40px] font-normal font-serif text-accent-danger tracking-tight break-all">
                {{ formatCurrency(monthlyStats.expenses) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Saídas do mês</p>
            </div>
          </section>

          <!-- Charts and Categories -->
          <section class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <!-- Income vs Expenses Chart -->
            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5">
              <h2 class="text-15 sm:text-16 font-medium text-text-primary mb-4 sm:mb-6 tracking-tight">Receitas vs Despesas</h2>
              <div class="h-48 sm:h-56 lg:h-64">
                <Bar :data="chartData" :options="chartOptions" />
              </div>
            </div>

            <!-- Top Categories -->
            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5">
              <h2 class="text-15 sm:text-16 font-medium text-text-primary mb-4 sm:mb-6 tracking-tight">Top Categorias de Gastos</h2>
              <div v-if="topCategories.length > 0" class="space-y-4 sm:space-y-5">
                <div
                  v-for="category in topCategories"
                  :key="category.name"
                  class="space-y-2"
                >
                  <div class="flex justify-between items-start gap-2">
                    <span class="text-14 sm:text-15 text-text-primary truncate flex-1">
                      {{ category.name }}
                    </span>
                    <span class="text-14 sm:text-15 font-semibold text-text-primary whitespace-nowrap">
                      {{ formatCurrency(category.total) }}
                    </span>
                  </div>
                  <div class="w-full bg-background-section rounded-full h-2">
                    <div
                      class="bg-accent-primary h-2 rounded-full transition-all duration-300 ease-out"
                      :style="{ width: category.percentage + '%' }"
                    ></div>
                  </div>
                  <div class="flex justify-between text-12 sm:text-13 text-text-muted">
                    <span>{{ category.count }} transações</span>
                    <span>{{ category.percentage.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-6 sm:py-8 text-text-secondary text-14 sm:text-15">
                Nenhuma categoria de gasto este mês
              </div>
            </div>
          </section>

          <!-- Forecast and Upcoming -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <!-- Monthly Forecast -->
            <div class="lg:col-span-2 bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5">
              <h2 class="text-15 sm:text-16 font-medium text-text-primary mb-4 sm:mb-6 tracking-tight">Previsão Mensal</h2>

              <!-- Forecast Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div class="bg-background-section rounded-md p-3 sm:p-4 space-y-1 sm:space-y-2">
                  <p class="text-12 sm:text-13 text-text-secondary font-medium">Receita Projetada</p>
                  <p class="text-18 sm:text-20 lg:text-22 font-medium text-accent-success tracking-tight break-all">
                    {{ formatCurrency(forecast.projectedIncome) }}
                  </p>
                </div>
                <div class="bg-background-section rounded-md p-3 sm:p-4 space-y-1 sm:space-y-2">
                  <p class="text-12 sm:text-13 text-text-secondary font-medium">Despesas Futuras</p>
                  <p class="text-18 sm:text-20 lg:text-22 font-medium text-accent-danger tracking-tight break-all">
                    {{ formatCurrency(forecast.upcomingExpenses) }}
                  </p>
                </div>
                <div class="bg-background-section rounded-md p-3 sm:p-4 space-y-1 sm:space-y-2">
                  <p class="text-12 sm:text-13 text-text-secondary font-medium">Saldo Projetado</p>
                  <p
                    :class="{
                      'text-accent-success': forecast.projectedBalance >= 0,
                      'text-accent-danger': forecast.projectedBalance < 0
                    }"
                    class="text-18 sm:text-20 lg:text-22 font-medium tracking-tight break-all"
                  >
                    {{ formatCurrency(forecast.projectedBalance) }}
                  </p>
                </div>
              </div>

              <!-- Upcoming Expenses List -->
              <div v-if="upcomingExpenses.length > 0" class="border-t border-divider pt-4 sm:pt-5">
                <h3 class="text-14 sm:text-15 font-medium text-text-primary mb-3 sm:mb-4">
                  Próximas Despesas ({{ upcomingExpenses.length }})
                </h3>
                <div class="space-y-2 sm:space-y-3 max-h-40 sm:max-h-48 overflow-y-auto">
                  <div
                    v-for="expense in upcomingExpenses.slice(0, 5)"
                    :key="expense.transactionId"
                    class="flex justify-between items-start gap-3 py-2 sm:py-3 border-b border-divider last:border-0"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-14 sm:text-15 text-text-primary truncate">{{ expense.description }}</p>
                      <p class="text-12 sm:text-13 text-text-muted">{{ formatDate(expense.date) }}</p>
                    </div>
                    <span class="font-semibold text-14 sm:text-15 text-accent-danger whitespace-nowrap">
                      {{ formatCurrency(Math.abs(expense.amount)) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="border-t border-divider pt-4 sm:pt-5 text-center text-text-secondary text-14 sm:text-15">
                Nenhuma despesa futura programada
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5">
              <h2 class="text-15 sm:text-16 font-medium text-text-primary mb-4 sm:mb-6 tracking-tight">Ações Rápidas</h2>
              <div class="space-y-2 sm:space-y-3">
                <NuxtLink
                  to="/transactions"
                  class="flex items-center gap-3 p-3 sm:p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out border border-border-base"
                >
                  <div class="text-lg sm:text-xl">📝</div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-text-primary text-14 sm:text-15 truncate">Ver Transações</p>
                    <p class="text-12 sm:text-13 text-text-muted">Lista completa</p>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/categories"
                  class="flex items-center gap-3 p-3 sm:p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out border border-border-base"
                >
                  <div class="text-lg sm:text-xl">📊</div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-text-primary text-14 sm:text-15 truncate">Categorias</p>
                    <p class="text-12 sm:text-13 text-text-muted">Análise detalhada</p>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/installments"
                  class="flex items-center gap-3 p-3 sm:p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out border border-border-base"
                >
                  <div class="text-lg sm:text-xl">💳</div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-text-primary text-14 sm:text-15 truncate">Parcelamentos</p>
                    <p class="text-12 sm:text-13 text-text-muted">Timeline e análise</p>
                  </div>
                </NuxtLink>

                <button
                  @click="refresh"
                  class="w-full flex items-center gap-3 p-3 sm:p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out border border-border-base"
                >
                  <div class="text-lg sm:text-xl">🔄</div>
                  <div class="text-left min-w-0 flex-1">
                    <p class="font-medium text-text-primary text-14 sm:text-15 truncate">Atualizar Dados</p>
                    <p class="text-12 sm:text-13 text-text-muted">Sincronizar planilha</p>
                  </div>
                </button>
              </div>

              <!-- Filter Info -->
              <div class="mt-4 sm:mt-6 p-3 bg-background-section rounded-md border border-border-base">
                <p class="text-12 sm:text-13 font-medium text-text-muted mb-2">Filtro Atual:</p>
                <span class="inline-block px-2 sm:px-3 py-1 sm:py-1.5 bg-accent-primary/10 text-accent-primary rounded-md text-12 sm:text-13 font-semibold border border-accent-primary/20">
                  {{ selectedPerson }}
                </span>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// Composables
const {
  transactions,
  loading,
  error,
  fetchTransactions,
} = useTransactions()

const { selectedPerson } = usePersonFilter()
const { toggleMobileMenu } = useMobileMenu()

const {
  getCurrentMonthStats,
  getTopCategories,
  getUpcomingExpenses,
  generateAlerts,
  getMonthlyForecast
} = useDashboardAnalytics()

// Computed - Filter transactions by person
const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => {
      return transaction.person === selectedPerson.value
    })
  }

  return filtered
})

// Dashboard Analytics
const monthlyStats = computed(() => getCurrentMonthStats([...filteredTransactions.value]))
const topCategories = computed(() => getTopCategories([...filteredTransactions.value], 5))
const upcomingExpenses = computed(() => getUpcomingExpenses([...filteredTransactions.value]))
const alerts = computed(() => generateAlerts([...filteredTransactions.value]))
const forecast = computed(() => getMonthlyForecast([...filteredTransactions.value]))

// Chart Data
const chartData = computed(() => ({
  labels: ['Receitas', 'Despesas'],
  datasets: [
    {
      label: 'Valores do Mês',
      data: [monthlyStats.value.income, monthlyStats.value.expenses],
      backgroundColor: ['rgba(61, 214, 140, 0.9)', 'rgba(227, 77, 77, 0.9)'],
      borderColor: ['#3DD68C', '#E34D4D'],
      borderWidth: 0,
      borderRadius: 8,
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#1F1F1F',
      titleColor: '#F3F3F3',
      bodyColor: '#B0B0B0',
      borderColor: '#2E2E2E',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context: any) => {
          return formatCurrency(context.parsed.y)
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#B0B0B0',
        font: {
          size: 13
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#2E2E2E',
        drawBorder: false,
      },
      ticks: {
        color: '#B0B0B0',
        font: {
          size: 13
        },
        callback: (value: any) => {
          return 'R$ ' + value.toLocaleString('pt-BR')
        }
      }
    }
  }
}

// Methods
const refresh = async () => {
  await fetchTransactions()
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const getCurrentMonthName = () => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const now = new Date()
  return months[now.getMonth()]
}

// Lifecycle
onMounted(() => {
  fetchTransactions()
})
</script>
