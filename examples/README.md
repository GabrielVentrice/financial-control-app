# Exemplos de Uso da Documentation API

Este diretório contém exemplos práticos de como consumir a Documentation API.

## 📁 Arquivos Disponíveis

### 1. `ai-documentation-consumer.js` (Node.js/JavaScript)

Exemplo completo em JavaScript demonstrando:
- ✅ Buscar documentação completa em Markdown
- ✅ Buscar metadata gerada dinamicamente
- ✅ Análise automática de endpoints e utilitários
- ✅ Pesquisa em documentação
- ✅ Verificação de cobertura de documentação

**Como usar:**
```bash
# 1. Inicie o servidor de desenvolvimento
npm run dev

# 2. Em outro terminal, execute o exemplo
node examples/ai-documentation-consumer.js
```

**Exemplo de saída:**
```
🤖 AI Documentation Consumer Example

📚 Fetching API Architecture Documentation...
✅ Documentation fetched successfully!
📄 Size: 7.43 KB
📝 Lines: 286

📋 Documentation Sections:
   - Overview
   - Architecture Layers
   - API Endpoint Usage
   ...

🔧 Fetching Generated Documentation...
✅ Generated documentation fetched successfully!
📡 Endpoints: 3
🔧 Utilities: 4
📦 Type Interfaces: 5
...
```

---

### 2. `ai-documentation-consumer.py` (Python)

Exemplo equivalente em Python para:
- ✅ Integração com ferramentas Python
- ✅ Mesmas funcionalidades do exemplo JavaScript
- ✅ Export para arquivos JSON/Markdown

**Requisitos:**
```bash
pip install requests
```

**Como usar:**
```bash
# 1. Inicie o servidor de desenvolvimento
npm run dev

# 2. Em outro terminal, execute o exemplo
python3 examples/ai-documentation-consumer.py
```

**Funções exportáveis:**
```python
from examples.ai_documentation_consumer import (
    fetch_architecture_doc,
    fetch_generated_doc,
    analyze_api,
    save_to_file,
    export_metadata
)

# Usar individualmente
markdown = fetch_architecture_doc()
data = fetch_generated_doc()
save_to_file(markdown, 'my-docs.md')
```

---

## 🚀 Casos de Uso

### Caso 1: Fornecer Contexto para IA

```bash
# Salvar documentação para usar com Claude/GPT
curl http://localhost:3000/api/docs/architecture > api-context.md

# Usar no prompt
"Aqui está a documentação da API: [colar conteúdo de api-context.md]
Com base nisso, me ajude a criar um novo endpoint que..."
```

### Caso 2: Validação em CI/CD

```bash
#!/bin/bash
# .github/workflows/validate-docs.sh

echo "Validando documentação..."
npm run docs:check

if [ $? -ne 0 ]; then
  echo "❌ Documentação está desatualizada ou incompleta"
  exit 1
fi

echo "✅ Documentação validada"
```

### Caso 3: Geração de Relatórios

```javascript
// generate-report.js
const response = await fetch('http://localhost:3000/api/docs/generate')
const data = await response.json()

console.log(`
API Report
==========
Total Endpoints: ${data.endpoints.length}
Total Utilities: ${data.utilities.length}
Total Types: ${data.types.interfaces.length}
Generated: ${new Date(data.generatedAt).toLocaleString()}
`)
```

### Caso 4: Descoberta Automática de Endpoints

```python
# discover-endpoints.py
import requests

response = requests.get('http://localhost:3000/api/docs/generate')
data = response.json()

print("Available API Endpoints:")
for endpoint in data['endpoints']:
    print(f"  {endpoint['method']: <6} {endpoint['path']}")
    if endpoint.get('queryParams'):
        print(f"         Params: {', '.join(endpoint['queryParams'])}")
```

---

## 🧪 Testando os Exemplos

### Pré-requisitos

1. **Servidor rodando:**
   ```bash
   npm run dev
   ```

2. **Para JavaScript (Node.js):**
   - Node.js 18+ instalado
   - Dependências do projeto instaladas (`npm install`)

3. **Para Python:**
   ```bash
   pip install requests
   ```

### Executar Testes

**JavaScript:**
```bash
# Teste completo
node examples/ai-documentation-consumer.js

# Importar como módulo
node -e "import('./examples/ai-documentation-consumer.js').then(m => m.fetchArchitectureDoc())"
```

**Python:**
```bash
# Teste completo
python3 examples/ai-documentation-consumer.py

# Executar função específica
python3 -c "from examples.ai_documentation_consumer import fetch_architecture_doc; fetch_architecture_doc()"
```

---

## 📚 Documentação Adicional

- **[DOCUMENTATION_API.md](../DOCUMENTATION_API.md)** - Guia completo da Documentation API
- **[server/api/docs/README.md](../server/api/docs/README.md)** - Detalhes técnicos dos endpoints
- **[API_ARCHITECTURE.md](../API_ARCHITECTURE.md)** - Documentação da arquitetura da API

---

## 💡 Dicas

### Personalizar Exemplos

Ambos os exemplos são modulares e podem ser adaptados:

```javascript
// Customizar análise
async function myCustomAnalysis() {
  const data = await fetchGeneratedDoc()

  // Sua lógica customizada aqui
  const postEndpoints = data.endpoints.filter(e => e.method === 'POST')
  console.log(`POST endpoints: ${postEndpoints.length}`)
}
```

### Integrar com Ferramentas

```bash
# Slack notification
curl http://localhost:3000/api/docs/generate | \
  jq '.endpoints | length' | \
  xargs -I {} curl -X POST $SLACK_WEBHOOK \
    -d "{\"text\":\"API has {} endpoints\"}"

# Email report
curl http://localhost:3000/api/docs/architecture | \
  mail -s "API Documentation" developer@example.com
```

### Debugging

```javascript
// Adicionar logs detalhados
const DEBUG = process.env.DEBUG === 'true'

if (DEBUG) {
  console.log('Full response:', JSON.stringify(data, null, 2))
}
```

---

## ❓ Perguntas Frequentes

**Q: Os exemplos funcionam em produção?**
A: Sim, mas certifique-se de atualizar `API_BASE_URL` para o URL de produção.

**Q: Posso usar esses exemplos em meus próprios projetos?**
A: Sim, os exemplos são genéricos e podem ser adaptados para qualquer projeto com endpoints similares.

**Q: Como adicionar autenticação?**
A: Modifique as chamadas fetch/requests para incluir headers de autenticação:
```javascript
const response = await fetch(url, {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
```

**Q: Os exemplos funcionam offline?**
A: Não, eles requerem que o servidor esteja rodando e acessível.

---

## 🤝 Contribuindo

Quer adicionar mais exemplos? Considere:

- [ ] Exemplo em outras linguagens (Go, Rust, Java)
- [ ] Integração com ferramentas específicas (Postman, Insomnia)
- [ ] Scripts de automação (Ansible, Terraform)
- [ ] Plugins para IDEs (VSCode, IntelliJ)

---

**Pronto para começar?** Execute um dos exemplos e explore a Documentation API! 🚀
