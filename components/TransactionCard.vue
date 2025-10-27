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
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
}

.transaction-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.transaction-date {
  color: #657786;
  font-size: 0.9rem;
}

.transaction-amount {
  font-weight: 600;
  font-size: 1.1rem;
  color: #27ae60;
}

.transaction-description {
  font-size: 1rem;
  color: #14171a;
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
  color: #657786;
  font-weight: 500;
}

.detail .value {
  color: #14171a;
}
</style>
