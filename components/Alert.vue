<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-[-10px]"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-[-10px]"
  >
    <div
      v-if="isVisible"
      :class="alertClasses"
      class="relative overflow-hidden rounded-lg"
      role="alert"
    >
      <!-- Border accent -->
      <div :class="borderClasses" class="absolute left-0 top-0 bottom-0 w-[3px]"></div>

      <!-- Content -->
      <div class="flex items-start gap-3 pl-5 pr-4 py-4">
        <!-- Icon -->
        <div :class="iconColorClasses" class="flex-shrink-0 text-lg leading-none mt-0.5">
          {{ icon }}
        </div>

        <!-- Text content -->
        <div class="flex-1 min-w-0">
          <h4 v-if="title" class="text-[15px] font-medium text-text-primary mb-1">
            {{ title }}
          </h4>
          <p class="text-[14px] leading-relaxed" :class="messageColorClasses">
            {{ message }}
          </p>
        </div>

        <!-- Dismiss button -->
        <button
          v-if="dismissible"
          @click="dismiss"
          class="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors p-1 -mt-1 -mr-1"
          aria-label="Dismiss alert"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface Props {
  variant?: AlertVariant
  title?: string
  message: string
  dismissible?: boolean
  autoDismiss?: boolean
  autoDismissDelay?: number // milliseconds
  modelValue?: boolean // for v-model support
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  dismissible: true,
  autoDismiss: false,
  autoDismissDelay: 5000,
  modelValue: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'dismiss'): void
}>()

const isVisible = ref(props.modelValue)
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  isVisible.value = newValue
  if (newValue && props.autoDismiss) {
    startAutoDismissTimer()
  }
})

// Computed classes
const alertClasses = computed(() => {
  const base = 'bg-background-card border transition-all duration-150'

  const variantClasses: Record<AlertVariant, string> = {
    success: 'border-accent-success/20',
    error: 'border-accent-danger/20',
    warning: 'border-accent-warning/20',
    info: 'border-accent-info/20',
  }

  return `${base} ${variantClasses[props.variant]}`
})

const borderClasses = computed(() => {
  const variantClasses: Record<AlertVariant, string> = {
    success: 'bg-accent-success',
    error: 'bg-accent-danger',
    warning: 'bg-accent-warning',
    info: 'bg-accent-info',
  }

  return variantClasses[props.variant]
})

const iconColorClasses = computed(() => {
  const variantClasses: Record<AlertVariant, string> = {
    success: 'text-accent-success',
    error: 'text-accent-danger',
    warning: 'text-accent-warning',
    info: 'text-accent-info',
  }

  return variantClasses[props.variant]
})

const messageColorClasses = computed(() => {
  return props.title ? 'text-text-secondary' : 'text-text-primary'
})

const icon = computed(() => {
  const icons: Record<AlertVariant, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return icons[props.variant]
})

// Methods
const dismiss = () => {
  isVisible.value = false
  emit('update:modelValue', false)
  emit('dismiss')
  clearAutoDismissTimer()
}

const startAutoDismissTimer = () => {
  clearAutoDismissTimer()
  autoDismissTimer = setTimeout(() => {
    dismiss()
  }, props.autoDismissDelay)
}

const clearAutoDismissTimer = () => {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer)
    autoDismissTimer = null
  }
}

// Lifecycle
onMounted(() => {
  if (isVisible.value && props.autoDismiss) {
    startAutoDismissTimer()
  }
})
</script>
