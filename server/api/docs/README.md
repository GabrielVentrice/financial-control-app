# 📊 Financial Control App - API Documentation

Esta pasta contém a documentação completa da API do Financial Control App.

## 🚀 Endpoints de Documentação

### 📖 Documentação HTML
```
GET /api/docs
```
- **Formato:** HTML interativo
- **Descrição:** Documentação completa da API com interface visual
- **Ideal para:** Navegação web, referência rápida, apresentações

### 📋 Documentação JSON  
```
GET /api/docs/json
```
- **Formato:** JSON estruturado
- **Descrição:** Documentação em formato de dados para consumo programático
- **Ideal para:** Integração com ferramentas, automação, desenvolvimento

## ✨ Principais Funcionalidades

### 🎯 API de Transações (`/api/transactions`)
Endpoint principal para buscar transações financeiras com filtros avançados:

**Parâmetros Disponíveis:**
- `person` - Filtrar por pessoa: "Juliana", "Gabriel", "Ambos"
- `startDate` - Data inicial (YYYY-MM-DD)
- `endDate` - Data final (YYYY-MM-DD) 
- `searchTerm` - Busca na descrição das transações
- `origin` - Filtrar por conta/cartão de origem
- `destination` - Filtrar por categoria de destino
- `processInstallments` - Processar parcelas (default: true)

**Exemplos de Uso:**
```bash
# Todas as transações
curl http://localhost:3000/api/transactions

# Transações do Gabriel em Janeiro 2025
curl "http://localhost:3000/api/transactions?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31"

# Buscar Netflix
curl "http://localhost:3000/api/transactions?searchTerm=Netflix"

# Múltiplos filtros
curl "http://localhost:3000/api/transactions?person=Ambos&startDate=2025-01-01&searchTerm=supermercado"
```

### 🔍 Pipeline de Processamento
1. **Busca dados** do Google Sheets
2. **Identifica pessoa** automaticamente (Juliana/Gabriel)
3. **Processa parcelas** expandindo ao longo dos meses
4. **Aplica filtros** baseados nos parâmetros

### 💡 Casos de Uso
- Dashboard analytics e insights
- Listagem de transações com filtros
- Análise de gastos por categoria
- Visualização de parcelas ao longo do tempo
- Análise histórica de custos fixos

## 🛠️ Desenvolvimento

### Estrutura dos Arquivos
```
server/api/docs/
├── index.get.ts     # Documentação HTML
└── json.get.ts      # Documentação JSON
```

### Como Adicionar Nova Documentação
1. Edite os arquivos em `server/api/docs/`
2. Adicione novos endpoints na estrutura JSON
3. Atualize exemplos e parâmetros conforme necessário
4. Teste localmente com `npm run dev`

### Validação de Parâmetros
A API inclui validação robusta de parâmetros:
- Datas devem estar no formato YYYY-MM-DD
- `person` deve ser um valor válido
- `startDate` deve ser anterior a `endDate`
- Tipos de dados são validados automaticamente

## 🔗 Links Relacionados
- **Health Check:** `/api/health` - Status da API e links para documentação
- **Transações:** `/api/transactions` - Endpoint principal de dados
- **Código Fonte:** `server/api/transactions.get.ts` - Implementação principal

---

*Documentação gerada automaticamente • Última atualização: ${new Date().toLocaleDateString('pt-BR')}*