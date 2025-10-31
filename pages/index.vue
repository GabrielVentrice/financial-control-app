<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Header -->
      <PageHeader
        title="Dashboard Financeiro"
        :subtitle="getCurrentMonthName()"
      >
        <template #actions>
          <BaseButton
            @click="refresh"
            :loading="loading"
            :disabled="loading"
          >
            Atualizar
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8 space-y-12">
        <!-- Loading State -->
        <LoadingState
          v-if="loading"
          message="Carregando dados financeiros..."
        />

        <!-- Error State -->
        <ErrorState
          v-else-if="error"
          :message="error"
        />

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Alerts -->
          <section v-if="alerts.length > 0" class="space-y-3">
            <div
              v-for="(alert, index) in alerts"
              :key="index"
              :class="{
                'border-l-accent-warning': alert.type === 'warning',
                'border-l-accent-danger': alert.type === 'danger',
                'border-l-accent-info': alert.type === 'info'
              }"
              class="border-l-[3px] bg-background-card border border-border-base px-5 py-4 rounded-lg"
            >
              <h4 class="text-text-primary font-medium text-[15px]">{{ alert.title }}</h4>
              <p class="text-text-secondary text-[13px] mt-1.5">
                {{ alert.message }}
                <span v-if="alert.amount" class="font-medium text-text-primary">
                  ({{ formatCurrency(alert.amount) }})
                </span>
              </p>
            </div>
          </section>

          <!-- Summary Cards -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Balance Card -->
            <KpiCard
              label="Saldo do Mês"
              :value="monthlyStats.balance"
              :subtitle="`${monthlyStats.transactionCount} transações`"
              format="currency"
              :value-color="monthlyStats.balance >= 0 ? 'success' : 'danger'"
            />

            <!-- Income Card -->
            <KpiCard
              label="Receitas"
              :value="monthlyStats.income"
              subtitle="Entradas do mês"
              format="currency"
              value-color="success"
            />

            <!-- Expenses Card -->
            <KpiCard
              label="Despesas"
              :value="monthlyStats.expenses"
              subtitle="Saídas do mês"
              format="currency"
              value-color="danger"
            />
          </section>

          <!-- Charts and Categories -->
          <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Income vs Expenses Chart -->
            <div class="bg-background-card border border-border-subtle rounded-lg px-6 py-6">
              <h2 class="text-[16px] font-medium text-text-primary mb-6">Receitas vs Despesas</h2>
              <div class="h-64">
                <Bar :data="chartData" :options="chartOptions" />
              </div>
            </div>

            <!-- Top Categories -->
            <div class="bg-background-card border border-border-subtle rounded-lg px-6 py-6">
              <h2 class="text-[16px] font-medium text-text-primary mb-6">Top Categorias de Gastos</h2>
              <div v-if="topCategories.length > 0" class="space-y-6">
                <div
                  v-for="category in topCategories"
                  :key="category.name"
                  class="space-y-2.5"
                >
                  <div class="flex justify-between items-baseline gap-3">
                    <span class="text-[15px] text-text-primary truncate flex-1">
                      {{ category.name }}
                    </span>
                    <span class="text-[15px] font-medium text-text-primary whitespace-nowrap">
                      {{ formatCurrency(category.total) }}
                    </span>
                  </div>
                  <div class="w-full bg-background-section rounded-full h-1.5">
                    <div
                      class="bg-accent-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                      :style="{ width: category.percentage + '%' }"
                    ></div>
                  </div>
                  <div class="flex justify-between text-[13px] text-text-muted">
                    <span>{{ category.count }} transações</span>
                    <span>{{ category.percentage.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-12 text-text-muted text-[15px]">
                Nenhuma categoria de gasto este mês
              </div>
            </div>
          </section>

          <!-- Forecast and Upcoming -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Monthly Forecast -->
            <div class="lg:col-span-2 bg-background-card border border-border-subtle rounded-lg px-6 py-6">
              <h2 class="text-[16px] font-medium text-text-primary mb-6">Previsão Mensal</h2>

              <!-- Forecast Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div class="bg-background-section rounded-md px-4 py-4 space-y-2 border border-border-base hover:border-border-subtle transition-colors">
                  <p class="text-[13px] text-text-muted font-medium">Receita Projetada</p>
                  <p class="text-[24px] font-semibold text-accent-success">
                    {{ formatCurrency(forecast.projectedIncome) }}
                  </p>
                </div>
                <div class="bg-background-section rounded-md px-4 py-4 space-y-2 border border-border-base hover:border-border-subtle transition-colors">
                  <p class="text-[13px] text-text-muted font-medium">Despesas Futuras</p>
                  <p class="text-[24px] font-semibold text-accent-danger">
                    {{ formatCurrency(forecast.upcomingExpenses) }}
                  </p>
                </div>
                <div class="bg-background-section rounded-md px-4 py-4 space-y-2 border border-border-base hover:border-border-subtle transition-colors">
                  <p class="text-[13px] text-text-muted font-medium">Saldo Projetado</p>
                  <p
                    :class="{
                      'text-accent-success': forecast.projectedBalance >= 0,
                      'text-accent-danger': forecast.projectedBalance < 0
                    }"
                    class="text-[24px] font-semibold"
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
                <div class="space-y-0 max-h-48 overflow-y-auto">
                  <div
                    v-for="expense in upcomingExpenses.slice(0, 5)"
                    :key="expense.transactionId"
                    class="flex justify-between items-center gap-4 py-3 border-b border-divider last:border-0"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-[15px] text-text-primary truncate">{{ expense.description }}</p>
                      <p class="text-[13px] text-text-muted mt-0.5">{{ formatDate(expense.date) }}</p>
                    </div>
                    <span class="font-medium text-[15px] text-accent-danger whitespace-nowrap">
                      {{ formatCurrency(Math.abs(expense.amount)) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="border-t border-divider pt-5 text-center text-text-muted text-[15px]">
                Nenhuma despesa futura programada
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-background-card border border-border-subtle rounded-lg px-6 py-6">
              <h2 class="text-[16px] font-medium text-text-primary mb-6">Ações Rápidas</h2>
              <div class="space-y-3">
                <NuxtLink
                  to="/transactions"
                  class="flex items-center gap-3 p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out"
                >
                  <div class="text-xl">📝</div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-text-primary text-[15px]">Ver Transações</p>
                    <p class="text-[13px] text-text-muted mt-0.5">Lista completa</p>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/categories"
                  class="flex items-center gap-3 p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out"
                >
                  <div class="text-xl">📊</div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-text-primary text-[15px]">Categorias</p>
                    <p class="text-[13px] text-text-muted mt-0.5">Análise detalhada</p>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/installments"
                  class="flex items-center gap-3 p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out"
                >
                  <div class="text-xl">💳</div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-text-primary text-[15px]">Parcelamentos</p>
                    <p class="text-[13px] text-text-muted mt-0.5">Timeline e análise</p>
                  </div>
                </NuxtLink>

                <button
                  @click="refresh"
                  class="w-full flex items-center gap-3 p-4 bg-background-section hover:bg-background-hover rounded-md transition-all duration-150 ease-out"
                >
                  <div class="text-xl">🔄</div>
                  <div class="text-left min-w-0 flex-1">
                    <p class="font-medium text-text-primary text-[15px]">Atualizar Dados</p>
                    <p class="text-[13px] text-text-muted mt-0.5">Sincronizar planilha</p>
                  </div>
                </button>
              </div>

              <!-- Filter Info -->
              <div class="mt-6 p-4 bg-background-section rounded-md">
                <p class="text-[13px] font-medium text-text-muted mb-2">Filtro Atual</p>
                <span class="inline-block px-3 py-1.5 bg-accent-primary/10 text-accent-primary rounded-md text-[13px] font-medium border border-accent-primary/20">
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
