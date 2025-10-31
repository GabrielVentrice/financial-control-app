<template>
  <div class="border-l-[3px] border-l-accent-danger bg-background-card border border-border-base px-6 py-5 rounded-lg">
    <!-- Título -->
    <h4 class="text-[15px] font-medium text-text-primary mb-2">
      {{ title }}
    </h4>

    <!-- Mensagem -->
    <p class="text-[13px] text-text-secondary leading-relaxed">
      {{ message }}
    </p>

    <!-- Ação (slot opcional) -->
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  message: string
}

withDefaults(defineProps<Props>(), {
  title: 'Erro ao carregar dados'
})
</script>
