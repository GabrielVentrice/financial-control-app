<template>
  <section class="flex flex-col gap-18">
    <div class="om-rise flex flex-wrap items-baseline justify-between gap-3" :style="om(520, 560)">
      <h2 class="font-display text-section text-ink">O plano</h2>
      <a
        :href="plan.artifactUrl"
        target="_blank"
        rel="noopener"
        class="text-meta text-text-3 hover:text-ink transition-colors duration-[120ms] ease-ease"
      >plano completo →</a>
    </div>

    <!-- Onde o caixa deveria estar neste mês, e onde está. -->
    <div
      v-if="plan.milestone"
      class="om-rise grid grid-cols-[1fr_1fr_1.4fr] max-lg:grid-cols-1 gap-18 pb-18 border-b border-rule"
      :style="om(560, 560)"
    >
      <div class="flex flex-col gap-1">
        <p class="text-label uppercase text-text-3">Caixa previsto</p>
        <p class="maskable num font-display text-hero-2 text-ink">
          {{ formatCurrency(plan.milestone.targetCash) }}
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <p class="text-label uppercase text-text-3">Caixa real</p>
        <p
          v-if="plan.actualCash !== null"
          class="maskable num font-display text-hero-2"
          :class="plan.actualCash < 0 ? 'text-neg-text' : 'text-pos-text'"
        >{{ formatCurrency(plan.actualCash) }}</p>
        <p v-else class="text-body text-text-3">
          precisa do saldo âncora — <NuxtLink to="/debt" class="underline underline-offset-2">configurar</NuxtLink>
        </p>
        <p v-if="plan.cashDelta !== null" class="text-meta" :class="plan.cashDelta >= 0 ? 'text-pos-text' : 'text-neg-text'">
          <span class="maskable num">{{ formatCurrency(Math.abs(plan.cashDelta)) }}</span>
          {{ plan.cashDelta >= 0 ? 'acima do plano' : 'abaixo do plano' }}
        </p>
      </div>

      <div class="flex flex-col gap-1 pl-18 max-lg:pl-0 border-l max-lg:border-l-0 border-[color:var(--border)]">
        <p class="text-label uppercase text-text-3">O que decide este mês</p>
        <p class="text-body text-text-2 [text-wrap:pretty]">{{ plan.milestone.headline }}</p>
        <p class="text-meta text-text-3">
          Mudança em {{ moveLabel }} · aluguel até
          <span class="maskable num">{{ formatCurrency(plan.housingTarget) }}</span> ·
          reserva de <span class="maskable num">{{ formatCurrency(plan.reserveGoal) }}</span>
        </p>
      </div>
    </div>

    <!-- As tarefas que ainda custam dinheiro enquanto não são feitas. -->
    <ol class="flex flex-col">
      <li
        v-for="(task, i) in plan.tasks"
        :key="task.id"
        class="om-rise grid grid-cols-[92px_minmax(0,1fr)] max-lg:grid-cols-1 gap-18 max-lg:gap-1 items-baseline py-[14px] border-b border-rule last:border-b-0"
        :style="om(620 + i * 45, 560)"
      >
        <span class="text-label uppercase" :class="overdue(task.dueMonth) ? 'text-neg-text' : 'text-text-3'">
          até {{ dueLabel(task.dueMonth) }}
        </span>
        <div class="flex flex-col gap-0.5">
          <span class="text-item text-ink">{{ task.title }}</span>
          <span class="text-meta text-text-2 [text-wrap:pretty]">{{ task.detail }}</span>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { monthIndexOfKey, currentMonthKey } from '~/shared/dates'
import type { MonthSnapshot } from '~/server/utils/monthSnapshot'

/**
 * The plan, kept deliberately quiet.
 *
 * It sits below the month because it is context, not the daily question — but
 * it has to be on the same screen, or the budget becomes an exercise with no
 * stakes and the plan becomes a document nobody opens twice.
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
const overdue = (key: string) => key < currentMonthKey()
</script>
