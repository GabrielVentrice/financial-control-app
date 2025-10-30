<template>
  <div class="filters-container">
    <div class="filter-group">
      <label for="search">Buscar</label>
      <input
        id="search"
        v-model="localFilters.search"
        type="text"
        placeholder="Descrição, origem ou destino..."
        @input="emitFilters"
      />
    </div>

    <div class="filter-group">
      <label for="date-from">Data inicial</label>
      <input
        id="date-from"
        v-model="localFilters.dateFrom"
        type="date"
        @change="emitFilters"
      />
    </div>

    <div class="filter-group">
      <label for="date-to">Data final</label>
      <input
        id="date-to"
        v-model="localFilters.dateTo"
        type="date"
        @change="emitFilters"
      />
    </div>

    <div class="filter-actions">
      <button @click="clearFilters" class="btn-clear">
        Limpar Filtros
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Filters {
  search: string
  dateFrom: string
  dateTo: string
}

const emit = defineEmits<{
  'update:filters': [filters: Filters]
}>()

const localFilters = reactive<Filters>({
  search: '',
  dateFrom: '',
  dateTo: '',
})

const emitFilters = () => {
  emit('update:filters', { ...localFilters })
}

const clearFilters = () => {
  localFilters.search = ''
  localFilters.dateFrom = ''
  localFilters.dateTo = ''
  emitFilters()
}
</script>

<style scoped>
.filters-container {
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #B0B0B0;
}

.filter-group input {
  padding: 8px 12px;
  border: 1px solid #2A2A2A;
  border-radius: 4px;
  font-size: 1rem;
  background: #1A1A1A;
  color: #F3F3F3;
}

.filter-group input:focus {
  outline: none;
  border-color: #7ACBD8;
  box-shadow: none;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.btn-clear {
  padding: 8px 16px;
  background: #2A2A2A;
  color: #F3F3F3;
  border: 1px solid #2A2A2A;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-clear:hover {
  background: #333333;
}

@media (max-width: 768px) {
  .filters-container {
    grid-template-columns: 1fr;
  }
}
</style>
