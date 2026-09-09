<template>
  <form class="flex items-center gap-1.5" @submit.prevent="commit">
    <input
      ref="input"
      v-model.number="draft"
      type="number"
      step="10"
      min="0"
      :disabled="busy"
      class="w-[104px] px-2 py-1 rounded-control border border-[color:var(--border)] bg-surface-1 text-body-sm text-ink num text-right"
      :aria-label="`Meta mensal de ${category}`"
      @keydown.esc="emit('cancel')"
    />
    <button
      type="submit"
      :disabled="busy"
      class="px-2 py-1 rounded-control bg-ink text-surface-1 text-meta font-bold disabled:opacity-50"
    >{{ busy ? '…' : 'ok' }}</button>
  </form>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

/**
 * Setting one category's monthly target.
 *
 * Lives in its own component because the same edit is reachable from a full
 * category row and from a compact chip, and a target that saves differently
 * depending on where it was clicked is a bug waiting for the day the two copies
 * drift apart.
 */
const props = defineProps<{ category: string; target: number; busy: boolean }>()
const emit = defineEmits<{ save: [category: string, amount: number]; cancel: [] }>()

const draft = ref<number>(props.target)
const input = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  await nextTick()
  input.value?.focus()
  input.value?.select()
})

const commit = () => {
  const amount = Number(draft.value)
  if (!Number.isFinite(amount) || amount < 0) return
  emit('save', props.category, amount)
}
</script>
