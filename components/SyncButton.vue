<template>
  <div class="inline-flex items-baseline gap-2.5">
    <button
      type="button"
      :disabled="syncing || !isConfigured"
      @click="syncNow()"
      class="px-2.5 py-1.5 rounded-control border border-[color:var(--border)] bg-surface-1 text-body-sm font-semibold text-ink hover:bg-surface-2 transition-colors duration-[120ms] ease-ease disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {{ syncing ? 'sincronizando…' : 'atualizar' }}
    </button>

    <!-- Sem Postgres o app lê direto da planilha e não existe "último sync".
         Antes isso não mostrava nada, que é o pior caso: a tela parecia
         saudável enquanto a camada de dados inteira estava desligada. -->
    <span
      v-if="!isConfigured"
      class="text-meta whitespace-nowrap text-warn font-semibold"
      title="DATABASE_URL não está definida neste ambiente"
    >sincronização não configurada</span>
    <span
      v-else-if="lastSyncLabel"
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
const { syncing, lastSyncLabel, isStale, isConfigured, syncNow } = useSync()
</script>
