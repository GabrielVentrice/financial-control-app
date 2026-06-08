<template>
  <header class="h-14 px-6 flex items-center justify-between bg-background-card border-b border-border-subtle sticky top-0 z-10">
    <!-- Título e Subtítulo -->
    <div class="min-w-0 flex-1">
      <h1 class="text-lg font-semibold text-text-primary tracking-tight truncate">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-[13px] text-text-muted mt-0.5 truncate">
        {{ subtitle }}
      </p>
    </div>

    <!-- Ações (slot) -->
    <div v-if="$slots.actions" class="flex items-center gap-3 flex-shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()
</script>
