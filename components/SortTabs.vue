<template>
  <div class="flex items-baseline gap-18" role="group" :aria-label="ariaLabel">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :aria-pressed="model === opt.value"
      @click="model = opt.value"
      class="text-body-sm pb-0.5 border-b-2 transition-colors duration-[120ms] ease-ease"
      :class="model === opt.value
        ? 'font-bold text-ink border-b-[color:var(--accent)]'
        : 'font-medium text-text-3 border-b-transparent hover:text-ink'"
    >{{ opt.label }}</button>
  </div>
</template>

<script setup lang="ts">
// Sorting is plain text with an underline on the active option. The system bans
// pills and grey segmented controls: they read as buttons competing with the
// data, and this is a view preference, not an action.
defineProps<{
  options: { value: string; label: string }[]
  ariaLabel: string
}>()

const model = defineModel<string>({ required: true })
</script>
