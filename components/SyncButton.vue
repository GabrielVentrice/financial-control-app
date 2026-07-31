<template>
  <div class="inline-flex items-baseline gap-2.5">
    <button
      type="button"
      :disabled="syncing"
      @click="syncNow()"
      class="px-2.5 py-1.5 rounded-control border border-[color:var(--border)] bg-surface-1 text-body-sm font-semibold text-ink hover:bg-surface-2 transition-colors duration-[120ms] ease-ease disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {{ syncing ? 'sincronizando…' : 'atualizar' }}
    </button>

    <span
      v-if="lastSyncLabel"
      class="text-meta whitespace-nowrap"
      :class="isStale ? 'text-warn font-semibold' : 'text-text-3'"
    >dados de {{ lastSyncLabel }}</span>
  </div>
</template>

<script setup lang="ts">
// The failure case is deliberately NOT rendered here: per the design system a
// data error is a --warn-wash band above the hero, never a toast or a message
// hanging off a control. The page reads `syncError` from this same composable
// and renders that band itself.
const { syncing, lastSyncLabel, isStale, syncNow } = useSync()
</script>
