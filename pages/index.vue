<template>
  <div class="container">
    <header class="header">
      <h1>Controle Financeiro</h1>
      <p>Integrado com Google Sheets</p>
    </header>

    <div class="controls">
      <button @click="refresh" :disabled="loading" class="btn-refresh">
        {{ loading ? 'Carregando...' : 'Atualizar Dados' }}
      </button>

      <div class="search-box">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por descrição..."
          class="search-input"
        />
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="!loading && !error" class="summary">
      <div class="summary-card">
        <h3>Total de Transações</h3>
        <p class="summary-value">{{ filteredTransactions.length }}</p>
      </div>
      <div class="summary-card">
        <h3>Valor Total</h3>
        <p class="summary-value">R$ {{ totalAmount.toFixed(2) }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Carregando transações...
    </div>

    <div v-else-if="filteredTransactions.length > 0" class="transactions-table">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Registrado em</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in filteredTransactions" :key="transaction.transactionId">
            <td>{{ formatDate(transaction.date) }}</td>
            <td>{{ transaction.origin }}</td>
            <td>{{ transaction.destination }}</td>
            <td>{{ transaction.description }}</td>
            <td class="amount">R$ {{ transaction.amount.toFixed(2) }}</td>
            <td>{{ formatDate(transaction.recordedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="!loading" class="no-data">
      Nenhuma transação encontrada
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  transactions,
  loading,
  error,
  fetchTransactions,
  getTotalAmount,
  getTransactionsByDescription,
} = useTransactions()

const searchTerm = ref('')

const filteredTransactions = computed(() => {
  if (!searchTerm.value) {
    return transactions.value
  }
  return getTransactionsByDescription(searchTerm.value)
})

const totalAmount = computed(() => {
  return getTotalAmount(filteredTransactions.value)
})

const refresh = async () => {
  await fetchTransactions()
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

// Carregar dados ao montar o componente
onMounted(() => {
  fetchTransactions()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.btn-refresh {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-refresh:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.error-message {
  background-color: #e74c3c;
  color: white;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
  color: #7f8c8d;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-card h3 {
  margin: 0 0 10px 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.summary-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.transactions-table {
  overflow-x: auto;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #34495e;
  color: white;
}

th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
}

tbody tr {
  border-bottom: 1px solid #ecf0f1;
}

tbody tr:hover {
  background-color: #f8f9fa;
}

td {
  padding: 15px;
}

.amount {
  font-weight: 600;
  color: #27ae60;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .transactions-table {
    font-size: 0.9rem;
  }

  th, td {
    padding: 10px;
  }
}
</style>
