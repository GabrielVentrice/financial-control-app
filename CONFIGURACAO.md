# Configuração do Sistema de Controle Financeiro

## Visão Geral

Sistema completo de controle financeiro com dashboard, filtros por pessoa (Juliana/Gabriel) e análise de gastos por categoria.

## Funcionalidades Implementadas

### 1. Dashboard Principal (`/`)
- Visão geral das transações
- Busca por descrição
- Filtro global por pessoa (Juliana/Gabriel/Ambos)
- Totalizadores de transações e valores

### 2. Gastos por Categoria (`/categories`)
- Análise detalhada de gastos agrupados por categoria (coluna Destination)
- **Ícones/emojis automáticos** para cada categoria baseado no nome
- Filtro por mês (padrão: mês atual) - Design compacto
- Filtro global por pessoa aplicado automaticamente
- Estatísticas: total por categoria, percentual, média por transação
- **Valores destacados** com fonte maior e gradiente para melhor visualização
- Barra de progresso animada mostrando percentual de cada categoria

### 3. Todas as Transações (`/transactions`)
- Lista completa de transações com paginação
- Filtros por descrição, período (data inicial/final) e pessoa
- Estatísticas agregadas

## Sistema de Processamento de Parcelas

O sistema detecta e processa automaticamente parcelas/financiamentos, distribuindo-as ao longo dos meses.

### Como Funciona

**Quando uma transação tem:**
- **Destination**: `Installments/Financing`, `Parcela` ou `Parcelamento`
- **Descrição**: No formato `Nome X/Y` (ex: `Odonto Delgado 6/6`)

**O sistema:**
1. Identifica a parcela atual (X) e total (Y)
2. Calcula a data da primeira parcela (1/Y)
3. Expande em Y transações mensais, distribuindo o valor igualmente

**Exemplo:**
```
Entrada (Google Sheets):
  Data: 2025-06-15
  Descrição: Odonto Delgado 6/6
  Valor: R$ 600,00

Saída (Sistema):
  2025-01-15: Odonto Delgado 1/6 → R$ 100,00
  2025-02-15: Odonto Delgado 2/6 → R$ 100,00
  2025-03-15: Odonto Delgado 3/6 → R$ 100,00
  2025-04-15: Odonto Delgado 4/6 → R$ 100,00
  2025-05-15: Odonto Delgado 5/6 → R$ 100,00
  2025-06-15: Odonto Delgado 6/6 → R$ 100,00
```

**Benefício:** As parcelas aparecem mês a mês na análise, não todas juntas no mesmo mês.

### Detecção Inteligente

O sistema agora detecta parcelas de **duas formas**:
1. **Por categoria**: Destination contém `Installments`, `Financing`, `Parcela` ou `Parcelamento`
2. **Por descrição**: Qualquer descrição no formato `Nome X/Y` (ex: `EC *MERCADOLIVRECA 03/07`)

Isso permite processar parcelas de cartão de crédito mesmo que não tenham categoria específica.

### Redistribuição Automática

Quando múltiplas parcelas aparecem juntas na mesma data (comum em cartões de crédito):
- Se ≥50% das parcelas estão presentes → **Redistribui** as datas mês a mês
- Se <50% das parcelas → **Expande** normalmente criando todas as parcelas

**Exemplo de redistribuição:**
```
Entrada (7 parcelas na mesma data):
  21/09/2025: EC *MERCADOLIVRECA 01/07 → R$ 52,24
  21/09/2025: EC *MERCADOLIVRECA 02/07 → R$ 52,18
  ... (até 07/07)

Saída (redistribuídas mês a mês):
  01/09/2025: EC *MERCADOLIVRECA 01/07 → R$ 52,24
  01/10/2025: EC *MERCADOLIVRECA 02/07 → R$ 52,18
  ... (até 01/03/2026)
```

**Documentação completa:** Ver arquivo `PARCELAS.md`

## Configuração Importante: Categorias Excluídas

A página de "Gastos por Categoria" possui uma configuração para excluir automaticamente certas categorias da análise.

### Como Configurar Categorias Excluídas

Edite o arquivo: `pages/categories.vue` (linhas 178-185)

```typescript
const EXCLUDED_CATEGORIES = [
  'Sem Categoria',
  'Credit Account Juliana',
  'Credit Account Gabriel',
  'Bank Account Juliana',
  'Bank Account Gabriel',
  // Adicione mais categorias aqui conforme necessário
]
```

### Casos de Uso

**Por que excluir categorias?**
- **Transferências entre contas**: "Credit Account Juliana" ou "Bank Account Gabriel" geralmente representam transferências entre contas próprias, não gastos reais
- **Sem Categoria**: Transações sem categoria definida podem poluir a análise
- **Categorias internas**: Movimentações que não são despesas efetivas

**Como adicionar mais categorias:**
```typescript
const EXCLUDED_CATEGORIES = [
  'Sem Categoria',
  'Credit Account Juliana',
  'Credit Account Gabriel',
  'Transferência Interna',
  'Investimento Próprio',
  'Reserva de Emergência',
  // Suas categorias personalizadas aqui
]
```

**Importante:**
- A comparação é **case-insensitive** (não diferencia maiúsculas/minúsculas)
- Use o nome exato da categoria como aparece no Google Sheets
- As categorias excluídas não aparecem na lista, mas seus valores ainda contam nos totais se desejado

## Configuração Importante: Filtro por Pessoa

O sistema identifica automaticamente se uma transação pertence à Juliana ou Gabriel baseado na coluna **Origin** do Google Sheets.

### Como Configurar os Padrões de Identificação

Edite o arquivo: `composables/usePersonFilter.ts`

```typescript
const identifyPerson = (origin: string): PersonType | null => {
  const originLower = origin.toLowerCase()

  // PERSONALIZE AQUI: Adicione padrões para identificar contas/cartões da Juliana
  const julianaPatterns = [
    'juliana',
    'cartao juliana',
    'conta juliana',
    'nubank juliana',
    'itau juliana',
    // Adicione mais padrões conforme necessário
  ]

  // PERSONALIZE AQUI: Adicione padrões para identificar contas/cartões do Gabriel
  const gabrielPatterns = [
    'gabriel',
    'cartao gabriel',
    'conta gabriel',
    'nubank gabriel',
    'itau gabriel',
    // Adicione mais padrões conforme necessário
  ]

  // ... resto do código
}
```

### Exemplos de Padrões

Se no Google Sheets você tem na coluna Origin valores como:
- "Cartão Nubank Juliana"
- "Conta Corrente Gabriel"
- "C6 Bank - Juliana"

Configure os padrões assim:

```typescript
const julianaPatterns = [
  'juliana',
  'nubank juliana',
  'c6 bank - juliana',
]

const gabrielPatterns = [
  'gabriel',
  'conta corrente gabriel',
]
```

**Importante**:
- Os padrões são case-insensitive (não diferencia maiúsculas/minúsculas)
- Use o método `includes()`, então o padrão "juliana" vai encontrar "Cartão Juliana", "Conta de Juliana", etc.
- Transações que não corresponderem a nenhum padrão não serão filtradas individualmente, mas aparecerão quando selecionar "Ambos"

## Ícones de Categorias

O sistema identifica automaticamente o tipo de categoria e atribui um emoji apropriado:

| Tipo | Emoji | Palavras-chave |
|------|-------|----------------|
| Alimentação/Restaurantes | 🍽️ | restaurante, comida, alimentação, almoço, jantar, lanche |
| Mercado | 🛒 | mercado, supermercado, grocery |
| Transporte | 🚗 | uber, taxi, transporte, combustível, gasolina |
| Saúde | ⚕️ | saúde, farmácia, médico, hospital |
| Educação | 📚 | educação, escola, curso, livro |
| Moradia | 🏠 | aluguel, condomínio, casa, rent |
| Contas/Serviços | 📄 | conta, luz, água, internet, telefone |
| Entretenimento | 🎬 | cinema, streaming, netflix, spotify, lazer |
| Roupas | 👕 | roupa, vestuário, loja, clothes |
| Tecnologia | 💻 | tecnologia, eletrônico, tech, computador |
| Viagem | ✈️ | viagem, hotel, passagem, travel |
| Pets | 🐾 | pet, veterinário, animal |
| Beleza | 💄 | beleza, salão, cabelo, cosmético |
| Academia | 💪 | academia, esporte, fitness, gym |
| Pagamentos | 💳 | pagamento, transferência, pix |
| Investimentos | 📈 | investimento, poupança, savings |
| Bebidas | ☕ | bar, bebida, café, drink, coffee |
| Presentes | 🎁 | presente, gift |
| Outros | 💰 | (padrão para categorias não identificadas) |

**Nota**: A identificação é case-insensitive (não diferencia maiúsculas/minúsculas) e busca palavras-chave dentro do nome da categoria.

## Como Usar o Sistema

### 1. Iniciar o Servidor
```bash
npm run dev
```
Acesse: http://localhost:3000

### 2. Filtro Global por Pessoa
No menu lateral (sidemenu), há um seletor na parte inferior:
- **Ambos**: Mostra todas as transações
- **Juliana**: Mostra apenas transações identificadas como da Juliana
- **Gabriel**: Mostra apenas transações identificadas como do Gabriel

Este filtro é aplicado globalmente em todas as páginas.

### 3. Página de Categorias
- Selecione o mês desejado (padrão: mês atual)
- Use o filtro global de pessoa no sidemenu
- Clique em "Atualizar" para buscar os dados

### 4. Navegação
Use o menu lateral para navegar entre:
- Dashboard (visão geral)
- Gastos por Categoria (análise detalhada)
- Transações (lista completa com filtros avançados)

## Estrutura de Dados do Google Sheets

O sistema espera as seguintes colunas:
- **Transaction Id**: ID único da transação
- **Date**: Data da transação
- **Origin**: Origem (conta/cartão) - USADO PARA IDENTIFICAR PESSOA
- **Destination**: Destino - USADO COMO CATEGORIA
- **Description**: Descrição da transação
- **Amount**: Valor em formato numérico
- **Recorded at**: Data de registro
- **Remote Id**: ID remoto (opcional)

## Tecnologias Utilizadas

- **Nuxt 3**: Framework Vue.js full-stack
- **Tailwind CSS**: Framework CSS utilitário
- **TypeScript**: Tipagem estática
- **Google Sheets API**: Integração com planilhas
- **Vue 3 Composition API**: Composables reutilizáveis

## Cores do Tema

O tema usa uma paleta azul (primary) configurada em `tailwind.config.js`:
- primary-500: #0ea5e9
- primary-600: #0284c7
- primary-700: #0369a1

Para personalizar, edite o arquivo `tailwind.config.js`.

## Suporte e Problemas

Se as transações não estiverem sendo filtradas corretamente por pessoa:
1. Verifique os valores da coluna "Origin" no Google Sheets
2. Ajuste os padrões em `composables/usePersonFilter.ts`
3. Reinicie o servidor de desenvolvimento
4. Limpe o cache do navegador se necessário
