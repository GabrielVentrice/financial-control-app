<template>
  <div class="flex items-center gap-3 px-1 py-2">
    <!-- Colored dot indicator -->
    <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', dotColorClass]"></span>

    <!-- Content - single line of muted caption text -->
    <p class="text-[13px] text-gray-500 leading-relaxed">
      <span class="text-gray-700 font-medium">{{ title }}</span>
      <span v-if="value !== undefined" class="ml-1">{{ formattedValue }}</span>
      <span v-if="message" class="ml-1">— {{ message }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type InsightType = 'success' | 'warning' | 'danger' | 'info'

interface Props {
  type: InsightType
  title: string
  message: string
  value?: number
  customIcon?: string
}

const props = defineProps<Props>()

const dotColorClass = computed(() => {
  const colors: Record<InsightType, string> = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-blue-400'
  }
  return colors[props.type]
})

const formattedValue = computed(() => {
  if (props.value === undefined) return ''

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(props.value)
})
</script>
