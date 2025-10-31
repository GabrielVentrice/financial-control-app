<template>
  <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
    <!-- Ícone/Emoji -->
    <div class="text-6xl mb-4 opacity-40">
      {{ icon }}
    </div>

    <!-- Título -->
    <h3 class="text-[18px] font-medium text-text-primary mb-2">
      {{ title }}
    </h3>

    <!-- Descrição -->
    <p class="text-[15px] text-text-secondary max-w-md mb-6">
      {{ description }}
    </p>

    <!-- Ação (slot opcional) -->
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  title: string
  description: string
}

withDefaults(defineProps<Props>(), {
  icon: '📊'
})
</script>
