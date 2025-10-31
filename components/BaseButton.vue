<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <!-- Loading spinner -->
    <span v-if="loading" class="inline-block w-4 h-4 mr-2">
      <svg class="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>

    <!-- Conteúdo -->
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-page disabled:opacity-40 disabled:cursor-not-allowed'

  // Tamanhos
  const sizes = {
    sm: 'px-3 py-2 text-[13px]',
    md: 'px-[18px] py-[10px] text-[15px]',
    lg: 'px-6 py-3 text-[16px]'
  }

  // Variantes
  const variants = {
    primary: 'bg-accent-primary hover:bg-accent-primary-hover text-text-inverse focus:ring-accent-primary',
    secondary: 'bg-background-section hover:bg-background-hover text-text-primary border border-border-subtle focus:ring-accent-primary',
    ghost: 'bg-transparent hover:bg-background-hover text-text-primary focus:ring-accent-primary',
    danger: 'bg-accent-danger hover:bg-red-600 text-text-inverse focus:ring-accent-danger'
  }

  const width = props.fullWidth ? 'w-full' : ''

  return [base, sizes[props.size], variants[props.variant], width].join(' ')
})
</script>
