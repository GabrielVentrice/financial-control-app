# Debug do Filtro Global por Pessoa

## Correções Aplicadas

### Problema Identificado
O `v-model` no Sidemenu estava tentando modificar um `computed` de leitura, impedindo que o valor fosse atualizado.

### Solução Implementada
Criado um `computed` com getter/setter no `Sidemenu.vue:88-93` que:
- **GET**: Lê o valor global
- **SET**: Chama `setPersonFilter()` para atualizar o estado global

## Como Testar

### 1. Inicie o Servidor
```bash
npm run dev
```

### 2. Abra o Navegador
Acesse: http://localhost:3001 (ou a porta indicada)

### 3. Abra o Console do Desenvolvedor
- **Chrome/Edge**: F12 ou Ctrl+Shift+I (Cmd+Option+I no Mac)
- **Firefox**: F12 ou Ctrl+Shift+K (Cmd+Option+K no Mac)

### 4. Teste o Filtro
1. No sidemenu (menu lateral), mude o seletor de pessoa:
   - Selecione "Juliana"
   - Observe os logs no console

**Logs Esperados no Console:**
```
🔄 Mudando filtro de pessoa para: Juliana
✅ Filtro atualizado. Valor atual: Juliana
📊 [Categories] Recomputando filteredTransactions. Pessoa selecionada: Juliana
📊 [Categories] Filtrado por Juliana: 100 -> 45 transações
📊 [Categories] Total após filtros: 45
```

2. Mude para "Gabriel" e observe novamente
3. Mude para "Ambos" e observe

### 5. Verifique as Páginas

Navegue entre as páginas e observe que o filtro permanece aplicado:
- **Dashboard** (/)
- **Gastos por Categoria** (/categories)
- **Transações** (/transactions)

## O que Verificar

### ✅ Logs de Sucesso
- `🔄 Mudando filtro de pessoa para: [pessoa]` - Indica que o setter foi chamado
- `✅ Filtro atualizado` - Confirma que o valor global foi atualizado
- `📊 [Categories] Recomputando` - Mostra que o computed detectou a mudança

### ❌ Problemas Possíveis

**1. Não vê os logs de mudança (`🔄`)**
- O setter do computed não está sendo chamado
- Verifique se o `v-model` está correto no Sidemenu

**2. Vê logs de mudança mas não vê recomputação (`📊`)**
- O computed não está rastreando a dependência reativa
- Verifique se `selectedPerson.value` está sendo acessado no computed

**3. Nenhuma transação aparece após filtrar**
- Os padrões de identificação podem estar incorretos
- Verifique `composables/usePersonFilter.ts:22-40` e ajuste os padrões

## Verificar Padrões de Identificação

Adicione log temporário no `identifyPerson`:

```typescript
const identifyPerson = (origin: string): PersonType | null => {
  console.log('🔍 Identificando pessoa para origin:', origin)
  const originLower = origin.toLowerCase()

  // ... resto do código

  if (julianaPatterns.some(pattern => originLower.includes(pattern))) {
    console.log('✅ Identificado como Juliana')
    return 'Juliana'
  }

  if (gabrielPatterns.some(pattern => originLower.includes(pattern))) {
    console.log('✅ Identificado como Gabriel')
    return 'Gabriel'
  }

  console.log('⚠️ Não identificado como ninguém')
  return null
}
```

## Remover Logs de Debug

Quando tudo estiver funcionando, remova os `console.log` dos arquivos:
- `composables/usePersonFilter.ts`
- `pages/categories.vue`
- E qualquer outro que tenha adicionado

## Estrutura de Dados Esperada

### Google Sheets - Coluna "Origin"
Exemplos de valores que devem estar na planilha:
- "Bank Account Juliana"
- "Credit Card Gabriel"
- "Bank Account Gabriel"
- "Credit Card Juliana"

Ajuste os padrões em `composables/usePersonFilter.ts` se seus valores forem diferentes.
