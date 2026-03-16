<template>
  <div class="flex min-h-screen bg-[#FAFBFC]">
    <!-- Mobile overlay -->
    <div
      v-if="isMobile && sidebarOpen"
      class="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar - Hairline border-right for separation -->
    <aside
      :class="[
        'fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out',
        'bg-white border-r border-gray-100',
        isMobile
          ? (sidebarOpen ? 'w-56 translate-x-0' : 'w-56 -translate-x-full')
          : (sidebarOpen ? 'w-56' : 'w-16')
      ]"
    >
      <!-- Logo/Header - span, not h1 -->
      <div class="h-16 px-5 flex items-center justify-between flex-shrink-0">
        <span
          v-if="sidebarOpen"
          class="text-[15px] font-medium text-gray-600 truncate transition-opacity duration-200"
        >
          Controle Financeiro
        </span>
        <button
          @click="toggleSidebar"
          class="p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-700 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          :class="{ 'mx-auto': !sidebarOpen }"
          :title="sidebarOpen ? 'Fechar menu' : 'Abrir menu'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="sidebarOpen ? (isMobile ? 'M6 18L18 6M6 6l12 12' : 'M15 19l-7-7 7-7') : 'M4 6h16M4 12h16M4 18h16'"
            />
          </svg>
        </button>
      </div>

      <!-- Navigation - Active = bg + font-medium, Hover = bg -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-0.5">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          @click="handleNavigation"
          class="flex items-center gap-3 h-10 px-3 rounded-lg transition-all duration-150 ease-out group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          :class="$route.path === item.path
            ? 'text-[#111111] bg-gray-100/70 font-medium'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
        >
          <component :is="item.icon" class="h-5 w-5 flex-shrink-0" stroke-width="1.5" />
          <span
            v-if="sidebarOpen"
            class="text-[13px] truncate"
          >
            {{ item.label }}
          </span>
          <!-- Tooltip for collapsed state -->
          <span
            v-if="!sidebarOpen && !isMobile"
            class="absolute left-full ml-3 px-3 py-2 bg-gray-800 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg"
          >
            {{ item.label }}
          </span>
        </NuxtLink>
      </nav>

      <!-- Footer - Person Filter only, no label -->
      <div class="mt-auto flex-shrink-0 p-4">
        <div v-if="sidebarOpen">
          <select
            id="person-filter"
            v-model="selectedPerson"
            class="w-full px-3 py-2.5 bg-gray-50 text-gray-600 text-[13px] rounded-lg border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-all"
          >
            <option value="Ambos">Ambos</option>
            <option value="Juliana">Juliana</option>
            <option value="Gabriel">Gabriel</option>
          </select>
        </div>
        <div v-else class="flex justify-center" :title="'Filtro: ' + selectedPerson">
          <div class="w-2.5 h-2.5 rounded-full transition-colors" :class="{
            'bg-blue-400': selectedPerson === 'Juliana',
            'bg-blue-500': selectedPerson === 'Gabriel',
            'bg-emerald-400': selectedPerson === 'Ambos'
          }"></div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 w-full min-w-0">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, computed, onMounted, onUnmounted } from 'vue'
import type { PersonType } from '~/composables/usePersonFilter'

const isOpen = ref(true)
const isMobile = ref(false)
const route = useRoute()
const { selectedPerson: globalSelectedPerson, setPersonFilter } = usePersonFilter()
const { toggleMobileMenu, closeMobileMenu, isMobileMenuOpen } = useMobileMenu()

const selectedPerson = computed({
  get: () => globalSelectedPerson.value,
  set: (value: PersonType) => {
    setPersonFilter(value)
  }
})

const checkScreenSize = () => {
  if (process.client) {
    const wasMobile = isMobile.value
    isMobile.value = window.innerWidth < 1024

    if (!wasMobile && isMobile.value) {
      closeMobileMenu()
    }

    if (wasMobile && !isMobile.value && !isOpen.value) {
      isOpen.value = true
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

const sidebarOpen = computed(() => {
  return isMobile.value ? isMobileMenuOpen.value : isOpen.value
})

onMounted(() => {
  checkScreenSize()
  if (process.client) {
    window.addEventListener('resize', checkScreenSize)
  }
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
  { label: 'Templates de Orçamento', path: '/budget-templates', icon: BudgetIcon },
]
</script>
