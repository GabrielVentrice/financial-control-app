<template>
  <div>
    <p class="text-label uppercase text-text-3 mb-[14px]">Como chega nesse número</p>

    <div class="grid grid-cols-[24px_minmax(0,1fr)] gap-x-4 items-center">
      <template v-for="(row, i) in rows" :key="row.label">
        <span
          class="om-rise font-display text-amount-sm text-text-4 text-center select-none"
          :style="om(delay + i * 60, 520)"
          aria-hidden="true"
        >{{ row.operator }}</span>

        <div
          class="om-rise flex items-baseline justify-between gap-3"
          :class="row.rule"
          :style="om(delay + i * 60, 520)"
        >
          <span class="min-w-0">
            <span class="block text-item font-semibold text-ink">{{ row.label }}</span>
            <span v-if="row.note" class="block text-micro text-text-3">{{ row.note }}</span>
          </span>
          <span class="maskable num font-display text-amount whitespace-nowrap" :class="row.cls">
            {{ formatCurrency(row.value) }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MonthTotals } from '~/shared/monthBudget'

/**
 * The hero number, shown as the subtraction it is.
 *
 * Four stacked KPI cards said the same four numbers, but left the reader to
 * work out that the first three make the fourth — and the third one ("ainda vai
 * cair") is exactly the one people assume is not in the total. Writing it as an
 * equation makes the projected half impossible to miss without adding a word of
 * explanation.
 */
const props = defineProps<{
  totals: MonthTotals
  /** Realized rows in the month, for the "já saiu" line. */
  count: number
  delay?: number
}>()

const { formatCurrency } = useFormatters()
const { om } = useEntryMotion()

const delay = computed(() => props.delay ?? 300)

const rows = computed(() => [
  {
    operator: '',
    label: 'Entrou',
    note: 'salário e outras entradas',
    value: props.totals.income,
    cls: 'text-pos-text',
    rule: 'py-2 border-b border-dashed border-[color:var(--border)]',
  },
  {
    operator: '−',
    label: 'Já saiu',
    note: `${props.count} ${props.count === 1 ? 'lançamento realizado' : 'lançamentos realizados'}`,
    value: props.totals.spent,
    cls: 'text-ink',
    rule: 'py-2 border-b border-dashed border-[color:var(--border)]',
  },
  {
    operator: '−',
    label: 'Ainda vai cair',
    note: 'parcelas projetadas para este mês',
    value: props.totals.committed,
    cls: props.totals.committed > 0 ? 'text-warn' : 'text-text-3',
    // O traço de soma: 2px sólido, o único no bloco.
    rule: 'py-2 border-b-2 border-ink',
  },
  {
    operator: '=',
    label: 'Disponível',
    note: '',
    value: props.totals.available,
    cls: props.totals.available < 0 ? 'text-neg-text' : 'text-ink',
    rule: 'pt-[10px]',
  },
])
</script>
