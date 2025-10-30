<template>
  <div class="transaction-card">
    <div class="transaction-header">
      <span class="transaction-date">{{ formatDate(transaction.date) }}</span>
      <span class="transaction-amount">R$ {{ transaction.amount.toFixed(2) }}</span>
    </div>
    <div class="transaction-description">
      {{ transaction.description }}
    </div>
    <div class="transaction-details">
      <div v-if="transaction.origin" class="detail">
        <span class="label">Origem:</span>
        <span class="value">{{ transaction.origin }}</span>
      </div>
      <div v-if="transaction.destination" class="detail">
        <span class="label">Destino:</span>
        <span class="value">{{ transaction.destination }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from '~/types/transaction'

const props = defineProps<{
  transaction: Transaction
}>()

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.transaction-card {
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: background-color 0.2s;
}

.transaction-card:hover {
  background: #2A2A2A;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.transaction-date {
  color: #B0B0B0;
  font-size: 0.9rem;
}

.transaction-amount {
  font-weight: 600;
  font-size: 1.1rem;
  color: #3DD68C;
}

.transaction-description {
  font-size: 1rem;
  color: #F3F3F3;
  margin-bottom: 12px;
  font-weight: 500;
}

.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
}

.detail .label {
  color: #B0B0B0;
  font-weight: 500;
}

.detail .value {
  color: #F3F3F3;
}
</style>
