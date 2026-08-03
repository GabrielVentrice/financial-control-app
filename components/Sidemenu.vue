<template>
  <div
    class="flex min-h-screen bg-surface-1 text-ink"
    :class="[motionClass, isPrivate ? 'is-private' : '']"
    :style="motionStyle"
  >
    <!-- Mobile overlay -->
    <div
      v-if="isMobile && sidebarOpen"
      class="fixed inset-0 bg-ink/30 z-40 lg:hidden"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:sticky top-0 left-0 h-screen z-50 w-sidebar flex-none flex flex-col gap-26 pt-26 pb-22',
        'bg-surface-2 border-r border-[color:var(--border)]',
        'transition-transform duration-300 ease-ease',
        isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
      ]"
    >
      <!-- Marca + período ativo -->
      <div class="px-22 flex flex-col gap-0.5">
        <span class="font-display text-brand text-ink">Controle Financeiro</span>
        <span class="text-[11px] tracking-[0.14em] uppercase text-text-3">
          {{ periodLabel }}
        </span>
      </div>

      <!-- Nav -->
      <nav class="om-rise flex flex-col gap-22 overflow-y-auto" :style="om(0, 520)">
        <div v-for="group in navGroups" :key="group.label" class="flex flex-col gap-1">
          <p class="px-22 pb-1 text-caption tracking-[0.16em] uppercase font-bold text-text-4">
            {{ group.label }}
          </p>
          <NuxtLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            @click="handleNavigation"
            class="px-[19px] py-[9px] text-[14.5px] border-l-[3px] transition-colors duration-[120ms] ease-ease"
            :class="$route.path === item.path
              ? 'border-l-[color:var(--accent)] bg-surface-1 text-ink font-bold'
              : 'border-l-transparent text-text-2 font-medium hover:bg-surface-3 hover:text-ink'"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>

      <!-- Rodapé: perfil ativo (o "perfil" deste app é o filtro de pessoa) -->
      <div class="mt-auto px-22">
        <div class="pt-[16px] border-t border-[color:var(--border)] flex items-center gap-[10px]">
          <span
            class="w-[30px] h-[30px] flex-none rounded-full bg-accent text-surface-1 text-body-sm font-bold flex items-center justify-center"
            aria-hidden="true"
          >{{ profileInitial }}</span>

          <!-- O nome e a dica são o que se lê; o select cobre o bloco de forma
               transparente para manter o controle nativo (teclado, mobile) sem
               repetir o nome do perfil na segunda linha. -->
          <div class="relative min-w-0 leading-[1.25] group">
            <p class="text-body font-semibold text-ink truncate">{{ selectedPerson }}</p>
            <p class="text-[11.5px] text-text-3 group-hover:text-ink transition-colors duration-[120ms]">
              trocar perfil
            </p>
            <label for="person-filter" class="sr-only">Trocar perfil</label>
            <select
              id="person-filter"
              v-model="selectedPerson"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="Ambos">Ambos</option>
              <option value="Juliana">Juliana</option>
              <option value="Gabriel">Gabriel</option>
            </select>
          </div>
        </div>
      </div>
    </aside>

    <!-- Botão de menu (mobile) -->
    <button
      v-if="isMobile"
      type="button"
      @click="toggleSidebar"
      :aria-expanded="sidebarOpen"
      aria-label="Abrir menu"
      class="fixed top-4 right-4 z-30 lg:hidden px-3 py-2 rounded-control border border-[color:var(--border)] bg-surface-1 text-ink text-body-sm font-semibold"
    >menu</button>

    <!-- Main -->
    <main class="flex-1 w-full min-w-0">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { PersonType } from '~/composables/usePersonFilter'
import { currentMonthKey, monthIndexOfKey } from '~/shared/dates'

const isOpen = ref(true)
const isMobile = ref(false)
const { selectedPerson: globalSelectedPerson, setPersonFilter } = usePersonFilter()
const { toggleMobileMenu, closeMobileMenu, isMobileMenuOpen } = useMobileMenu()
const { om, motionClass, motionStyle } = useEntryMotion()
const { isPrivate } = usePrivacyMode()
const { formatMonthName } = useFormatters()

const selectedPerson = computed({
  get: () => globalSelectedPerson.value,
  set: (value: PersonType) => setPersonFilter(value)
})

const profileInitial = computed(() =>
  selectedPerson.value === 'Ambos' ? 'A' : selectedPerson.value.charAt(0)
)

// Período ativo sob a marca. O mês de referência é local a cada tela; aqui
// mostramos o mês corrente, que é o default de todas.
const periodLabel = computed(() => {
  const key = currentMonthKey()
  return `${formatMonthName(monthIndexOfKey(key))} ${key.split('-')[0]}`
})

const navGroups = [
  {
    label: 'Acompanhar',
    items: [
      { label: 'Dashboard', path: '/' },
      { label: 'Gastos por Categoria', path: '/categories' },
      { label: 'Transações', path: '/transactions' },
    ]
  },
  {
    label: 'Planejar',
    items: [
      { label: 'Orçamento', path: '/budget' },
      { label: 'Templates de Orçamento', path: '/budget-templates' },
      { label: 'Custos Fixos', path: '/fixed-costs' },
      { label: 'Parcelas', path: '/installments' },
      { label: 'Quitar Dívida', path: '/debt' },
    ]
  }
]

const checkScreenSize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth < 1024

  if (!wasMobile && isMobile.value) closeMobileMenu()
  if (wasMobile && !isMobile.value && !isOpen.value) isOpen.value = true
}

const toggleSidebar = () => {
  if (isMobile.value) toggleMobileMenu()
  else isOpen.value = !isOpen.value
}

const closeSidebar = () => {
  if (isMobile.value) closeMobileMenu()
}

const handleNavigation = () => {
  if (isMobile.value) closeMobileMenu()
}

const sidebarOpen = computed(() => (isMobile.value ? isMobileMenuOpen.value : isOpen.value))

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('resize', checkScreenSize)
})
</script>
