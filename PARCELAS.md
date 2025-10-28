# Sistema de Processamento de Parcelas

## Visão Geral

O sistema processa automaticamente transações de parcelas/financiamentos, expandindo-as ao longo dos meses para uma visualização correta dos gastos mensais.

## Como Funciona

### 1. Identificação de Parcelas

Transações são consideradas parcelas quando:
- A coluna **Destination** contém: `Installments`, `Financing`, `Parcela` ou `Parcelamento`
- A **descrição** segue o formato: `Nome da despesa X/Y`
  - `X` = número da parcela atual
  - `Y` = total de parcelas

**Exemplos:**
- `Odonto Delgado 6/6` → Última parcela de 6
- `Netflix 1/12` → Primeira parcela de 12
- `Geladeira Casas Bahia 3/10` → Terceira parcela de 10

### 2. Processamento

O sistema realiza 3 etapas:

#### Etapa 1: Agrupar Duplicadas
Quando múltiplas parcelas vêm na mesma transação (ex: recebeu "3/6", "4/6" e "5/6" juntas), o sistema agrupa e soma os valores.

#### Etapa 2: Calcular Data Inicial
- Se a transação é `Odonto Delgado 6/6` registrada em `2025-06-15`
- O sistema calcula que a parcela `1/6` começou em `2025-01-15` (6 - 6 = 0, 6 - 1 = 5 meses atrás)

#### Etapa 3: Expandir Parcelas
Cria uma transação separada para cada parcela:
- `Odonto Delgado 1/6` → 2025-01-15
- `Odonto Delgado 2/6` → 2025-02-15
- `Odonto Delgado 3/6` → 2025-03-15
- `Odonto Delgado 4/6` → 2025-04-15
- `Odonto Delgado 5/6` → 2025-05-15
- `Odonto Delgado 6/6` → 2025-06-15

Cada parcela recebe:
- **Valor**: Total da transação ÷ número de parcelas
- **Data**: Data inicial + (N-1) meses
- **ID único**: Para evitar duplicações

### 3. Resultado na Análise

**Antes do Processamento:**
```
Junho 2025:
  - Odonto Delgado 6/6: R$ 600,00
Total: R$ 600,00
```

**Depois do Processamento:**
```
Janeiro 2025:
  - Odonto Delgado 1/6: R$ 100,00
Fevereiro 2025:
  - Odonto Delgado 2/6: R$ 100,00
Março 2025:
  - Odonto Delgado 3/6: R$ 100,00
Abril 2025:
  - Odonto Delgado 4/6: R$ 100,00
Maio 2025:
  - Odonto Delgado 5/6: R$ 100,00
Junho 2025:
  - Odonto Delgado 6/6: R$ 100,00

Total distribuído: R$ 600,00
```

## Configuração

### Formato da Descrição

O sistema espera descrições no formato:
```
[Nome da despesa] [Número]/[Total]
```

**Válido:**
- ✅ `Odonto Delgado 6/6`
- ✅ `Netflix Premium 1/12`
- ✅ `Cartão de Crédito XPTO 10/24`

**Inválido:**
- ❌ `Odonto Delgado (6 de 6)` - Formato diferente
- ❌ `Odonto Delgado` - Sem informação de parcela
- ❌ `6/6 Odonto Delgado` - Número antes do nome

### Categoria de Destino

Certifique-se que transações de parcelas tenham uma dessas palavras na coluna **Destination**:
- `Installments`
- `Financing`
- `Parcela`
- `Parcelamento`

## Logs de Debug

No console do navegador, você verá:
```
📦 [Installments] Transações originais: 150
🔗 [Installments] Após agrupar duplicadas: 145
📅 Expandido: Odonto Delgado 6/6 → 6 parcelas mensais
✨ [Installments] Após expandir parcelas: 170
```

## Cenários de Uso

### Cenário 1: Parcela Única Registrada
**Google Sheets:**
```
Data: 2025-06-15
Destination: Installments/Financing
Descrição: Odonto Delgado 6/6
Valor: R$ 600,00
```

**Resultado:** 6 transações mensais de R$ 100,00 cada (Jan a Jun)

### Cenário 2: Múltiplas Parcelas Juntas
**Google Sheets:**
```
Data: 2025-06-15
Destination: Installments/Financing
Descrição: Netflix 3/12
Valor: R$ 45,00

Data: 2025-06-15
Destination: Installments/Financing
Descrição: Netflix 4/12
Valor: R$ 45,00

Data: 2025-06-15
Destination: Installments/Financing
Descrição: Netflix 5/12
Valor: R$ 45,00
```

**Resultado:**
1. Sistema agrupa as 3 transações (R$ 135,00 total)
2. Identifica como mesma série de parcelas
3. Expande em 12 transações de R$ 11,25 cada (R$ 135,00 ÷ 12)

### Cenário 3: Cartão de Crédito - Múltiplas Parcelas na Mesma Data
**Google Sheets (parcelas do cartão lançadas juntas):**
```
Data: 21/09/2025
Origin: Credit Card Gabriel
Descrição: EC *MERCADOLIVRECA01/07
Valor: R$ 52,24

Data: 21/09/2025
Origin: Credit Card Gabriel
Descrição: EC *MERCADOLIVRECA02/07
Valor: R$ 52,18

Data: 21/09/2025
Origin: Credit Card Gabriel
Descrição: EC *MERCADOLIVRECA03/07
Valor: R$ 52,18

... (até 07/07)
```

**Comportamento do Sistema:**
1. Detecta que são da mesma série por:
   - Descrição base: "EC *MERCADOLIVRECA"
   - Total de parcelas: 7
   - Origem: "Credit Card Gabriel"

2. Agrupa as 7 transações (tem ≥50% das parcelas = 7/7 = 100%)

3. Redistribui as datas automaticamente:
   - `EC *MERCADOLIVRECA01/07` → 01/09/2025 (dia 1 do mês original)
   - `EC *MERCADOLIVRECA02/07` → 01/10/2025 (1 mês depois)
   - `EC *MERCADOLIVRECA03/07` → 01/11/2025 (2 meses depois)
   - ... até 07/07

4. Mantém os valores originais de cada parcela

**Log esperado no console:**
```
🔄 Redistribuindo 7 parcelas de: EC *MERCADOLIVRECA
```

**Importante:**
- Só redistribui se tiver ≥50% das parcelas presentes
- Usa a data da primeira parcela encontrada como base
- Define todas as datas para o dia 1 do mês
- Mantém os valores individuais (não recalcula)

### Cenário 4: Parcelas já Distribuídas
Se suas parcelas já vêm separadas mês a mês no Google Sheets, o sistema:
- Detecta que são parcelas diferentes (1/12, 2/12, 3/12...)
- Não duplica, pois cada uma tem ID único
- Mantém a distribuição original

## Limitações

1. **Formato rígido**: A descrição DEVE seguir o padrão `Nome X/Y`
2. **Data normalizada**: Todas as parcelas terão o dia 1 do mês
3. **Detecção automática**: Se o formato não for reconhecido, a transação é mantida como está
4. **Agrupamento por série**: Parcelas são agrupadas por descrição base + total + origem

## Comportamentos Especiais

### Redistribuição vs Expansão
O sistema escolhe automaticamente entre dois comportamentos:

**Redistribuição** (quando ≥50% das parcelas estão presentes):
- Mantém os valores originais de cada parcela
- Redistribui as datas mês a mês
- Útil para cartões de crédito que lançam todas as parcelas juntas

**Expansão** (quando <50% das parcelas estão presentes):
- Divide o valor total igualmente entre todas as parcelas
- Cria todas as parcelas do 1/X até X/X
- Útil para parcelas únicas registradas

## Customização

Para ajustar o comportamento, edite: `composables/useInstallments.ts`

### Mudar Padrão de Regex
```typescript
const parseInstallment = (description: string): InstallmentInfo | null => {
  // Modifique o regex para seu formato
  const regex = /^(.+?)\s+(\d+)\/(\d+)\s*$/
  // ...
}
```

### Adicionar Categorias de Parcela
```typescript
const isInstallmentTransaction = (transaction: Transaction): boolean => {
  const destination = transaction.destination?.toLowerCase() || ''
  return destination.includes('installment') ||
         destination.includes('financing') ||
         destination.includes('sua_categoria_aqui') // Adicione aqui
}
```

## Verificação

Para verificar se está funcionando:
1. Acesse a página "Gastos por Categoria"
2. Abra o console do navegador (F12)
3. Procure por logs com `📅 Expandido:`
4. Filtre por diferentes meses para ver as parcelas distribuídas
