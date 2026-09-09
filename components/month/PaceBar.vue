<template>
  <div class="flex flex-col">
    <div class="relative h-[10px] rounded-full bg-rule">
      <div
        class="om-grow-x absolute inset-y-0 left-0 rounded-full origin-left"
        :style="{
          width: `${fillPct}%`,
          background: overPace ? 'var(--neg)' : 'var(--accent)',
          ...om(delay, 780),
        }"
      ></div>

      <!-- Onde o mês está no calendário. O gasto à esquerda dele é o que cabia. -->
      <template v-if="showToday">
        <span
          class="absolute -top-[5px] -bottom-[5px] w-[2px] bg-ink"
          :style="{ left: `${markerPct}%` }"
          aria-hidden="true"
        ></span>
        <span
          class="absolute top-[16px] -translate-x-1/2 text-[11px] text-ink whitespace-nowrap"
          :style="{ left: `${markerPct}%` }"
        >hoje · dia {{ pace.daysElapsed }}</span>
      </template>
    </div>

    <div
      class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-micro text-text-3"
      :class="showToday ? 'mt-[26px]' : 'mt-2'"
    >
      <span>
        <b class="font-semibold num" :class="overPace ? 'text-neg-text' : 'text-pos-text'">{{ committedPct }}%</b>
        da renda já comprometida (saiu + a cair)
      </span>
      <span v-if="showToday" class="num">{{ elapsedPct }}% do mês passou</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MonthPace } from '~/shared/monthBudget'

/**
 * How much of the month's income is already spoken for, against how much of the
 * month has been lived.
 *
 * The bar is scaled by INCOME, not by the budget: it answers "quanto da minha
 * renda já foi", which is the cash question the hero above it also answers. The
 * marker is the fair line — being to the left of it on the 9th means the money
 * is going out slower than the calendar.
 *
 * `overPace` comes in from the same signal that colours the hero chip rather
 * than being recomputed here, so the bar and the chip can never disagree.
 */
const props = defineProps<{
  /** Money already out plus what is still going to land. */
  used: number
  income: number
  pace: MonthPace
  overPace: boolean
  delay?: number
}>()

const { om } = useEntryMotion()
const delay = computed(() => props.delay ?? 380)

const ratio = computed(() => (props.income > 0 ? props.used / props.income : 0))
const fillPct = computed(() => Math.min(100, Math.max(0, ratio.value * 100)))
const committedPct = computed(() => Math.round(ratio.value * 100))

const showToday = computed(() => props.pace.isCurrent)
const markerPct = computed(() => Math.min(100, Math.max(0, props.pace.ratio * 100)))
const elapsedPct = computed(() => Math.round(props.pace.ratio * 100))
</script>
