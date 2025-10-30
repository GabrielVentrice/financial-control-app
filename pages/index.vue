<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Header -->
      <header class="h-[72px] px-10 flex items-center justify-between border-b border-border-base">
        <div>
          <h1 class="text-[22px] font-medium">Dashboard Financeiro</h1>
          <p class="text-[13px] text-text-secondary mt-0.5">{{ getCurrentMonthName() }}</p>
        </div>
        <button
          @click="refresh"
          :disabled="loading"
          class="px-[18px] py-[10px] bg-accent-primary hover:bg-accent-primary-hover text-text-inverse rounded-md transition-all duration-200 ease-out font-medium text-[15px] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
        >
          {{ loading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </header>

      <!-- Content -->
      <main class="max-w-[1280px] px-10 py-8 space-y-12">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
          <p class="mt-4 text-text-secondary text-[15px]">Carregando dados financeiros...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="border-l-[3px] border-accent-danger bg-background-card border border-border-base p-5 rounded-lg">
          <h4 class="text-text-primary font-medium text-[15px]">Erro ao carregar dados</h4>
          <p class="text-text-secondary text-[13px] mt-1 leading-relaxed">{{ error }}</p>
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
              <h4 class="text-text-primary font-medium text-[15px]">{{ alert.title }}</h4>
              <p class="text-text-secondary text-[13px] mt-1 leading-relaxed">
                {{ alert.message }}
                <span v-if="alert.amount" class="font-medium text-text-primary">
                  ({{ formatCurrency(alert.amount) }})
                </span>
              </p>
            </div>
          </section>

          <!-- Summary Cards -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Balance Card -->
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-4">
              <p class="text-text-secondary text-[13px] font-medium uppercase tracking-wide">
                Saldo do Mês
              </p>
              <p
                :class="{
                  'text-accent-success': monthlyStats.balance >= 0,
                  'text-accent-danger': monthlyStats.balance < 0
                }"
                class="text-[40px] font-normal font-serif tracking-tight"
              >
                {{ formatCurrency(monthlyStats.balance) }}
              </p>
              <p class="text-text-muted text-[13px] leading-relaxed">
                {{ monthlyStats.transactionCount }} transações
              </p>
            </div>

            <!-- Income Card -->
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-4">
              <p class="text-text-secondary text-[13px] font-medium uppercase tracking-wide">
                Receitas
              </p>
              <p class="text-[40px] font-normal font-serif text-accent-success tracking-tight">
                {{ formatCurrency(monthlyStats.income) }}
              </p>
              <p class="text-text-muted text-[13px] leading-relaxed">Entradas do mês</p>
            </div>

            <!-- Expenses Card -->
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-4">
              <p class="text-text-secondary text-[13px] font-medium uppercase tracking-wide">
                Despesas
              </p>
              <p class="text-[40px] font-normal font-serif text-accent-danger tracking-tight">
                {{ formatCurrency(monthlyStats.expenses) }}
              </p>
              <p class="text-text-muted text-[13px] leading-relaxed">Saídas do mês</p>
            </div>
          </section>

          <!-- Charts and Categories -->
          <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Income vs Expenses Chart -->
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5">
              <h2 class="text-[16px] font-medium text-text-primary mb-6 tracking-tight">Receitas vs Despesas</h2>
              <div class="h-64">
                <Bar :data="chartData" :options="chartOptions" />
              </div>
            </div>

            <!-- Top Categories -->
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5">
              <h2 class="text-[16px] font-medium text-text-primary mb-6 tracking-tight">Top Categorias de Gastos</h2>
              <div v-if="topCategories.length > 0" class="space-y-5">
                <div
                  v-for="category in topCategories"
                  :key="category.name"
                  class="space-y-2"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-[15px] text-text-primary truncate">
                      {{ category.name }}
                    </span>
                    <span class="text-[15px] font-semibold text-text-primary">
                      {{ formatCurrency(category.total) }}
                    </span>
                  </div>
                  <div class="w-full bg-background-section rounded-full h-2">
                    <div
                      class="bg-accent-primary h-2 rounded-full transition-all duration-300 ease-out"
                      :style="{ width: category.percentage + '%' }"
                    ></div>
                  </div>
                  <div class="flex justify-between text-[13px] text-text-muted">
                    <span>{{ category.count }} transações</span>
                    <span>{{ category.percentage.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8 text-text-secondary text-[15px]">
                Nenhuma categoria de gasto este mês
              </div>
            </div>
          </section>

          <!-- Forecast and Upcoming -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Monthly Forecast -->
            <div class="lg:col-span-2 bg-background-card border border-border-base rounded-lg px-6 py-5">
              <h2 class="text-[16px] font-medium text-text-primary mb-6 tracking-tight">Previsão Mensal</h2>

              <!-- Forecast Cards -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-background-section rounded-md p-4 space-y-2">
                  <p class="text-[13px] text-text-secondary font-medium">Receita Projetada</p>
                  <p class="text-[22px] font-medium text-accent-success">
                    {{ formatCurrency(forecast.projectedIncome) }}
                  </p>
                </div>
                <div class="bg-background-section rounded-md p-4 space-y-2">
                  <p class="text-[13px] text-text-secondary font-medium">Despesas Futuras</p>
                  <p class="text-[22px] font-medium text-accent-danger">
                    {{ formatCurrency(forecast.upcomingExpenses) }}
                  </p>
                </div>
                <div class="bg-background-section rounded-md p-4 space-y-2">
                  <p class="text-[13px] text-text-secondary font-medium">Saldo Projetado</p>
                  <p
                    :class="{
                      'text-accent-success': forecast.projectedBalance >= 0,
                      'text-accent-danger': forecast.projectedBalance < 0
                    }"
                    class="text-[22px] font-medium"
                  >
                    {{ formatCurrency(forecast.projectedBalance) }}
                  </p>
                </div>
              </div>

              <!-- Upcoming Expenses List -->
              <div v-if="upcomingExpenses.length > 0" class="border-t border-divider pt-5">
                <h3 class="text-[15px] font-medium text-text-primary mb-4">
                  Próximas Despesas ({{ upcomingExpenses.length }})
                </h3>
                <div class="space-y-3 max-h-48 overflow-y-auto">
                  <div
                    v-for="expense in upcomingExpenses.slice(0, 5)"
                    :key="expense.transactionId"
                    class="flex justify-between items-center py-3 border-b border-divider last:border-0"
                  >
                    <div class="flex-1">
                      <p class="text-[15px] text-text-primary">{{ expense.description }}</p>
                      <p class="text-[13px] text-text-muted">{{ formatDate(expense.date) }}</p>
                    </div>
                    <span class="font-semibold text-[15px] text-accent-danger ml-4">
                      {{ formatCurrency(Math.abs(expense.amount)) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="border-t border-divider pt-5 text-center text-text-secondary text-[15px]">
                Nenhuma despesa futura programada
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5">
              <h2 class="text-[16px] font-medium text-text-primary mb-6 tracking-tight">Ações Rápidas</h2>
              <div class="space-y-3">
                <NuxtLink
                  to="/transactions"
                  class="flex items-center gap-3 p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out border border-border-base"
                >
                  <div class="text-xl">📝</div>
                  <div>
                    <p class="font-medium text-text-primary text-[15px]">Ver Transações</p>
                    <p class="text-[13px] text-text-muted">Lista completa</p>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/categories"
                  class="flex items-center gap-3 p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out border border-border-base"
                >
                  <div class="text-xl">📊</div>
                  <div>
                    <p class="font-medium text-text-primary text-[15px]">Categorias</p>
                    <p class="text-[13px] text-text-muted">Análise detalhada</p>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/installments"
                  class="flex items-center gap-3 p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out border border-border-base"
                >
                  <div class="text-xl">💳</div>
                  <div>
                    <p class="font-medium text-text-primary text-[15px]">Parcelamentos</p>
                    <p class="text-[13px] text-text-muted">Timeline e análise</p>
                  </div>
                </NuxtLink>

                <button
                  @click="refresh"
                  class="w-full flex items-center gap-3 p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out border border-border-base"
                >
                  <div class="text-xl">🔄</div>
                  <div class="text-left">
                    <p class="font-medium text-text-primary text-[15px]">Atualizar Dados</p>
                    <p class="text-[13px] text-text-muted">Sincronizar planilha</p>
                  </div>
                </button>
              </div>

              <!-- Filter Info -->
              <div class="mt-6 p-3 bg-background-section rounded-md border border-border-base">
                <p class="text-[13px] font-medium text-text-muted mb-2">Filtro Atual:</p>
                <span class="inline-block px-3 py-1.5 bg-accent-primary/10 text-accent-primary rounded-md text-[13px] font-semibold border border-accent-primary/20">
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
const monthlyStats = computed(() => getCurrentMonthStats(filteredTransactions.value))
const topCategories = computed(() => getTopCategories(filteredTransactions.value, 5))
const upcomingExpenses = computed(() => getUpcomingExpenses(filteredTransactions.value))
const alerts = computed(() => generateAlerts(filteredTransactions.value))
const forecast = computed(() => getMonthlyForecast(filteredTransactions.value))

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
