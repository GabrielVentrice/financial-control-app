<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900">Top Categorias</h3>
      <NuxtLink
        to="/categories"
        class="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
      >
        Ver todas →
      </NuxtLink>
    </div>

    <!-- Categories List -->
    <div v-if="categories.length > 0" class="p-4 space-y-4">
      <div
        v-for="category in categories"
        :key="category.name"
        class="group"
      >
        <!-- Category Header -->
        <div class="flex items-baseline justify-between gap-3 mb-2">
          <span class="text-sm font-medium text-gray-900 truncate">
            {{ category.name }}
          </span>
          <span class="text-sm font-semibold text-gray-900 whitespace-nowrap">
            {{ formatCurrency(category.total) }}
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="flex items-center gap-3">
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              class="h-2 rounded-full transition-all duration-500 ease-out"
              :class="getProgressBarColor(category.percentage)"
              :style="{ width: `${Math.min(category.percentage, 100)}%` }"
            />
          </div>
          <span class="text-xs text-gray-500 font-medium w-12 text-right">
            {{ formatPercentage(category.percentage, 0) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-8 text-center">
      <div class="text-4xl mb-2 opacity-20">📊</div>
      <p class="text-sm font-medium text-gray-500">Nenhum gasto registrado</p>
      <p class="text-xs text-gray-400 mt-1">Sem categorias este mês</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CategorySummary } from '~/composables/useDashboardAnalytics'

interface Props {
  categories: CategorySummary[]
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5
})

const { formatCurrency, formatPercentage } = useFormatters()

// Limit categories to display
const displayCategories = computed(() => {
  return props.categories.slice(0, props.limit)
})

// Get color class based on percentage
// Green for low usage, amber for medium, red for high
const getProgressBarColor = (percentage: number): string => {
  if (percentage < 30) {
    return 'bg-emerald-500' // Low usage - good
  } else if (percentage < 60) {
    return 'bg-blue-500' // Medium usage - neutral
  } else if (percentage < 80) {
    return 'bg-amber-500' // High usage - warning
  } else {
    return 'bg-rose-500' // Very high usage - danger
  }
}

// Alias for template usage
const categories = displayCategories
</script>
