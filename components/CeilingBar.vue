<template>
  <div class="flex flex-col gap-2">
    <div class="h-2 rounded-full bg-rule overflow-hidden flex">
      <div
        class="om-grow-x h-full rounded-full"
        :style="{ width: `${fillPct}%`, background: overCeiling ? 'var(--neg)' : 'var(--accent)', ...om(delay, 760) }"
      ></div>
    </div>
    <p class="text-meta text-text-2">
      <slot :ceiling="ceiling" :used-pct="usedPct" />
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Bar scaled by the CEILING, not by the total or the largest value.
 *
 * The empty space to the right is the point: it is the headroom left before the
 * healthy limit. Scaling by the total would always fill the bar and say nothing
 * about whether you are close to the limit.
 */
const props = defineProps<{
  value: number
  ceiling: number
  /** Percentage of the reference the ceiling represents, for the caption. */
  usedPct: number
  delay?: number
}>()

const { om } = useEntryMotion()
const delay = computed(() => props.delay ?? 400)

const fillPct = computed(() =>
  props.ceiling > 0 ? Math.min(100, (props.value / props.ceiling) * 100) : 0
)
const overCeiling = computed(() => props.ceiling > 0 && props.value >= props.ceiling)
</script>
