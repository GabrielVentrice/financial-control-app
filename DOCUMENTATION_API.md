# Documentation API - Guia Completo

> **Resumo**: Sistema de API para fornecer documentação da arquitetura em formato consumível por IAs e ferramentas automatizadas.

## 📋 Visão Geral

Este projeto agora inclui endpoints de API dedicados para fornecer documentação da arquitetura de forma programática. A solução foi projetada especificamente para ser consumida por agentes de IA (como Claude, GPT) e ferramentas automatizadas.

### Características Principais

✅ **Documentação sempre acessível** via API HTTP
✅ **Formato Markdown** para fácil consumo por IAs
✅ **Geração dinâmica** baseada no código atual
✅ **Scripts de validação** para manter docs atualizados
✅ **Exemplos práticos** de integração

---

## 🚀 Endpoints Disponíveis

### 1. GET /api/docs/architecture

Retorna o arquivo `API_ARCHITECTURE.md` completo em formato Markdown.

**Uso:**
```bash
curl http://localhost:3000/api/docs/architecture
```

**Resposta:**
- Content-Type: `text/markdown`
- Body: Conteúdo completo do arquivo API_ARCHITECTURE.md

**Para que serve:**
- IAs precisando de contexto sobre a API
- Ferramentas de documentação automatizadas
- Sistemas de integração externos
- Geração de código baseada em LLMs

---

### 2. GET /api/docs/generate

Gera documentação dinamicamente escaneando o código atual.

**Uso:**
```bash
curl http://localhost:3000/api/docs/generate
```

**Resposta:**
- Content-Type: `application/json`
- Body: Objeto com metadados da documentação

**Estrutura da Resposta:**
```json
{
  "generatedAt": "2025-10-30T13:00:00.000Z",
  "endpoints": [
    {
      "method": "GET",
      "path": "/transactions",
      "file": "transactions.get.ts",
      "description": "...",
      "queryParams": ["person", "startDate", "endDate"]
    }
  ],
  "utilities": [
    {
      "file": "googleSheets.ts",
      "path": "server/utils/googleSheets.ts",
      "functions": ["fetchTransactionsFromGoogleSheets"]
    }
  ],
  "types": {
    "interfaces": [
      {
        "name": "Transaction",
        "fields": ["transactionId: string", "date: string", ...]
      }
    ]
  },
  "architecture": {
    "layers": [...]
  },
  "markdown": "# API Architecture Documentation..."
}
```

**Para que serve:**
- Verificar se documentação está atualizada
- Descobrir endpoints automaticamente
- Auditar estrutura do código
- Gerar referência de API automaticamente

---

## 🛠️ Scripts de Manutenção

### Verificar Documentação

```bash
npm run docs:check
```

Valida que `API_ARCHITECTURE.md` existe e contém todas as seções esperadas.

**Saída:**
```
📚 API Documentation Tool

✅ API_ARCHITECTURE.md exists
📄 File size: 12.34 KB
✅ Documentation appears complete

💡 To generate updated documentation, run: npm run docs:generate
```

---

### Gerar Preview da Documentação

```bash
npm run docs:generate
```

Inicia o servidor dev, gera documentação dinamicamente e exibe preview no console.

**O que faz:**
1. Inicia servidor de desenvolvimento
2. Chama endpoint `/api/docs/generate`
3. Exibe estatísticas e preview
4. Para o servidor automaticamente

**Saída:**
```
📚 API Documentation Tool

🔧 Starting dev server to generate documentation...

✅ Dev server started

🔍 Fetching generated documentation...
✅ Documentation generated successfully

📊 Summary:
   - Endpoints: 3
   - Utilities: 4
   - Type Interfaces: 5
   - Generated at: 30/10/2025, 10:00:00

📝 Preview (Markdown):
────────────────────────────────────────
# API Architecture Documentation (Auto-Generated)
...
────────────────────────────────────────

💡 To update API_ARCHITECTURE.md, run: npm run docs:update
```

---

### Instruções de Atualização

```bash
npm run docs:update
```

Exibe instruções para atualizar manualmente a documentação.

**Por que manual?**
- `API_ARCHITECTURE.md` é mais completo e detalhado
- Inclui explicações e contexto que não podem ser gerados automaticamente
- Use a documentação gerada como **referência**, mas mantenha qualidade manual

---

## 📝 Workflow de Atualização

Quando fizer mudanças na API, siga este workflow:

```bash
# 1. Faça suas mudanças no código
# Exemplo: editar server/api/transactions.get.ts

# 2. Verifique status da documentação
npm run docs:check

# 3. Gere preview da documentação atualizada
npm run docs:generate

# 4. Revise a documentação gerada
# Compare com API_ARCHITECTURE.md

# 5. Atualize API_ARCHITECTURE.md manualmente
# Use a documentação gerada como referência

# 6. Verifique se ficou completo
npm run docs:check

# 7. Commit código e documentação juntos
git add server/ API_ARCHITECTURE.md
git commit -m "feat: novo endpoint com documentação"
```

---

## 🤖 Exemplos de Integração

### Exemplo 1: Consumo Básico com Node.js

```javascript
// Buscar documentação completa
const response = await fetch('http://localhost:3000/api/docs/architecture')
const markdown = await response.text()
console.log(markdown)

// Buscar metadata dinâmica
const genResponse = await fetch('http://localhost:3000/api/docs/generate')
const data = await genResponse.json()
console.log(`Endpoints: ${data.endpoints.length}`)
```

### Exemplo 2: Script Completo

Veja o arquivo `examples/ai-documentation-consumer.js` para um exemplo completo de:
- Buscar documentação
- Analisar endpoints
- Verificar cobertura
- Pesquisar informações específicas

```bash
# Execute o exemplo (com servidor rodando)
node examples/ai-documentation-consumer.js
```

### Exemplo 3: Uso com IA

```bash
# Salvar documentação para contexto de IA
curl http://localhost:3000/api/docs/architecture > api-context.md

# Usar com Claude, GPT, etc.
# "Aqui está a documentação da API: [colar conteúdo]"
# "Com base nisso, me ajude a criar um novo endpoint..."
```

### Exemplo 4: CI/CD Validation

```bash
#!/bin/bash
# Script de validação para CI/CD

echo "Verificando documentação..."
npm run docs:check

if [ $? -ne 0 ]; then
  echo "❌ Documentação está incompleta ou ausente"
  exit 1
fi

echo "✅ Documentação validada com sucesso"
```

---

## 📁 Arquivos Criados

### Endpoints da API

1. **`server/api/docs/architecture.get.ts`**
   - Endpoint que retorna API_ARCHITECTURE.md
   - Content-Type: text/markdown
   - Lê arquivo do disco e retorna conteúdo

2. **`server/api/docs/generate.get.ts`**
   - Endpoint de geração dinâmica
   - Escaneia código atual
   - Retorna metadata em JSON
   - Gera markdown automaticamente

### Scripts de Manutenção

3. **`scripts/update-docs.mjs`**
   - Script Node.js para manutenção de documentação
   - Comandos: check, generate, update
   - Gerencia servidor dev automaticamente
   - Validação e preview

### Documentação

4. **`server/api/docs/README.md`**
   - Documentação completa dos endpoints
   - Exemplos de uso
   - Troubleshooting
   - Melhores práticas

5. **`DOCUMENTATION_API.md`** (este arquivo)
   - Guia completo da solução
   - Workflow de atualização
   - Exemplos de integração

### Exemplos

6. **`examples/ai-documentation-consumer.js`**
   - Exemplo completo de consumo
   - Análise automática
   - Verificação de cobertura
   - Pesquisa em documentação

---

## 🎯 Quando Atualizar a Documentação

Atualize `API_ARCHITECTURE.md` sempre que:

### 1. Adicionar Novos Endpoints

Quando criar `server/api/novo-endpoint.get.ts`:

- [ ] Documentar caminho e método HTTP
- [ ] Listar todos os query parameters
- [ ] Fornecer exemplos de requests
- [ ] Descrever estrutura da resposta

### 2. Adicionar Utilities

Quando criar `server/utils/nova-utility.ts`:

- [ ] Documentar funções exportadas
- [ ] Descrever propósito e uso
- [ ] Atualizar camadas de arquitetura se necessário

### 3. Modificar Types

Quando alterar `types/transaction.ts`:

- [ ] Atualizar tabela de parâmetros
- [ ] Adicionar exemplos com novos parâmetros
- [ ] Documentar regras de validação

### 4. Mudar Arquitetura

Quando mudar fluxo de dados:

- [ ] Atualizar diagramas de arquitetura
- [ ] Revisar seção de data flow
- [ ] Atualizar exemplos de migração

---

## ✅ Melhores Práticas

### 1. Mantenha Sincronizado
```bash
# Sempre antes de commit
npm run docs:check
```

### 2. Use Exemplos Reais
```typescript
// ✅ BOM - exemplo testado
GET /api/transactions?person=Gabriel&startDate=2025-01-01

// ❌ RUIM - exemplo genérico
GET /api/transactions?param=value
```

### 3. Seja Específico
```markdown
✅ BOM: "Retorna array de Transaction objects com campo person populated"
❌ RUIM: "Retorna dados filtrados"
```

### 4. Documente Comportamento Atual
```markdown
✅ BOM: "Installment processing is enabled by default (processInstallments=true)"
❌ RUIM: "Installment processing pode ser habilitado"
```

### 5. Formato Amigável para IA
- Use markdown estruturado
- Headers claros (##, ###)
- Code blocks com linguagem especificada
- Exemplos práticos e completos

---

## 🔮 Melhorias Futuras

Possíveis evoluções do sistema:

### Automação
- [ ] Git pre-commit hook para validar documentação
- [ ] Geração automática de changelog
- [ ] CI/CD check para sincronização

### Formatos
- [ ] Geração de OpenAPI/Swagger spec
- [ ] Suporte a múltiplos formatos de saída (JSON, YAML, HTML)
- [ ] Versioning de documentação

### Performance
- [ ] Cache com ETag
- [ ] Invalidação automática quando código muda
- [ ] CDN para documentação estática

### Integração
- [ ] Webhook para notificar quando docs ficam desatualizados
- [ ] Dashboard de cobertura de documentação
- [ ] Diff endpoint para comparar versões

---

## 🆘 Troubleshooting

### Erro 500 ao acessar /api/docs/architecture

**Causa**: Arquivo API_ARCHITECTURE.md não encontrado

**Solução**:
```bash
# Verificar se arquivo existe
ls -la API_ARCHITECTURE.md

# Se não existir, criar a partir do template
npm run docs:generate
```

### Documentação gerada está incompleta

**Causa**: Endpoints não seguem convenção de nomenclatura

**Solução**:
```bash
# Verificar naming dos arquivos
ls -la server/api/**/*.ts

# Devem ser: *.get.ts, *.post.ts, *.put.ts, etc.
```

### Script docs:generate falha

**Causa**: Servidor não iniciou a tempo

**Solução**:
- Aguardar mais tempo para servidor iniciar
- Verificar se porta 3000 está disponível
- Executar manualmente: `npm run dev` e depois testar endpoint

---

## 📚 Documentação Relacionada

- **[API_ARCHITECTURE.md](./API_ARCHITECTURE.md)** - Documentação completa da API
- **[CLAUDE.md](./CLAUDE.md)** - Contexto do projeto e guidelines
- **[README.md](./README.md)** - Setup e visão geral do projeto
- **[server/api/docs/README.md](./server/api/docs/README.md)** - Detalhes técnicos dos endpoints

---

## 🎓 Resumo Rápido

**Para consumir a documentação:**
```bash
curl http://localhost:3000/api/docs/architecture
```

**Para verificar se está atualizada:**
```bash
npm run docs:check
```

**Para gerar preview:**
```bash
npm run docs:generate
```

**Para usar em IA:**
1. Inicie o servidor: `npm run dev`
2. Baixe a documentação: `curl http://localhost:3000/api/docs/architecture > context.md`
3. Forneça para a IA junto com sua pergunta

**Workflow completo:**
```bash
# 1. Alterar código
vim server/api/transactions.get.ts

# 2. Validar
npm run docs:check

# 3. Ver o que mudou
npm run docs:generate

# 4. Atualizar docs manualmente
vim API_ARCHITECTURE.md

# 5. Verificar novamente
npm run docs:check

# 6. Commit
git add . && git commit -m "feat: novo endpoint + docs"
```

---

**Pronto!** Agora você tem um sistema completo de documentação consumível por IAs e ferramentas automatizadas, com instruções claras para mantê-lo sempre atualizado. 🚀
