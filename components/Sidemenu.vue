<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-gradient-to-b from-primary-800 to-primary-900 text-white transition-all duration-300 flex flex-col',
        isOpen ? 'w-64' : 'w-20'
      ]"
    >
      <!-- Logo/Header -->
      <div class="p-4 flex items-center justify-between border-b border-primary-700">
        <h1 v-if="isOpen" class="text-xl font-bold truncate">Controle Financeiro</h1>
        <button
          @click="toggleSidebar"
          class="p-2 rounded-lg hover:bg-primary-700 transition-colors"
          :class="{ 'mx-auto': !isOpen }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
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
      <nav class="flex-1 p-4 space-y-2">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-700 transition-colors"
          active-class="bg-primary-600"
        >
          <component :is="item.icon" class="h-6 w-6 flex-shrink-0" />
          <span v-if="isOpen" class="font-medium truncate">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Footer - Person Filter -->
      <div class="p-4 border-t border-primary-700">
        <div v-if="isOpen" class="space-y-2">
          <p class="text-xs text-primary-300 uppercase font-semibold">Filtrar por pessoa</p>
          <select
            v-model="selectedPerson"
            class="w-full px-3 py-2 bg-primary-700 text-white rounded-lg border border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Ambos">Ambos</option>
            <option value="Juliana">Juliana</option>
            <option value="Gabriel">Gabriel</option>
          </select>
        </div>
        <div v-else class="flex justify-center">
          <div class="w-3 h-3 rounded-full" :class="{
            'bg-purple-400': selectedPerson === 'Juliana',
            'bg-blue-400': selectedPerson === 'Gabriel',
            'bg-green-400': selectedPerson === 'Ambos'
          }"></div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, computed } from 'vue'
import type { PersonType } from '~/composables/usePersonFilter'

const isOpen = ref(true)
const { selectedPerson: globalSelectedPerson, setPersonFilter } = usePersonFilter()

// Criar computed com get/set para funcionar com v-model
const selectedPerson = computed({
  get: () => globalSelectedPerson.value,
  set: (value: PersonType) => {
    setPersonFilter(value)
  }
})

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

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

const menuItems = [
  { label: 'Dashboard', path: '/', icon: HomeIcon },
  { label: 'Gastos por Categoria', path: '/categories', icon: ChartIcon },
  { label: 'Transações', path: '/transactions', icon: ListIcon },
  { label: 'Parcelas', path: '/installments', icon: CalendarIcon },
  { label: 'Custos Fixos', path: '/fixed-costs', icon: FixedCostIcon },
]
</script>
