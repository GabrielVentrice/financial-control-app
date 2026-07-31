<template>
  <div class="flex flex-col gap-2">
    <div
      class="om-grow-x h-2 rounded-full overflow-hidden flex gap-px"
      :style="om(delay, 760)"
      role="img"
      :aria-label="altText"
    >
      <span
        v-for="seg in segments"
        :key="seg.key"
        class="h-full first:rounded-l-full last:rounded-r-full"
        :style="{ width: `${seg.share}%`, background: seg.color }"
        :title="`${seg.name} · ${seg.share.toFixed(0)}%`"
      ></span>
    </div>

    <p class="text-meta text-text-2">
      cada faixa é uma categoria, da maior à menor — as três primeiras somam
      <b class="font-semibold text-ink">{{ topThreeShare }}%</b> do mês
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 100% composition band. Replaces the donut, which the system bans: it spent
 * half the width on nothing, made neighbouring slices impossible to compare and
 * needed a legend that repeated the table underneath it. The table below IS the
 * legend — the band carries no labels of its own.
 */
const props = defineProps<{
  segments: { key: string; name: string; share: number; color: string }[]
  delay?: number
}>()

const { om } = useEntryMotion()
const delay = computed(() => props.delay ?? 400)

const topThreeShare = computed(() =>
  Math.round(props.segments.slice(0, 3).reduce((sum, s) => sum + s.share, 0))
)

const altText = computed(() =>
  props.segments
    .slice(0, 5)
    .map(s => `${s.name} ${s.share.toFixed(0)}%`)
    .join(', ')
)
</script>
