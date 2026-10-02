<template>
  <section
    v-if="briefing"
    class="om-rise flex flex-col gap-26 pt-2 pb-[28px] border-b border-[color:var(--border)]"
    :style="om(0, 520)"
    aria-label="Resumo do dia"
  >
    <div class="flex flex-wrap items-center justify-between gap-x-18 gap-y-2">
      <p class="text-label uppercase text-text-2">
        Resumo do assessor · {{ dateLabel }}
        <span v-if="!isToday" class="normal-case tracking-normal text-neg-text"> — não é de hoje</span>
      </p>
      <p v-if="updatedLabel" class="text-meta text-text-2">{{ updatedLabel }}</p>
    </div>

    <p class="font-display text-[44px] leading-[1.2] max-[900px]:text-[32px] text-ink max-w-[980px] [text-wrap:pretty]">
      <span
        v-for="(seg, i) in headlineSegments"
        :key="i"
        :class="seg.tone === 'good' ? 'text-pos-text' : seg.tone === 'bad' ? 'text-neg-text' : undefined"
      >
        <template v-for="(part, j) in moneySegments(seg.text)" :key="j">
          <span v-if="part.money" class="maskable num">{{ part.text }}</span>
          <template v-else>{{ part.text }}</template>
        </template>
      </span>
    </p>

    <div
      v-if="columns.length"
      class="grid gap-4 max-[900px]:!grid-cols-1"
      :style="{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }"
    >
      <div
        v-for="column in columns"
        :key="column.bucket"
        class="flex flex-col gap-[14px] bg-surface-2 border-t-[3px] px-5 py-18"
        :style="{ borderTopColor: BUCKET_STYLE[column.bucket].rule }"
      >
        <p class="text-label uppercase" :class="BUCKET_STYLE[column.bucket].label">
          {{ BUCKET_STYLE[column.bucket].name }} · {{ column.items.length }}
        </p>

        <template v-for="(item, i) in column.items" :key="i">
          <div v-if="i > 0" class="h-px bg-[color:var(--border)]" aria-hidden="true"></div>
          <div class="flex flex-col" :class="item.progress === undefined ? 'gap-1' : 'gap-2'">
            <div class="flex items-baseline justify-between gap-[10px]">
              <component
                :is="item.href ? 'a' : 'span'"
                v-bind="item.href ? linkAttrs(item.href) : {}"
                class="text-[16px] leading-[1.3] font-semibold text-ink"
                :class="item.href && 'hover:underline underline-offset-2'"
              >{{ item.title }}</component>
              <span
                v-if="item.amount"
                class="maskable num shrink-0 font-display text-[21px] leading-none"
                :class="AMOUNT_TONE[item.amountTone]"
              >{{ item.amount }}</span>
            </div>

            <div
              v-if="item.progress !== undefined"
              class="h-[5px] rounded-control bg-[color:var(--border)] overflow-hidden"
              role="progressbar"
              :aria-valuenow="Math.round(item.progress * 100)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="h-full rounded-control"
                :style="{ width: `${Math.min(item.progress, 1) * 100}%`, background: BUCKET_STYLE[column.bucket].rule }"
              ></div>
            </div>

            <p class="text-body text-text-2 [text-wrap:pretty]">
              <template v-for="(part, j) in moneySegments(item.note)" :key="j">
                <span v-if="part.money" class="maskable num">{{ part.text }}</span>
                <template v-else>{{ part.text }}</template>
              </template>
            </p>
          </div>
        </template>
      </div>
    </div>

    <div v-else-if="legacyBlocks.length" class="flex flex-col gap-2 text-body text-text-2 [text-wrap:pretty]">
      <template v-for="(block, b) in legacyBlocks" :key="b">
        <p v-if="block.kind === 'paragraph'">{{ block.text }}</p>
        <ul v-else class="flex flex-col gap-1 pl-[18px] list-disc marker:text-text-3">
          <li v-for="(line, j) in block.items" :key="j">{{ line }}</li>
        </ul>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  briefingBlocks,
  highlightSegments,
  moneySegments,
  triageColumns,
  type AmountTone,
  type Briefing,
  type TriageBucket,
} from '~/shared/briefing'
import { todayKeyIn } from '~/shared/dates'

/**
 * The morning note from the `financas-diario` skill, above every number.
 *
 * A verdict sentence, then every point the skill raised sorted by what it asks
 * of the reader: agir (do something, with a deadline), segurar (a budget about
 * to break) and tranquilo (looks wrong, is explained). Empty buckets drop out
 * and the grid closes up; with none left only the sentence remains.
 *
 * When it is missing or the request fails the screen simply starts at the
 * hero — a briefing is never worth an error state on the main screen. An old
 * briefing still shows, flagged: reading yesterday's verdict as today's is how
 * a stale verdict gets trusted.
 */
const BUCKET_STYLE: Record<TriageBucket, { name: string; label: string; rule: string }> = {
  agir: { name: 'Agir', label: 'text-neg-text', rule: 'var(--neg-text)' },
  segurar: { name: 'Segurar', label: 'text-warn', rule: 'var(--warn)' },
  tranquilo: { name: 'Tranquilo', label: 'text-pos-text', rule: 'var(--pos-text)' },
}

const AMOUNT_TONE: Record<AmountTone, string> = {
  good: 'text-pos-text',
  bad: 'text-neg-text',
  neutral: 'text-ink',
}

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
const headlineSegments = computed(() =>
  briefing.value ? highlightSegments(briefing.value.headline, briefing.value.highlights ?? []) : []
)
const columns = computed(() => triageColumns(briefing.value?.items ?? []))
const legacyBlocks = computed(() => (briefing.value?.body ? briefingBlocks(briefing.value.body) : []))
const isToday = computed(() => briefing.value?.date === todayKeyIn())

const linkAttrs = (href: string) =>
  href.startsWith('https://') ? { href, target: '_blank', rel: 'noopener' } : { href }

const dateLabel = computed(() => {
  if (!briefing.value) return ''
  const [y, m, d] = briefing.value.date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})

const updatedLabel = computed(() => {
  const created = briefing.value?.createdAt
  if (!created) return ''
  const minutes = Math.floor((Date.now() - new Date(created).getTime()) / 60_000)
  if (minutes < 1) return 'atualizado agora'
  if (minutes < 60) return `atualizado há ${minutes} min`
  if (minutes < 24 * 60) return `atualizado há ${Math.floor(minutes / 60)} h`
  return `atualizado em ${new Date(created).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
})
</script>
