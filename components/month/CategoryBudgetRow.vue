<template>
  <div
    class="om-rise grid grid-cols-[minmax(0,1fr)_260px_150px] max-xl:grid-cols-[minmax(0,1fr)_200px_130px] max-lg:grid-cols-1 gap-18 max-lg:gap-2 items-center py-[14px] border-b border-rule"
    :style="om(delay, 560)"
  >
    <!-- nome + o que já aconteceu -->
    <div class="flex flex-col gap-0.5 min-w-0">
      <span class="text-item text-ink truncate">{{ line.category }}</span>
      <span class="text-meta text-text-3">
        <template v-if="line.count">{{ line.count }} {{ line.count === 1 ? 'lançamento' : 'lançamentos' }}</template>
        <template v-else>sem lançamento este mês</template>
        <template v-if="line.committed > 0">
          · <span class="maskable num">{{ formatCurrency(line.committed) }}</span> a cair
        </template>
      </span>
    </div>

    <!-- barra escalada pela meta: o vazio à direita é a folga -->
    <div v-if="line.hasTarget" class="max-lg:pt-1">
      <CeilingBar :value="line.used" :ceiling="line.target" :used-pct="line.usedPct" :delay="delay + 60">
        <span class="maskable num">{{ formatCurrency(line.spent) }}</span>
        de
        <span class="maskable num">{{ formatCurrency(line.target) }}</span>
      </CeilingBar>
    </div>
    <p v-else class="text-meta text-text-4 max-lg:pt-1">sem meta definida</p>

    <!-- meta: leitura vira edição no clique -->
    <div class="flex items-baseline justify-end max-lg:justify-start gap-2">
      <template v-if="!editing">
        <span
          v-if="line.hasTarget"
          class="maskable num text-value"
          :class="line.remaining < 0 ? 'text-neg-text' : 'text-ink'"
        >{{ formatCurrency(line.remaining) }}</span>
        <span v-else class="text-meta text-text-4">—</span>
        <button
          type="button"
          class="text-meta text-text-3 hover:text-ink underline underline-offset-2 transition-colors duration-[120ms] ease-ease"
          :aria-label="`Editar meta de ${line.category}`"
          @click="startEditing"
        >{{ line.hasTarget ? 'meta' : 'definir' }}</button>
      </template>

      <form v-else class="flex items-center gap-1.5" @submit.prevent="commit">
        <input
          ref="input"
          v-model.number="draft"
          type="number"
          step="10"
          min="0"
          :disabled="busy"
          class="w-[104px] px-2 py-1 rounded-control border border-[color:var(--border)] bg-surface-1 text-body-sm text-ink num text-right"
          :aria-label="`Meta mensal de ${line.category}`"
          @keydown.esc="editing = false"
        />
        <button
          type="submit"
          :disabled="busy"
          class="px-2 py-1 rounded-control bg-ink text-surface-1 text-meta font-bold disabled:opacity-50"
        >{{ busy ? '…' : 'ok' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { BudgetLine } from '~/shared/monthBudget'

/**
 * One category's month.
 *
 * The number on the right is the HEADROOM, not the amount spent — "quanto ainda
 * posso gastar" is the question the screen exists to answer, and the amount
 * already spent is one glance away in the bar's caption. It goes negative
 * rather than clamping at zero, because a budget that cannot report being
 * broken is decoration.
 */
const props = defineProps<{
  line: BudgetLine
  delay: number
  busy: boolean
}>()

const emit = defineEmits<{ save: [category: string, amount: number] }>()

const { formatCurrency } = useFormatters()
const { om } = useEntryMotion()

const editing = ref(false)
const draft = ref<number>(props.line.target)
const input = ref<HTMLInputElement | null>(null)

const startEditing = async () => {
  draft.value = props.line.target
  editing.value = true
  await nextTick()
  input.value?.focus()
  input.value?.select()
}

const commit = () => {
  const amount = Number(draft.value)
  if (!Number.isFinite(amount) || amount < 0) return
  emit('save', props.line.category, amount)
  editing.value = false
}
</script>
