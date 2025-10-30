<template>
  <div class="flex h-screen bg-background-page">
    <!-- Mobile overlay -->
        <!-- Overlay para mobile -->
    <div 
      v-if="isMobile && sidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      @click="closeSidebar"
    ></div>
    
    <!-- Sidebar -->
    <aside 
      :class="[
        'fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
        'bg-slate-900 border-r border-slate-700',
        isMobile 
          ? (sidebarOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full')
          : (sidebarOpen ? 'w-80' : 'w-16')
      ]"
    >
      <!-- Logo/Header -->
      <div class="h-[72px] px-5 flex items-center justify-between border-b border-border-base">
        <h1 v-if="isOpen || isMobile" class="text-[18px] lg:text-[22px] font-medium truncate">
          Controle Financeiro
        </h1>
        <button
          @click="toggleSidebar"
          class="p-2 rounded-md hover:bg-background-hover transition-colors"
          :class="{ 'mx-auto': !isOpen && !isMobile }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"
            />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-5 space-y-2">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          @click="handleNavigation"
          class="flex items-center gap-3 h-11 px-3 rounded-md hover:bg-background-hover transition-all duration-150 ease-out text-text-secondary hover:text-text-primary"
          active-class="bg-background-hover text-accent-primary font-medium"
        >
          <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
          <span v-if="sidebarOpen" class="font-normal text-[15px] truncate">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Footer - Person Filter -->
      <div class="p-5 border-t border-border-base">
        <div v-if="sidebarOpen" class="space-y-2">
          <p class="text-[13px] text-text-muted uppercase font-medium tracking-wide">
            Filtrar por pessoa
          </p>
          <select
            v-model="selectedPerson"
            class="w-full px-4 py-2.5 bg-background-input text-text-primary text-[15px] rounded-md border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-info transition-all"
          >
            <option value="Ambos">Ambos</option>
            <option value="Juliana">Juliana</option>
            <option value="Gabriel">Gabriel</option>
          </select>
        </div>
        <div v-else class="flex justify-center">
          <div class="w-3 h-3 rounded-full" :class="{
            'bg-accent-info': selectedPerson === 'Juliana',
            'bg-accent-primary': selectedPerson === 'Gabriel',
            'bg-accent-success': selectedPerson === 'Ambos'
          }"></div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto lg:overflow-visible">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, computed, onMounted, onUnmounted } from 'vue'
import type { PersonType } from '~/composables/usePersonFilter'

const isOpen = ref(true)
const isMobile = ref(false)
const { selectedPerson: globalSelectedPerson, setPersonFilter } = usePersonFilter()
const { toggleMobileMenu, closeMobileMenu, isMobileMenuOpen } = useMobileMenu()

// Criar computed com get/set para funcionar com v-model
const selectedPerson = computed({
  get: () => globalSelectedPerson.value,
  set: (value: PersonType) => {
    setPersonFilter(value)
  }
})

// Detectar tamanho da tela
const checkScreenSize = () => {
  if (process.client) {
    isMobile.value = window.innerWidth < 1024
    if (isMobile.value) {
      isOpen.value = false
    }
  }
}

const toggleSidebar = () => {
  if (isMobile.value) {
    toggleMobileMenu()
  } else {
    isOpen.value = !isOpen.value
  }
}

const closeSidebar = () => {
  if (isMobile.value) {
    closeMobileMenu()
  }
}

const handleNavigation = () => {
  if (isMobile.value) {
    closeMobileMenu()
  }
}

// Use mobile menu state for mobile
const sidebarOpen = computed(() => {
  return isMobile.value ? isMobileMenuOpen.value : isOpen.value
})

// Lifecycle
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('resize', checkScreenSize)
  }
})

// SVG Icons as functional components
const HomeIcon = defineComponent({
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    })
  ])
})

const ChartIcon = defineComponent({
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    })
  ])
})

const ListIcon = defineComponent({
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M4 6h16M4 10h16M4 14h16M4 18h16'
    })
  ])
})

const CalendarIcon = defineComponent({
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    })
  ])
})

const FixedCostIcon = defineComponent({
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    })
  ])
})

const BudgetIcon = defineComponent({
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
    })
  ])
})

const menuItems = [
  { label: 'Dashboard', path: '/', icon: HomeIcon },
  { label: 'Gastos por Categoria', path: '/categories', icon: ChartIcon },
  { label: 'Transações', path: '/transactions', icon: ListIcon },
  { label: 'Parcelas', path: '/installments', icon: CalendarIcon },
  { label: 'Custos Fixos', path: '/fixed-costs', icon: FixedCostIcon },
  { label: 'Orçamento', path: '/budget', icon: BudgetIcon },
]
</script>
