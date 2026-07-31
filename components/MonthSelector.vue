<template>
  <div
    class="inline-flex items-center rounded-control border border-[color:var(--border)] bg-surface-1"
    role="group"
    aria-label="Mês de referência"
  >
    <button
      type="button"
      aria-label="Mês anterior"
      class="px-2.5 py-1.5 text-text-3 hover:text-ink transition-colors duration-[120ms] ease-ease"
      @click="shift(-1)"
    >‹</button>

    <span class="px-1 text-body-sm font-semibold text-ink min-w-[86px] text-center" aria-live="polite">
      {{ label }}
    </span>

    <button
      type="button"
      aria-label="Próximo mês"
      class="px-2.5 py-1.5 text-text-3 hover:text-ink transition-colors duration-[120ms] ease-ease"
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
