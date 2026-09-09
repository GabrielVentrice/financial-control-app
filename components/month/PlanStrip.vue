<template>
  <section class="flex flex-col gap-18">
    <div class="om-rise flex flex-wrap items-baseline justify-between gap-3" :style="om(520, 560)">
      <h2 class="font-display text-section text-ink">O plano</h2>
      <a
        :href="plan.artifactUrl"
        target="_blank"
        rel="noopener"
        class="text-body-sm text-text-3 hover:text-pos-text transition-colors duration-[120ms] ease-ease"
      >plano completo →</a>
    </div>

    <!-- Onde o caixa deveria estar neste mês, e onde está. -->
    <div
      v-if="plan.milestone"
      class="om-rise grid grid-cols-[auto_auto_minmax(0,1fr)] max-lg:grid-cols-1 gap-30 max-lg:gap-18"
      :style="om(560, 560)"
    >
      <div class="flex flex-col gap-1">
        <p class="text-label uppercase text-text-3">Caixa previsto</p>
        <p class="maskable num font-display text-hero-2 text-ink">
          {{ formatCurrency(plan.milestone.targetCash) }}
        </p>
      </div>

      <div class="flex flex-col items-start gap-1.5">
        <p class="text-label uppercase text-text-3">Caixa real</p>
        <p
          v-if="plan.actualCash !== null"
          class="maskable num font-display text-hero-2"
          :class="plan.actualCash < 0 ? 'text-neg-text' : 'text-pos-text'"
        >{{ formatCurrency(plan.actualCash) }}</p>
        <p v-else class="text-body text-text-3">
          precisa do saldo âncora — <NuxtLink to="/debt" class="underline underline-offset-2">configurar</NuxtLink>
        </p>
        <MonthStatusChip v-if="plan.cashDelta !== null" :tone="plan.cashDelta >= 0 ? 'pos' : 'neg'">
          <span class="maskable num">{{ formatCurrency(Math.abs(plan.cashDelta)) }}</span>
          {{ plan.cashDelta >= 0 ? 'melhor que o plano' : 'pior que o plano' }}
        </MonthStatusChip>
      </div>

      <div class="flex flex-col gap-1 pl-26 max-lg:pl-0 border-l max-lg:border-l-0 border-[color:var(--border)]">
        <p class="text-label uppercase text-text-3">O que decide este mês</p>
        <p class="text-value text-ink [text-wrap:pretty]">{{ plan.milestone.headline }}</p>
        <p class="text-body-sm text-text-3">
          Mudança em {{ moveLabel }} · aluguel até
          <span class="maskable num">{{ formatCurrency(plan.housingTarget) }}</span> ·
          reserva de <span class="maskable num">{{ formatCurrency(plan.reserveGoal) }}</span>
        </p>
      </div>
    </div>

    <!-- As tarefas que ainda custam dinheiro enquanto não são feitas. -->
    <ol class="grid grid-cols-2 max-lg:grid-cols-1 gap-3">
      <li
        v-for="(task, i) in plan.tasks"
        :key="task.id"
        class="om-rise flex flex-col gap-1.5 rounded-shell border border-[color:var(--border)] bg-surface-2 px-[18px] py-4"
        :style="om(620 + i * 45, 560)"
      >
        <div class="flex items-baseline justify-between gap-3">
          <span class="text-value text-ink [text-wrap:pretty]">{{ task.title }}</span>
          <span
            class="text-[11px] tracking-[0.1em] font-bold uppercase whitespace-nowrap"
            :class="urgency(task.dueMonth)"
          >até {{ dueLabel(task.dueMonth) }}</span>
        </div>
        <span class="text-body-sm text-text-2 [text-wrap:pretty]">{{ task.detail }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { monthIndexOfKey, monthKeyToIdx, currentMonthKey } from '~/shared/dates'
import type { MonthSnapshot } from '~/server/utils/monthSnapshot'

/**
 * The plan, kept deliberately quiet.
 *
 * It sits below the month because it is context, not the daily question — but
 * it has to be on the same screen, or the budget becomes an exercise with no
 * stakes and the plan becomes a document nobody opens twice.
 *
 * The deadline is coloured by how close it is rather than only by whether it
 * has passed: a task due next month and one due in four are not the same task,
 * and a list where everything is grey until the day it turns red gives no
 * warning at all.
 */
const props = defineProps<{ plan: MonthSnapshot['plan'] }>()

const { formatCurrency, formatMonthName } = useFormatters()
const { om } = useEntryMotion()

const label = (key: string) => {
  const name = formatMonthName(monthIndexOfKey(key), true).toLowerCase()
  return `${name}/${key.slice(2, 4)}`
}

const dueLabel = (key: string) => label(key)
const moveLabel = computed(() => label(props.plan.moveMonth))

const urgency = (key: string) => {
  const months = monthKeyToIdx(key) - monthKeyToIdx(currentMonthKey())
  if (months <= 1) return 'text-neg-text'
  if (months <= 2) return 'text-warn'
  return 'text-text-3'
}
</script>
