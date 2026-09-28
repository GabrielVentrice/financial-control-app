<template>
  <section
    v-if="briefing"
    class="om-rise flex flex-col gap-3 rounded-shell border border-[color:var(--border)] bg-surface-2 px-[22px] py-[18px]"
    :style="om(0, 520)"
    aria-label="Resumo do dia"
  >
    <div class="flex flex-wrap items-center justify-between gap-x-18 gap-y-2">
      <p class="text-label uppercase text-text-3">
        Resumo do assessor · {{ dateLabel }}
        <span v-if="!isToday" class="normal-case tracking-normal text-neg-text"> — não é de hoje</span>
      </p>
      <MonthStatusChip :tone="briefing.verdict === 'no-trilho' ? 'pos' : 'neg'" dot>
        {{ briefing.verdict === 'no-trilho' ? 'no trilho' : 'fora do trilho' }}
      </MonthStatusChip>
    </div>

    <p class="font-display text-section text-ink [text-wrap:pretty]">
      <template v-for="(seg, i) in moneySegments(briefing.headline)" :key="i">
        <span v-if="seg.money" class="maskable num">{{ seg.text }}</span>
        <template v-else>{{ seg.text }}</template>
      </template>
    </p>

    <div class="flex flex-col gap-2 text-body text-text-2 max-w-[760px] [text-wrap:pretty]">
      <template v-for="(block, b) in blocks" :key="b">
        <p v-if="block.kind === 'paragraph'">
          <template v-for="(seg, i) in moneySegments(block.text)" :key="i">
            <span v-if="seg.money" class="maskable num">{{ seg.text }}</span>
            <template v-else>{{ seg.text }}</template>
          </template>
        </p>
        <ul v-else class="flex flex-col gap-1 pl-[18px] list-disc marker:text-text-3">
          <li v-for="(item, j) in block.items" :key="j">
            <template v-for="(seg, i) in moneySegments(item)" :key="i">
              <span v-if="seg.money" class="maskable num">{{ seg.text }}</span>
              <template v-else>{{ seg.text }}</template>
            </template>
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { briefingBlocks, moneySegments, type Briefing } from '~/shared/briefing'
import { todayKeyIn } from '~/shared/dates'

/**
 * The morning note from the `financas-diario` skill, above every number.
 *
 * It reads the month against the move-out plan and says what to act on, which
 * is the question the numbers below leave to the reader. When it is missing or
 * the request fails the screen simply starts at the hero, as it did before —
 * a briefing is never worth an error state on the main screen.
 *
 * An old briefing still shows, flagged: a note from yesterday is better than
 * nothing, but reading it as today's is how a stale verdict gets trusted.
 */
const { om } = useEntryMotion()

const { data } = useAsyncData(
  'briefing-latest',
  () => $fetch<{ briefing: Briefing | null }>('/api/briefing').catch(() => ({ briefing: null })),
  {
    default: () => ({ briefing: null }),
    getCachedData: (k, nuxtApp) => nuxtApp.payload.data[k] ?? nuxtApp.static.data[k],
  }
)

const briefing = computed(() => data.value?.briefing ?? null)
const blocks = computed(() => (briefing.value ? briefingBlocks(briefing.value.body) : []))
const isToday = computed(() => briefing.value?.date === todayKeyIn())

const dateLabel = computed(() => {
  if (!briefing.value) return ''
  const [y, m, d] = briefing.value.date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})
</script>
