<template>
  <div
    class="om-rise inline-flex items-center gap-2 rounded-shell bg-surface-1 border"
    :class="shell"
    :style="om(delay, 520)"
  >
    <template v-if="editing">
      <span class="text-body-sm text-ink">{{ line.category }}</span>
      <MonthTargetEditor
        :category="line.category"
        :target="line.target"
        :busy="busy"
        @save="save"
        @cancel="editing = false"
      />
    </template>

    <template v-else-if="untargeted">
      <span class="text-body-sm text-ink">{{ line.category }}</span>
      <span class="text-micro text-text-3">
        {{ line.count }} {{ line.count === 1 ? 'lançamento' : 'lançamentos' }}
      </span>
      <button
        type="button"
        class="text-micro font-semibold text-pos-text hover:text-ink transition-colors duration-[120ms] ease-ease"
        :aria-label="`Definir meta de ${line.category}`"
        @click="editing = true"
      >definir meta</button>
    </template>

    <template v-else>
      <span
        class="w-[26px] h-[26px] flex-none rounded-control bg-surface-3 text-text-2 flex items-center justify-center font-display text-body-sm"
        aria-hidden="true"
      >{{ glyph }}</span>
      <span class="text-body-sm text-ink">{{ line.category }}</span>
      <button
        type="button"
        class="maskable num font-display text-amount-xs text-ink hover:text-pos-text transition-colors duration-[120ms] ease-ease whitespace-nowrap"
        :aria-label="`Editar meta de ${line.category}`"
        @click="editing = true"
      >{{ formatCurrency(line.target) }}</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BudgetLine } from '~/shared/monthBudget'
import { getCategoryGlyph } from '~/shared/categoryIcons'

/**
 * A category that has nothing to report yet.
 *
 * Two situations collapse into this shape: a budget nobody has touched this
 * month, and spending with no budget at all. Neither needs a bar (there is
 * nothing to draw) or a headroom figure (it is the whole target, or unknown) —
 * and giving each one a full row pushed the four categories that ARE breaking
 * below the fold. A chip keeps them one glance away and lets them be edited
 * where they stand.
 */
const props = defineProps<{
  line: BudgetLine
  /** No target set: dashed outline, and the call to action is to give it one. */
  untargeted?: boolean
  delay: number
  busy: boolean
}>()

const emit = defineEmits<{ save: [category: string, amount: number] }>()

const { formatCurrency } = useFormatters()
const { om } = useEntryMotion()

const editing = ref(false)
const glyph = computed(() => getCategoryGlyph(props.line.category))

/**
 * Built as one string rather than a class array: padding utilities from two
 * different branches in the same array do not override each other — the one
 * that wins is whichever Tailwind emitted last.
 */
const shell = computed(() => {
  const outline = props.untargeted
    ? 'border-dashed border-[color:var(--rule-strong)]'
    : 'border-[color:var(--border)]'

  if (editing.value) return `${outline} px-3 py-1.5`
  return props.untargeted ? `${outline} px-3 py-2` : `${outline} py-1.5 pl-1.5 pr-3`
})

const save = (category: string, amount: number) => {
  editing.value = false
  emit('save', category, amount)
}
</script>
