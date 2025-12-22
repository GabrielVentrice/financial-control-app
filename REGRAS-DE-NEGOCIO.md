# Regras de Negócio - Financial Control App

## 1. Visão Geral do Sistema

O **Financial Control App** é uma aplicação de controle financeiro pessoal que integra com Google Sheets para fornecer análise, visualização e gestão de transações financeiras. O sistema foi projetado para gerenciar as finanças de duas pessoas (Juliana e Gabriel) de forma compartilhada, permitindo visualizações individuais e conjuntas.

### 1.1 Propósito

- Centralizar o controle financeiro de múltiplas contas e cartões
- Identificar automaticamente transações por pessoa
- Processar e expandir parcelamentos automaticamente
- Fornecer insights inteligentes sobre padrões de gastos
- Alertar sobre anomalias e tendências financeiras
- Analisar custos fixos e variáveis ao longo do tempo

### 1.2 Fonte de Dados

- **Origem**: Google Sheets (planilha única)
- **Acesso**: Somente leitura via Service Account
- **Estrutura**: Colunas fixas definidas (Transaction Id, Date, Origin, Destination, Description, Amount, Recorded at, Remote Id)
- **Atualização**: Dados são buscados do Google Sheets em cada requisição (sem cache no servidor)

---

## 2. Conceitos Fundamentais

### 2.1 Transação (Transaction)

Uma transação representa uma movimentação financeira única, contendo:

- **transactionId**: Identificador único
- **date**: Data da transação (formato YYYY-MM-DD)
- **origin**: Origem do dinheiro (conta ou cartão de origem)
- **destination**: Destino do dinheiro (categoria, loja, ou conta de destino)
- **description**: Descrição da transação
- **amount**: Valor (positivo ou negativo)
- **recordedAt**: Data de registro no sistema
- **remoteId**: ID da transação no sistema remoto
- **person**: Pessoa associada (Juliana, Gabriel, ou null) - campo enriquecido pelo servidor

### 2.2 Tipos de Transações

#### 2.2.1 Receitas (Income)
**Regra**: Uma transação é considerada RECEITA quando:
- O campo **destination** contém "bank account" (case-insensitive)

**Exemplos**:
- Salário depositado em "Bank Account Gabriel"
- Transferência recebida em "Bank Account Juliana"

#### 2.2.2 Despesas (Expenses)
**Regra**: Uma transação é considerada DESPESA quando:
- O campo **origin** contém "bank account" OU "credit card" (case-insensitive)

**Exemplos**:
- Compra com "Credit Card Gabriel"
- Pagamento via "Bank Account Juliana"

#### 2.2.3 Parcelamentos (Installments)
**Regra**: Uma transação é considerada PARCELAMENTO quando:
- O campo **destination** contém "Installments/Financing" (case-insensitive)
- OU contém "Installments" E "Financing"

**Formato esperado na descrição**: `Descrição XX/YY`
- XX = número da parcela atual (01-99)
- YY = total de parcelas (01-99)

**Exemplos**:
- "Netflix 01/12" → Primeira de 12 parcelas
- "Celular 03/10" → Terceira de 10 parcelas

---

## 3. Identificação de Pessoa (Person Identification)

### 3.1 Objetivo

Identificar automaticamente se uma transação pertence à Juliana, Gabriel, ou não pode ser identificada (null).

### 3.2 Processo de Identificação

**Local**: Servidor (server/utils/personIdentifier.ts)

**Algoritmo**:
1. Converter o campo **origin** para lowercase
2. Verificar se contém algum padrão da Juliana (por substring)
3. Se sim, retornar "Juliana"
4. Caso contrário, verificar se contém algum padrão do Gabriel
5. Se sim, retornar "Gabriel"
6. Se nenhum padrão for encontrado, retornar `null`

### 3.3 Padrões Configurados

#### Padrões da Juliana
```typescript
- 'juliana'
- 'cartao juliana'
- 'conta juliana'
- 'credit card juliana'
- 'bank account juliana'
```

#### Padrões do Gabriel
```typescript
- 'gabriel'
- 'cartao gabriel'
- 'conta gabriel'
- 'bank account gabriel'
- 'credit card gabriel'
```

### 3.4 Regras de Matching

- **Case-insensitive**: Não diferencia maiúsculas de minúsculas
- **Substring matching**: Usa `.includes()` - não precisa ser match exato
- **Prioridade**: Juliana tem prioridade sobre Gabriel (verificada primeiro)
- **Customizável**: Padrões podem ser facilmente modificados

### 3.5 Exemplos

| Origin | Person Identificada |
|--------|-------------------|
| "Cartão Juliana Nubank" | Juliana |
| "Bank Account Gabriel" | Gabriel |
| "Credit Card GABRIEL" | Gabriel |
| "Conta Empresarial" | null |
| "Cash" | null |

---

## 4. Processamento de Parcelamentos (Installment Processing)

### 4.1 Objetivo

Expandir transações de parcelamento para criar entradas mensais automaticamente, facilitando a análise de fluxo de caixa futuro.

### 4.2 Pipeline de Processamento

**Local**: Servidor (server/utils/installmentProcessor.ts)

**Fluxo**:

#### Etapa 1: Separação de Transações
- Filtrar transações com destination = "Installments/Financing"
- Transações não-parcelamento são mantidas inalteradas

#### Etapa 2: Parsing de Informações
- Extrair padrão `XX/YY` da descrição usando regex: `/(\d{2})\/(\d{2})/`
- Extrair descrição base (texto antes do padrão XX/YY)
- Se não conseguir fazer parse, manter transação original

#### Etapa 3: Agrupamento
- Criar chave única: `${descricaoBase.toLowerCase()}_${origin}`
- Agrupar todas as transações com mesma chave
- Transações do mesmo parcelamento ficam no mesmo grupo

#### Etapa 4: Identificação da Primeira Parcela
- Procurar transação com formato "01/XX" em cada grupo
- Se primeira parcela não existir, manter transações originais do grupo

#### Etapa 5: Geração de Parcelas
- Usar a primeira parcela como referência
- Gerar XX transações (total de parcelas)
- Cada parcela tem:
  - **transactionId**: Original + `_${numeroParcela}_${totalParcelas}`
  - **date**: Calculada conforme regras de data (ver seção 4.3)
  - **description**: `${descricaoBase} ${numeroParcela}/${totalParcelas}`
  - **amount**: Mesmo valor da primeira parcela
  - Todos os outros campos copiados da primeira parcela

### 4.3 Regras de Data das Parcelas

**Regra Crítica**:
- **Primeira parcela (01/XX)**: Mantém a data original da transação
- **Demais parcelas (02/XX até XX/XX)**: Sempre dia **02** do mês subsequente

**Motivo**: Sistema bancário costuma processar parcelamentos no início do mês seguinte.

**Exemplo**:
```
Primeira parcela: 15/01/2025 (mantém dia 15)
Segunda parcela: 02/02/2025 (dia 2)
Terceira parcela: 02/03/2025 (dia 2)
...
```

### 4.4 Remoção de Duplicatas

- Após gerar parcelas, o grupo original é removido
- Apenas as parcelas geradas são incluídas no resultado
- Evita contagem duplicada de valores

### 4.5 Controle de Processamento

**Parâmetro**: `processInstallments` (padrão: `true`)

- Se `true`: Executa todo o pipeline de processamento
- Se `false`: Retorna transações originais sem processamento

**Uso**: Útil quando se quer visualizar dados brutos do Google Sheets.

### 4.6 Exemplo Completo

**Transação Original**:
```json
{
  "transactionId": "abc123",
  "date": "2025-01-15",
  "origin": "Credit Card Gabriel",
  "destination": "Installments/Financing",
  "description": "Netflix 01/12",
  "amount": -50.00
}
```

**Transações Geradas** (12 parcelas):
```json
[
  {
    "transactionId": "abc123_1_12",
    "date": "2025-01-15",
    "description": "Netflix 01/12",
    "amount": -50.00,
    ...
  },
  {
    "transactionId": "abc123_2_12",
    "date": "2025-02-02",
    "description": "Netflix 02/12",
    "amount": -50.00,
    ...
  },
  ...
  {
    "transactionId": "abc123_12_12",
    "date": "2025-12-02",
    "description": "Netflix 12/12",
    "amount": -50.00,
    ...
  }
]
```

---

## 5. Sistema de Filtros

### 5.1 Arquitetura de Filtros

**Local**: Servidor (server/utils/transactionFilters.ts)

**Princípio**: Todos os filtros são aplicados no servidor para melhor performance e segurança.

### 5.2 Filtros Disponíveis

#### 5.2.1 Filtro por Pessoa
**Parâmetro**: `person` (valores: "Juliana" | "Gabriel" | "Ambos")

**Regra**:
- Se "Ambos" ou não especificado: Retorna todas as transações
- Se "Juliana": Retorna apenas transações com `person === "Juliana"`
- Se "Gabriel": Retorna apenas transações com `person === "Gabriel"`

**Pré-requisito**: Campo `person` deve estar enriquecido (ver seção 3)

#### 5.2.2 Filtro por Período
**Parâmetros**: `startDate` e `endDate` (formato: YYYY-MM-DD)

**Regras**:
- Ambas as datas são **inclusivas**
- Se apenas `startDate`: Retorna transações >= startDate
- Se apenas `endDate`: Retorna transações <= endDate
- Se ambas: Retorna transações no intervalo [startDate, endDate]

**Validações**:
- Formato deve ser YYYY-MM-DD (regex: `/^\d{4}-\d{2}-\d{2}$/`)
- startDate deve ser <= endDate

#### 5.2.3 Filtro por Busca na Descrição
**Parâmetro**: `searchTerm`

**Regras**:
- Case-insensitive
- Substring matching (usa `.includes()`)
- Busca apenas no campo `description`

**Exemplo**:
- searchTerm = "netflix" → Encontra "Netflix 01/12", "NETFLIX Premium", etc.

#### 5.2.4 Filtro por Origem
**Parâmetro**: `origin`

**Regras**:
- Case-insensitive
- Substring matching no campo `origin`

**Uso típico**: Filtrar transações de um cartão ou conta específica

#### 5.2.5 Filtro por Destino (Categoria)
**Parâmetro**: `destination`

**Regras**:
- Case-insensitive
- Substring matching no campo `destination`

**Uso típico**: Filtrar por categoria de gasto (ex: "Food", "Transport")

### 5.3 Ordem de Aplicação

Os filtros são aplicados sequencialmente na ordem:
1. Pessoa
2. Período (data)
3. Busca (descrição)
4. Origem
5. Destino

### 5.4 Validação de Parâmetros

**Função**: `validateQueryParams()`

**Validações**:
- `person`: Deve ser "Juliana", "Gabriel" ou "Ambos"
- Datas: Formato YYYY-MM-DD obrigatório
- Lógica de datas: startDate <= endDate

**Retorno**:
```typescript
{
  valid: boolean,
  errors: string[] // Array de mensagens de erro
}
```

---

## 6. Analytics e Insights

### 6.1 Estatísticas Mensais (Monthly Stats)

**Composable**: `useDashboardAnalytics()`

#### 6.1.1 Dados Calculados

**Mês Atual**:
- **income**: Soma de todas as receitas do mês
- **expenses**: Soma de todas as despesas do mês
- **balance**: income - expenses
- **transactionCount**: Quantidade de transações
- **dailyAverage**: expenses / dia atual do mês

**Comparações**:
- **trend.income**: % de mudança vs mês anterior
- **trend.expenses**: % de mudança vs mês anterior
- **trend.balance**: % de mudança vs mês anterior
- **comparison.incomeVsAvg**: % vs média dos últimos 3 meses
- **comparison.expensesVsAvg**: % vs média dos últimos 3 meses

#### 6.1.2 Fórmulas

```typescript
// Trend (mês atual vs mês anterior)
trend = ((valorAtual - valorAnterior) / valorAnterior) * 100

// Comparação com média de 3 meses
comparison = ((valorAtual - média3Meses) / média3Meses) * 100

// Média diária
dailyAverage = despesasDoMês / diaAtualDoMês
```

### 6.2 Top Categorias

**Função**: `getTopCategories()`

#### 6.2.1 Regras
- Considera apenas **despesas** do mês atual
- Agrupa por campo `destination` (categoria)
- Ordena por total gasto (decrescente)
- Retorna top N categorias (padrão: 5)

#### 6.2.2 Dados Retornados
- **name**: Nome da categoria
- **total**: Soma dos gastos
- **count**: Quantidade de transações
- **percentage**: (total da categoria / total de despesas) * 100

### 6.3 Despesas Futuras

**Função**: `getUpcomingExpenses()`

#### 6.3.1 Regras
- Retorna transações **futuras** (data > hoje)
- Período: Próximos 30 dias
- Apenas **despesas**
- Ordenado por data (ascendente)

#### 6.3.2 Uso
- Visualizar parcelamentos futuros
- Planejamento de fluxo de caixa
- Identificar compromissos financeiros próximos

### 6.4 Sistema de Alertas

**Função**: `generateAlerts()`

#### 6.4.1 Tipos de Alertas

**1. Gastos Acima do Esperado (Warning)**
- **Condição**: Despesas do mês atual > 120% das despesas do mês anterior
- **Tipo**: warning
- **Mensagem**: "Seus gastos estão 20% acima do mês passado"
- **Amount**: Diferença em valor absoluto

**2. Transações de Alto Valor (Info)**
- **Condição**: Existem transações > R$ 1.000 no mês atual
- **Tipo**: info
- **Mensagem**: "X transação(ões) acima de R$ 1.000"
- **Amount**: Soma das transações de alto valor

**3. Saldo Negativo (Danger)**
- **Condição**: balance < 0 (despesas > receitas)
- **Tipo**: danger
- **Mensagem**: "Suas despesas estão maiores que sua receita este mês"
- **Amount**: |balance|

**4. Poucas Transações Registradas (Warning)**
- **Condição**:
  - Quantidade de transações < 50% do esperado
  - E dia do mês > 10
- **Cálculo esperado**: (diaAtual / diasDoMês) * 20 transações
- **Tipo**: warning
- **Mensagem**: "Você pode ter transações não registradas este mês"

### 6.5 Insights Inteligentes

**Função**: `getSmartInsights()`

#### 6.5.1 Conceito
Sistema de insights priorizados que identifica padrões e anomalias financeiras.

#### 6.5.2 Tipos de Insights (por prioridade)

**Prioridade 5 - Crítico**:
- **Saldo Negativo**: balance < 0

**Prioridade 4 - Alto**:
- **Gastos muito acima do normal**: expenses > média 3 meses + 20%
- **Ritmo de gastos elevado**: Projeção mensal > média 3 meses + 15%

**Prioridade 3 - Médio**:
- **Categoria dominante**: Uma categoria representa > 40% dos gastos

**Prioridade 2 - Baixo/Info**:
- **Gastos controlados**: expenses < média 3 meses - 10%
- **Tendência de aumento**: Gastos crescendo últimos 6 meses
- **Tendência de redução**: Gastos diminuindo últimos 6 meses

#### 6.5.3 Detecção de Tendências

**Algoritmo**:
1. Calcular média dos 3 meses mais recentes
2. Calcular média dos 3 meses mais antigos (últimos 6 meses)
3. Comparar:
   - Se média recente > média antiga * 1.1 → "increasing"
   - Se média recente < média antiga * 0.9 → "decreasing"
   - Caso contrário → "stable"

### 6.6 Previsão Mensal

**Função**: `getMonthlyForecast()`

#### 6.6.1 Dados Calculados
- **projectedIncome**: Projeção da receita baseada no padrão do mês
- **upcomingExpenses**: Soma das despesas futuras (próximos 30 dias)
- **projectedBalance**: projectedIncome - upcomingExpenses
- **upcomingCount**: Quantidade de despesas futuras

#### 6.6.2 Cálculo de Projeção de Receita
```typescript
// Se já passou mais de 5 dias do mês
if (diaAtual > 5) {
  projectedIncome = (income / diaAtual) * diasDoMês
} else {
  projectedIncome = income // Poucos dados para projetar
}
```

---

## 7. Custos Fixos (Fixed Costs)

### 7.1 Conceito

Custos fixos são despesas recorrentes mensais que o usuário define como "fixas" baseado em categorias específicas.

### 7.2 Categorias Fixas Configuradas

**Local**: `pages/fixed-costs.vue` - Array `FIXED_COST_CATEGORIES`

**Categorias Padrão**:
```typescript
[
  'Installments/Financing',
  'Rent',
  'Financing',
  'Subscriptions/Softwares',
  'Utilities',
  'Business & Taxes',
  'Investments',
  'Insurance',
  'Medical'
]
```

### 7.3 Regras de Matching

- **Case-insensitive**: Não diferencia maiúsculas/minúsculas
- **Substring matching**: Usa `.includes()` no campo `destination`
- **Customizável**: Array pode ser modificado conforme necessidade

### 7.4 Período de Análise

- **Janela**: Últimos 6 meses (incluindo mês atual)
- **Motivo**: Identificar tendências e variações ao longo do semestre

### 7.5 Cálculos

#### 7.5.1 Total Mensal
Soma de todas as transações que:
- São despesas
- Têm destination em uma das categorias fixas
- Pertencem ao mês específico

#### 7.5.2 Média dos 6 Meses
```typescript
média = (soma dos 6 meses) / 6
```

#### 7.5.3 Categorias Ativas
Quantidade de categorias que tiveram pelo menos uma transação no período de 6 meses.

### 7.6 Visualização

**Chart**: Gráfico de barras mostrando evolução mensal
- X: Meses (últimos 6)
- Y: Total em R$
- Cor: Âmbar (#f59e0b)

---

## 8. Análise de Parcelamentos (Installments Page)

### 8.1 Objetivo

Fornecer visão completa dos parcelamentos: passado, presente e futuro.

### 8.2 Linha do Tempo

**Período**: 13 meses
- 6 meses anteriores
- Mês atual
- 6 meses futuros

**Cores no Chart**:
- **Cinza**: Meses passados
- **Azul escuro**: Mês atual
- **Azul claro**: Meses futuros

### 8.3 Parcelamentos Ativos

**Definição**: Série de parcelamentos que ainda tem parcelas futuras não pagas.

**Identificação**:
1. Agrupar transações por descrição base + origin
2. Para cada grupo, identificar:
   - Primeira parcela (01/XX)
   - Última parcela (XX/XX)
   - Parcelas pagas (date <= hoje)
   - Parcelas futuras (date > hoje)
3. Se tem parcelas futuras > 0 → Parcelamento Ativo

**Dados Exibidos**:
- Nome do parcelamento
- Progresso (X de Y parcelas pagas)
- Valor mensal
- Data primeira e última parcela
- Barra de progresso visual

### 8.4 Métricas

#### 8.4.1 Total do Mês Atual
Soma de todos os parcelamentos com data no mês atual.

#### 8.4.2 Média Mensal
```typescript
média = (soma dos 13 meses) / 13
```

#### 8.4.3 Contagem de Parcelamentos Ativos
Quantidade de séries de parcelamento com parcelas futuras.

---

## 9. Categorias (Categories Page)

### 9.1 Objetivo

Análise detalhada de gastos por categoria com suporte a orçamento (budget).

### 9.2 Agrupamento

**Critério**: Campo `destination` (categoria)

**Filtros Aplicados**:
- Apenas despesas
- Período selecionável (mês/ano)
- Pessoa (Juliana/Gabriel/Ambos)

### 9.3 Dados por Categoria

- **name**: Nome da categoria
- **count**: Quantidade de transações
- **total**: Soma dos gastos
- **percentage**: % do total de gastos
- **average**: total / count
- **transactions**: Lista de transações (opcional)
- **budget**: Dados de orçamento (se configurado)

### 9.4 Sistema de Orçamento (Budget)

#### 9.4.1 Estrutura
```typescript
{
  juliana: number,    // Orçamento da Juliana
  gabriel: number,    // Orçamento do Gabriel
  total: number,      // Soma dos orçamentos
  remaining: number,  // total - gasto real
  percentageUsed: number  // (gasto / total) * 100
}
```

#### 9.4.2 Fonte de Dados
- Planilha separada no Google Sheets para orçamentos
- Campos: Category, Person, Month, Year, Amount

#### 9.4.3 Matching
- Por categoria (case-insensitive)
- Por mês e ano
- Por pessoa (opcional)

### 9.5 Classificação de Custos

#### 9.5.1 Categorias Excluídas
**Não são contabilizadas nos totais**:
- "Transfers" (entre contas próprias)
- Outras categorias administrativas

#### 9.5.2 Custos Fixos
Categorias configuradas como fixas (ver seção 7.2).

#### 9.5.3 Despesas Comprometidas (Committed Expenses)
Categorias configuradas como:
- "Installments/Financing"
- Outras despesas recorrentes obrigatórias

#### 9.5.4 Custos Variáveis
Todas as demais categorias que não são fixas nem comprometidas.

### 9.6 Totalizações

**Dados Calculados**:
- **variableCosts**: Soma dos custos variáveis
- **fixedCosts**: Soma dos custos fixos
- **committedExpenses**: Soma das despesas comprometidas
- **total**: Soma de todos os custos (excluindo categorias excluídas)
- **categoryCounts**: Quantidade de categorias em cada tipo

---

## 10. Pipeline de Processamento Completo

### 10.1 Fluxo End-to-End

```
[Google Sheets]
    ↓
[1. Fetch Raw Data] (server/utils/googleSheets.ts)
    ↓
[2. Parse & Transform]
    ↓
[3. Person Identification] (server/utils/personIdentifier.ts)
    ↓
[4. Installment Processing] (server/utils/installmentProcessor.ts)
    ↓ (se processInstallments = true)
[5. Apply Filters] (server/utils/transactionFilters.ts)
    ↓
[6. Return to Client]
    ↓
[7. Client-Side Analytics] (composables)
```

### 10.2 Detalhamento de Cada Etapa

#### Etapa 1: Fetch Raw Data
- Autenticação via Service Account
- Leitura da planilha específica
- Parse de colunas para objetos SheetRow

#### Etapa 2: Parse & Transform
- Converter SheetRow → Transaction
- Normalizar datas (ISO 8601)
- Converter amounts para number
- Validar dados obrigatórios

#### Etapa 3: Person Identification
- Aplicar regras de matching (seção 3)
- Adicionar campo `person` em cada transação

#### Etapa 4: Installment Processing
- Se `processInstallments = true`:
  - Identificar parcelamentos
  - Agrupar e expandir
  - Gerar parcelas futuras
- Se `false`: Pular esta etapa

#### Etapa 5: Apply Filters
- Aplicar filtros sequencialmente
- Validar parâmetros
- Retornar apenas transações que passaram em todos os filtros

#### Etapa 6: Return to Client
- Serializar para JSON
- Enviar resposta HTTP

#### Etapa 7: Client-Side Analytics
- Usar composables para cálculos adicionais
- Gerar visualizações
- Exibir na UI

---

## 11. Regras de Validação

### 11.1 Transações

**Campos Obrigatórios**:
- transactionId: String não-vazia
- date: String no formato YYYY-MM-DD
- origin: String não-vazia
- destination: String não-vazia
- description: String não-vazia
- amount: Number válido

**Campos Opcionais**:
- recordedAt: String
- remoteId: String
- person: "Juliana" | "Gabriel" | null

### 11.2 Parâmetros de Query

**person**:
- Valores permitidos: "Juliana", "Gabriel", "Ambos"
- Não é case-sensitive

**startDate / endDate**:
- Formato: YYYY-MM-DD (regex obrigatória)
- startDate <= endDate
- Datas válidas no calendário

**processInstallments**:
- Valores: true, false, "true", "false"
- Conversão automática para boolean

**searchTerm, origin, destination**:
- String qualquer
- Sem validação de formato específica

### 11.3 Orçamentos (Budgets)

**Campos Obrigatórios**:
- category: String não-vazia
- person: "Juliana" | "Gabriel"
- month: Number 1-12
- year: Number YYYY (ex: 2025)
- amount: Number >= 0

**Validações**:
- Mês dentro do intervalo 1-12
- Ano razoável (ex: 2000-2100)
- Amount não pode ser negativo

---

## 12. Regras de Cache e Performance

### 12.1 Estratégia Atual

**Sem Cache no Servidor**:
- Cada requisição busca dados do Google Sheets
- Garantia de dados sempre atualizados
- Trade-off: Latência maior

### 12.2 Otimizações Implementadas

**Server-Side Processing**:
- Todo processamento pesado no servidor
- Cliente recebe apenas dados filtrados
- Reduz tráfego de rede
- Melhora performance em dispositivos lentos

**Filtros no Servidor**:
- Reduz tamanho do payload
- Cliente processa menos dados
- Renderização mais rápida

### 12.3 Cache Client-Side (Vue)

**Reactive State**:
- Dados armazenados em refs reativas
- Não refetch ao trocar entre componentes da mesma página
- Cache perdido ao navegar entre páginas

**Refresh Manual**:
- Botão "Atualizar" em cada página
- Força nova busca do servidor

---

## 13. Regras de Apresentação (UI)

### 13.1 Formatação de Valores

**Moeda (Currency)**:
```
Formato: R$ X.XXX,XX
Negativo: -R$ X.XXX,XX
Separador de milhar: .
Separador decimal: ,
```

**Datas**:
```
Formato display: DD/MM/YYYY
Formato storage: YYYY-MM-DD (ISO)
```

**Percentuais**:
```
Formato: XX,X%
Sinal: + para positivo, - para negativo
Cores: Verde (+), Vermelho (-)
```

### 13.2 Cores Temáticas

**Status**:
- Success (Positivo): Verde #10b981
- Warning (Atenção): Amarelo #f59e0b
- Danger (Negativo): Vermelho #ef4444
- Info (Informação): Azul #3b82f6

**Pessoas**:
- Juliana: Rosa #ec4899
- Gabriel: Azul #3b82f6
- Ambos: Roxo #8b5cf6

**Categorias de Custos**:
- Fixos: Âmbar #f59e0b
- Variáveis: Azul #3b82f6
- Comprometidos: Vermelho #ef4444

### 13.3 Ordenação Padrão

**Transações**: Data descendente (mais recente primeiro)
**Categorias**: Total descendente (maior gasto primeiro)
**Parcelamentos Ativos**: Data de início ascendente
**Alertas**: Prioridade descendente

---

## 14. Limitações e Restrições

### 14.1 Limitações Técnicas

1. **Somente Leitura**: Não é possível criar/editar transações via app
2. **Single Spreadsheet**: Suporta apenas uma planilha por instalação
3. **Sem Autenticação de Usuário**: App não tem login/senha
4. **Sem Cache**: Dados são sempre buscados do Google Sheets
5. **Sem Banco de Dados**: Nenhum armazenamento persistente no servidor

### 14.2 Restrições de Negócio

1. **Duas Pessoas**: Sistema projetado para Juliana e Gabriel especificamente
2. **Categorias Fixas**: Categorias definidas no Google Sheets (não no app)
3. **Formato de Parcelamento**: Deve seguir padrão XX/YY obrigatoriamente
4. **Identificação Automática**: Pode falhar se padrões não estiverem cadastrados

### 14.3 Dependências Externas

1. **Google Sheets API**: Disponibilidade e rate limits do Google
2. **Service Account**: Credenciais devem estar válidas
3. **Permissões**: Planilha deve estar compartilhada com service account
4. **Formato da Planilha**: Colunas devem estar na ordem esperada

---

## 15. Extensões Futuras Planejadas

### 15.1 Melhorias Técnicas

- **Cache com Redis**: Reduzir latência e requests ao Google
- **GraphQL API**: Permitir queries mais flexíveis
- **WebSockets**: Atualizações em tempo real
- **PWA**: Suporte offline

### 15.2 Novas Funcionalidades

- **Escrita no Google Sheets**: Criar transações pelo app
- **Múltiplas Planilhas**: Suportar várias contas/períodos
- **Autenticação**: Login para múltiplos usuários
- **Metas Financeiras**: Sistema de objetivos e acompanhamento
- **Relatórios Customizados**: Geração de PDFs e exportação
- **Notificações**: Alertas push de gastos elevados

### 15.3 Analytics Avançados

- **Machine Learning**: Previsão de gastos futuros
- **Detecção de Anomalias**: Identificar transações suspeitas
- **Otimização de Gastos**: Sugestões de economia
- **Análise Comparativa**: Benchmark com padrões similares

---

## 16. Glossário de Termos

**Transaction**: Movimentação financeira única registrada no sistema

**Person**: Pessoa associada à transação (Juliana ou Gabriel)

**Origin**: Conta ou cartão de onde saiu o dinheiro

**Destination**: Categoria, loja ou conta para onde foi o dinheiro

**Installment**: Parcelamento ou financiamento dividido em pagamentos mensais

**Budget**: Orçamento planejado para uma categoria específica

**Fixed Costs**: Custos fixos mensais recorrentes

**Variable Costs**: Custos variáveis que mudam mensalmente

**Committed Expenses**: Despesas já comprometidas (parcelamentos)

**Analytics**: Análises e insights gerados a partir dos dados

**Trend**: Tendência de aumento/diminuição ao longo do tempo

**Alert**: Alerta automático sobre padrões ou anomalias

**Insight**: Informação relevante extraída automaticamente dos dados

**Filter**: Filtro aplicado para segmentar transações

**Query Params**: Parâmetros de busca enviados na URL da API

**Composable**: Função reutilizável do Vue 3 para lógica compartilhada

**Server-Side**: Processamento que ocorre no servidor (não no navegador)

**Client-Side**: Processamento que ocorre no navegador do usuário

---

## 17. Contato e Suporte

Para dúvidas sobre as regras de negócio ou sugestões de melhorias:
- Consultar documentação técnica em `CLAUDE.md`
- Consultar configuração em `CONFIGURACAO.md`
- Abrir issue no repositório do projeto
- Revisar código-fonte nos diretórios `server/utils/` e `composables/`

---

**Última Atualização**: Dezembro 2025
**Versão do Documento**: 1.0
