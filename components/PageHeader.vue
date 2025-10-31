<template>
  <header class="h-[72px] px-6 lg:px-10 flex items-center justify-between border-b border-border-base">
    <!-- Título e Subtítulo -->
    <div class="min-w-0 flex-1">
      <h1 class="text-[22px] font-medium tracking-tight text-text-primary">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-[13px] text-text-secondary mt-1">
        {{ subtitle }}
      </p>
    </div>

    <!-- Ações (slot) -->
    <div v-if="$slots.actions" class="flex items-center gap-3">
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
