<template>
  <div class="flex flex-col items-stretch sm:items-end gap-1">
    <button
      type="button"
      :disabled="syncing"
      @click="run"
      class="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full border border-border-base bg-background-card text-[14px] font-medium text-text-secondary hover:bg-background-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        :class="{ 'animate-spin': syncing }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {{ syncing ? 'Sincronizando…' : 'Atualizar' }}
    </button>

    <p
      v-if="syncError"
      role="alert"
      class="text-[12px] text-negative max-w-[240px] sm:text-right"
    >
      {{ syncError }}
    </p>
    <p
      v-else-if="lastSyncLabel"
      class="text-[12px] sm:text-right"
      :class="isStale ? 'text-warning font-medium' : 'text-text-muted'"
    >
      <span v-if="isStale" aria-hidden="true">⚠ </span>dados de {{ lastSyncLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { syncing, syncError, lastSyncLabel, isStale, syncNow } = useSync()

const run = () => syncNow()
</script>
