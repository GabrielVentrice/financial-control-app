<template>
  <section class="flex flex-col">
    <div
      class="om-rise flex flex-wrap items-baseline gap-x-[10px] gap-y-1 pb-2 border-b border-[color:var(--border)]"
      :style="om(delay, 520)"
    >
      <span
        class="w-[10px] h-[10px] flex-none self-center rounded-bar"
        :class="style.dashed ? 'border border-dashed border-[color:var(--text-4)]' : ''"
        :style="style.dashed ? undefined : { background: style.swatch }"
        aria-hidden="true"
      ></span>
      <h3 class="text-label uppercase" :style="{ color: style.titleColor }">{{ style.title }}</h3>
      <p class="text-body-sm text-text-3">
        {{ subtitle.prefix }}
        <span v-if="subtitle.amount" class="maskable num">{{ subtitle.amount }}</span>
        {{ subtitle.suffix }}
      </p>
    </div>

    <!-- Estouradas e dentro da meta ganham linha: há uma barra e um número a ler. -->
    <div v-if="style.layout === 'rows'" class="flex flex-col">
      <MonthCategoryBudgetRow
        v-for="(line, i) in group.lines"
        :key="line.category"
        :line="line"
        :tone="style.tone"
        :delay="delay + 60 + i * 38"
        :busy="busy === line.category"
        @save="(category, amount) => emit('save', category, amount)"
      />
    </div>

    <!-- As demais viram chip: não há nada a ler além do nome e da meta. -->
    <div v-else class="flex flex-wrap gap-2 pt-[14px]">
      <MonthCategoryChip
        v-for="(line, i) in group.lines"
        :key="line.category"
        :line="line"
        :untargeted="group.key === 'untargeted'"
        :delay="delay + 60 + i * 28"
        :busy="busy === line.category"
        @save="(category, amount) => emit('save', category, amount)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BudgetGroup } from '~/shared/monthBudget'

/**
 * One situation, with everything in it.
 *
 * The group header is the verdict — "quatro estouraram, R$ 2.918 além da meta" —
 * and the rows under it are the evidence. Sorting a flat list by "closest to
 * breaking" put the same information in the same order, but made the reader
 * find the boundary between broken and healthy by reading colours row by row.
 */
const props = defineProps<{
  group: BudgetGroup
  delay: number
  /** Category currently being saved, so only that line shows as busy. */
  busy: string | null
}>()

const emit = defineEmits<{ save: [category: string, amount: number] }>()

const { formatCurrency } = useFormatters()
const { om } = useEntryMotion()

const STYLES = {
  over: {
    title: 'Estouraram',
    titleColor: 'var(--neg-text)',
    swatch: 'var(--neg)',
    layout: 'rows' as const,
    dashed: false,
    tone: { ink: 'var(--neg-text)', wash: 'var(--neg-wash)', bar: 'var(--neg)' },
  },
  within: {
    title: 'Dentro da meta',
    titleColor: 'var(--pos-text)',
    swatch: 'var(--accent)',
    layout: 'rows' as const,
    dashed: false,
    tone: { ink: 'var(--pos-text)', wash: 'var(--accent-wash)', bar: 'var(--accent)' },
  },
  untouched: {
    title: 'Sem gasto ainda',
    titleColor: 'var(--text-3)',
    swatch: 'var(--rule-strong)',
    layout: 'chips' as const,
    dashed: false,
    tone: { ink: 'var(--text-2)', wash: 'var(--surface-3)', bar: 'var(--rule-strong)' },
  },
  untargeted: {
    title: 'Sem meta',
    titleColor: 'var(--text-3)',
    swatch: 'var(--text-4)',
    layout: 'chips' as const,
    dashed: true,
    tone: { ink: 'var(--text-2)', wash: 'var(--surface-3)', bar: 'var(--rule-strong)' },
  },
}

const style = computed(() => STYLES[props.group.key])

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * Split around the amount so privacy mode can blur the number and leave the
 * sentence readable — the same contract every other figure on the screen keeps.
 */
const subtitle = computed(() => {
  const { key, lines, amount, count } = props.group
  const cats = plural(lines.length, 'categoria', 'categorias')

  // O sinal é o mesmo do Intl (hífen), não o menos tipográfico: as duas formas
  // aparecem a centímetros uma da outra nesta tela.
  if (key === 'over') return { prefix: `${cats} ·`, amount: `-${formatCurrency(amount)}`, suffix: 'além da meta' }
  if (key === 'within') return { prefix: `${cats} ·`, amount: formatCurrency(amount), suffix: 'ainda cabem' }
  if (key === 'untouched') return { prefix: `${cats} ·`, amount: formatCurrency(amount), suffix: 'disponíveis' }
  return {
    prefix: plural(count, 'lançamento', 'lançamentos'),
    amount: '',
    suffix: 'fora de qualquer meta',
  }
})
</script>
