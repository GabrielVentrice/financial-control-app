<template>
  <div
    class="om-rise grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px] max-lg:grid-cols-1 gap-x-[24px] gap-y-2 items-center py-[14px] border-b border-rule"
    :style="om(delay, 560)"
  >
    <!-- quem é, e o que já aconteceu -->
    <div class="flex items-center gap-[14px] min-w-0">
      <span
        class="w-10 h-10 flex-none rounded-shell flex items-center justify-center font-display text-amount-xs"
        :style="{ background: tone.wash, color: tone.ink }"
        aria-hidden="true"
      >{{ glyph }}</span>

      <span class="flex flex-col gap-0.5 min-w-0">
        <span class="text-value text-ink truncate">{{ line.category }}</span>
        <span class="text-micro text-text-3">
          <template v-if="line.count">{{ line.count }} {{ line.count === 1 ? 'lançamento' : 'lançamentos' }}</template>
          <template v-else>sem lançamento</template>
          <template v-if="line.committed > 0">
            · <span class="maskable num">{{ formatCurrency(line.committed) }}</span> a cair
          </template>
        </span>
      </span>
    </div>

    <!-- barra escalada pela meta: o vazio à direita é a folga -->
    <div class="flex flex-col gap-1.5 max-lg:pl-[54px]">
      <div class="h-2 rounded-full bg-rule overflow-hidden">
        <div
          class="om-grow-x h-full rounded-full origin-left"
          :style="{ width: `${fillPct}%`, background: tone.bar, ...om(delay + 60, 780) }"
        ></div>
      </div>
      <span class="text-micro text-text-3">
        <template v-if="line.committed > 0">
          <span class="maskable num">{{ formatCurrency(line.spent) }}</span>
          + <span class="maskable num">{{ formatCurrency(line.committed) }}</span> a cair,
          de <span class="maskable num">{{ formatCurrency(line.target) }}</span>
        </template>
        <template v-else>
          <span class="maskable num">{{ formatCurrency(line.spent) }}</span>
          de <span class="maskable num">{{ formatCurrency(line.target) }}</span>
          · <span class="num">{{ Math.round(line.usedPct) }}%</span>
        </template>
      </span>
    </div>

    <!-- o que ainda cabe. Leitura vira edição no clique. -->
    <div class="flex items-baseline justify-end max-lg:justify-start max-lg:pl-[54px] gap-2.5">
      <template v-if="!editing">
        <span class="maskable num font-display text-amount-sm whitespace-nowrap" :style="{ color: tone.ink }">
          {{ formatCurrency(line.remaining) }}
        </span>
        <button
          type="button"
          class="text-micro text-text-3 hover:text-pos-text underline underline-offset-2 transition-colors duration-[120ms] ease-ease"
          :aria-label="`Editar meta de ${line.category}`"
          @click="editing = true"
        >meta</button>
      </template>

      <MonthTargetEditor
        v-else
        :category="line.category"
        :target="line.target"
        :busy="busy"
        @save="save"
        @cancel="editing = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BudgetLine } from '~/shared/monthBudget'
import { getCategoryGlyph } from '~/shared/categoryIcons'

/**
 * One category's month, inside the group that already said how it is going.
 *
 * The number on the right is the HEADROOM, not the amount spent — "quanto ainda
 * posso gastar" is the question the screen exists to answer, and the amount
 * already spent is one glance away in the bar's caption. It goes negative
 * rather than clamping at zero, because a budget that cannot report being
 * broken is decoration.
 *
 * Colour comes from the group, not from the row: the row is red because it sits
 * under "ESTOURARAM", so the two can never tell different stories.
 */
const props = defineProps<{
  line: BudgetLine
  /** The group's colour pair, so a row never decides its own verdict. */
  tone: { ink: string; wash: string; bar: string }
  delay: number
  busy: boolean
}>()

const emit = defineEmits<{ save: [category: string, amount: number] }>()

const { formatCurrency } = useFormatters()
const { om } = useEntryMotion()

const editing = ref(false)
const glyph = computed(() => getCategoryGlyph(props.line.category))
const fillPct = computed(() => (props.line.target > 0 ? Math.min(100, props.line.usedPct) : 0))

const save = (category: string, amount: number) => {
  editing.value = false
  emit('save', category, amount)
}
</script>
