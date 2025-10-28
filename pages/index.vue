<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
      <div class="px-8 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white">Dashboard Financeiro</h1>
            <p class="text-primary-100 mt-1">{{ getCurrentMonthName() }} - Visão geral rápida</p>
          </div>
          <button
            @click="refresh"
            :disabled="loading"
            class="px-6 py-2 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors disabled:bg-gray-400 disabled:text-gray-600 font-medium shadow-md"
          >
            {{ loading ? 'Atualizando...' : 'Atualizar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="px-8 py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      <p class="mt-4 text-gray-600">Carregando dados financeiros...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="px-8 pt-8">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-800 font-medium">Erro ao carregar dados</p>
        <p class="text-red-600 text-sm mt-2">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="!loading" class="px-8 py-8 space-y-6">
      <!-- Important Alerts -->
      <div v-if="alerts.length > 0" class="space-y-3">
        <div
          v-for="(alert, index) in alerts"
          :key="index"
          :class="{
            'bg-yellow-50 border-yellow-200': alert.type === 'warning',
            'bg-red-50 border-red-200': alert.type === 'danger',
            'bg-blue-50 border-blue-200': alert.type === 'info'
          }"
          class="border rounded-lg p-4 flex items-start gap-3"
        >
          <div
            :class="{
              'text-yellow-600': alert.type === 'warning',
              'text-red-600': alert.type === 'danger',
              'text-blue-600': alert.type === 'info'
            }"
            class="text-xl mt-0.5"
          >
            {{ alert.type === 'danger' ? '⚠️' : alert.type === 'warning' ? '⚡' : 'ℹ️' }}
          </div>
          <div class="flex-1">
            <p
              :class="{
                'text-yellow-900': alert.type === 'warning',
                'text-red-900': alert.type === 'danger',
                'text-blue-900': alert.type === 'info'
              }"
              class="font-semibold"
            >
              {{ alert.title }}
            </p>
            <p
              :class="{
                'text-yellow-700': alert.type === 'warning',
                'text-red-700': alert.type === 'danger',
                'text-blue-700': alert.type === 'info'
              }"
              class="text-sm mt-1"
            >
              {{ alert.message }}
              <span v-if="alert.amount" class="font-medium">
                ({{ formatCurrency(alert.amount) }})
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Main Financial Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Current Balance -->
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-500">
          <p class="text-gray-600 text-sm font-medium uppercase tracking-wide">Saldo do Mês</p>
          <p
            :class="{
              'text-green-600': monthlyStats.balance >= 0,
              'text-red-600': monthlyStats.balance < 0
            }"
            class="text-4xl font-bold mt-3"
          >
            {{ formatCurrency(monthlyStats.balance) }}
          </p>
          <p class="text-gray-500 text-xs mt-2">
            {{ monthlyStats.transactionCount }} transações
          </p>
        </div>

        <!-- Income -->
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <p class="text-gray-600 text-sm font-medium uppercase tracking-wide">Receitas</p>
          <p class="text-4xl font-bold text-green-600 mt-3">
            {{ formatCurrency(monthlyStats.income) }}
          </p>
          <p class="text-gray-500 text-xs mt-2">Entradas do mês</p>
        </div>

        <!-- Expenses -->
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <p class="text-gray-600 text-sm font-medium uppercase tracking-wide">Despesas</p>
          <p class="text-4xl font-bold text-red-600 mt-3">
            {{ formatCurrency(monthlyStats.expenses) }}
          </p>
          <p class="text-gray-500 text-xs mt-2">Saídas do mês</p>
        </div>
      </div>

      <!-- Income vs Expenses Chart & Top Categories -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Chart -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">Receitas vs Despesas</h2>
          <div class="h-64">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Top Categories -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">Top Categorias de Gastos</h2>
          <div v-if="topCategories.length > 0" class="space-y-4">
            <div
              v-for="category in topCategories"
              :key="category.name"
              class="space-y-2"
            >
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700 truncate">
                  {{ category.name }}
                </span>
                <span class="text-sm font-bold text-gray-900">
                  {{ formatCurrency(category.total) }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  class="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                  :style="{ width: category.percentage + '%' }"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-gray-500">
                <span>{{ category.count }} transações</span>
                <span>{{ category.percentage.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            Nenhuma categoria de gasto este mês
          </div>
        </div>
      </div>

      <!-- Monthly Forecast & Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Monthly Forecast -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">Previsão Mensal</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-green-50 rounded-lg p-4">
              <p class="text-sm text-green-700 font-medium">Receita Projetada</p>
              <p class="text-2xl font-bold text-green-600 mt-1">
                {{ formatCurrency(forecast.projectedIncome) }}
              </p>
            </div>
            <div class="bg-red-50 rounded-lg p-4">
              <p class="text-sm text-red-700 font-medium">Despesas Futuras</p>
              <p class="text-2xl font-bold text-red-600 mt-1">
                {{ formatCurrency(forecast.upcomingExpenses) }}
              </p>
            </div>
            <div class="bg-blue-50 rounded-lg p-4">
              <p class="text-sm text-blue-700 font-medium">Saldo Projetado</p>
              <p
                :class="{
                  'text-green-600': forecast.projectedBalance >= 0,
                  'text-red-600': forecast.projectedBalance < 0
                }"
                class="text-2xl font-bold mt-1"
              >
                {{ formatCurrency(forecast.projectedBalance) }}
              </p>
            </div>
          </div>

          <!-- Upcoming Expenses List -->
          <div v-if="upcomingExpenses.length > 0" class="border-t pt-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              Próximas Despesas ({{ upcomingExpenses.length }})
            </h3>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="expense in upcomingExpenses.slice(0, 5)"
                :key="expense.transactionId"
                class="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0"
              >
                <div class="flex-1">
                  <p class="font-medium text-gray-700">{{ expense.description }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(expense.date) }}</p>
                </div>
                <span class="font-bold text-red-600 ml-4">
                  {{ formatCurrency(Math.abs(expense.amount)) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="border-t pt-4 text-center text-gray-500 text-sm">
            Nenhuma despesa futura programada
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">Ações Rápidas</h2>
          <div class="space-y-3">
            <NuxtLink
              to="/transactions"
              class="flex items-center gap-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
            >
              <div class="text-2xl">📝</div>
              <div>
                <p class="font-semibold text-primary-900 text-sm">Ver Transações</p>
                <p class="text-xs text-primary-700">Lista completa</p>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/categories"
              class="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
            >
              <div class="text-2xl">📊</div>
              <div>
                <p class="font-semibold text-purple-900 text-sm">Categorias</p>
                <p class="text-xs text-purple-700">Análise detalhada</p>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/installments"
              class="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
            >
              <div class="text-2xl">💳</div>
              <div>
                <p class="font-semibold text-orange-900 text-sm">Parcelamentos</p>
                <p class="text-xs text-orange-700">Timeline e análise</p>
              </div>
            </NuxtLink>

            <button
              @click="refresh"
              class="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div class="text-2xl">🔄</div>
              <div class="text-left">
                <p class="font-semibold text-gray-900 text-sm">Atualizar Dados</p>
                <p class="text-xs text-gray-700">Sincronizar planilha</p>
              </div>
            </button>
          </div>

          <!-- Filter Info -->
          <div class="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-xs font-medium text-gray-600 mb-1">Filtro Atual:</p>
            <span class="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold">
              {{ selectedPerson }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
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

const { selectedPerson, identifyPerson } = usePersonFilter()

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
      const person = identifyPerson(transaction.origin)
      return person === selectedPerson.value
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
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
      borderWidth: 2
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
      callbacks: {
        label: (context: any) => {
          return formatCurrency(context.parsed.y)
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
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
