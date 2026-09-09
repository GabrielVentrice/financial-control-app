<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-body-sm font-semibold whitespace-nowrap"
    :class="tone === 'neg' ? 'bg-neg-wash text-neg-text' : 'bg-accent-wash text-pos-text'"
  >
    <span
      v-if="dot"
      class="w-2 h-2 rounded-full flex-none"
      :style="{ background: tone === 'neg' ? 'var(--neg)' : 'var(--pos-text)' }"
      aria-hidden="true"
    ></span>
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * A verdict attached to a number: "acima do ritmo", "melhor que o plano".
 *
 * Colour is the whole payload here, which is why it is one of the two semantic
 * pairs and never a third one — a reader who has learnt that red means "past
 * what you meant to spend" on the category list must read the same red the same
 * way in the hero.
 */
withDefaults(defineProps<{ tone: 'pos' | 'neg'; dot?: boolean }>(), { dot: false })
</script>
