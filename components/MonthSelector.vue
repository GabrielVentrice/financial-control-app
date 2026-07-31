<template>
  <div
    class="inline-flex items-center h-11 rounded-full border border-border-base bg-background-card"
    role="group"
    aria-label="Mês de referência"
  >
    <button
      type="button"
      aria-label="Mês anterior"
      class="px-3 h-full text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-l-full"
      @click="shift(-1)"
    >‹</button>

    <span class="px-1 text-[14px] font-medium text-text-primary min-w-[88px] text-center" aria-live="polite">
      {{ label }}
    </span>

    <button
      type="button"
      aria-label="Próximo mês"
      class="px-3 h-full text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-r-full"
      @click="shift(1)"
    >›</button>
  </div>
</template>

<script setup lang="ts">
import { addMonthsToKey, monthIndexOfKey, currentMonthKey } from '~/shared/dates'

// v-model is a "YYYY-MM" key — the timezone-safe month representation used
// across the app (see shared/dates.ts).
const model = defineModel<string>({ default: () => currentMonthKey() })

const { formatMonthName } = useFormatters()

const label = computed(() => {
  const name = formatMonthName(monthIndexOfKey(model.value))
  const year = model.value.split('-')[0]
  // Only disambiguate the year when it isn't the current one.
  return year === String(new Date().getFullYear()) ? name : `${name}/${year.slice(2)}`
})

const shift = (delta: number) => {
  model.value = addMonthsToKey(model.value, delta)
}
</script>
