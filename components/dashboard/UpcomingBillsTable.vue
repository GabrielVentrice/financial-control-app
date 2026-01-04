<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900">Próximas Despesas</h3>
      <span class="text-xs text-gray-500">
        {{ displayBills.length }} {{ displayBills.length === 1 ? 'item' : 'itens' }}
      </span>
    </div>

    <!-- Bills List -->
    <div v-if="displayBills.length > 0" class="divide-y divide-gray-100">
      <div
        v-for="bill in displayBills"
        :key="bill.transactionId"
        class="px-4 py-3 hover:bg-gray-50 transition-colors duration-200 group"
      >
        <div class="flex items-start justify-between gap-4">
          <!-- Left: Description and Date -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate mb-0.5">
              {{ bill.description }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">
                {{ formatDate(bill.date, 'medium') }}
              </span>
              <span class="text-xs text-gray-400">•</span>
              <span class="text-xs text-gray-500">
                {{ formatRelativeDate(bill.date) }}
              </span>
            </div>
          </div>

          <!-- Right: Amount -->
          <div class="text-right flex-shrink-0">
            <p class="text-sm font-semibold text-negative">
              {{ formatCurrency(Math.abs(bill.amount)) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-8 text-center">
      <div class="text-4xl mb-2 opacity-20">📅</div>
      <p class="text-sm font-medium text-gray-500">Nenhuma despesa agendada</p>
      <p class="text-xs text-gray-400 mt-1">Próximos 30 dias</p>
    </div>

    <!-- Footer - Show more link if has more items -->
    <div
      v-if="bills.length > limit"
      class="px-4 py-3 border-t border-gray-100 bg-gray-50/50"
    >
      <NuxtLink
        to="/transactions"
        class="text-xs text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center gap-1"
      >
        <span>Ver mais {{ bills.length - limit }} despesas</span>
        <span>→</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction } from '~/types/transaction'

interface Props {
  bills: Transaction[]
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 6
})

const { formatCurrency, formatDate, formatRelativeDate } = useFormatters()

// Limit bills to display
const displayBills = computed(() => {
  return props.bills.slice(0, props.limit)
})
</script>
