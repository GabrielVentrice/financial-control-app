<template>
  <div class="flex flex-col items-center justify-center py-20">
    <!-- Spinner -->
    <div class="relative w-12 h-12">
      <div class="absolute inset-0 rounded-full border-4 border-background-section"></div>
      <div class="absolute inset-0 rounded-full border-4 border-accent-primary border-t-transparent animate-spin"></div>
    </div>

    <!-- Mensagem -->
    <p v-if="message" class="mt-4 text-[15px] text-text-secondary">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'Carregando...'
})
</script>
