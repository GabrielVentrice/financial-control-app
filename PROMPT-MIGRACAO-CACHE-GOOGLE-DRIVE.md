# Tarefa: Migrar Sistema de Cache de Arquivos Locais para Google Drive

## Contexto
Esta é uma aplicação Nuxt 3 de controle financeiro que atualmente armazena cache de dados em arquivos CSV locais na pasta `server/cache/`. O sistema busca dados do Google Sheets e os armazena em cache localmente para melhorar performance.

**Arquivos de cache atuais:**
- `server/cache/transactions.csv` - Cache de transações
- `server/cache/budgets.csv` - Cache de orçamentos
- `server/cache/metadata.json` - Metadados de transações
- `server/cache/budgets-metadata.json` - Metadados de orçamentos

**Sistema atual:**
- Cache é salvo localmente usando Node.js `fs.promises` (writeFile/readFile)
- Gerenciamento em `server/utils/cacheManager.ts` e `server/utils/budgetCacheManager.ts`
- TTL de 60 minutos configurável
- Integração existente com Google Sheets API (leitura/escrita)
- Autenticação via Service Account (NUXT_GOOGLE_CLIENT_EMAIL e NUXT_GOOGLE_PRIVATE_KEY)

## Objetivo
Modificar o sistema para que os arquivos de cache sejam salvos e lidos de uma pasta específica no Google Drive ao invés do filesystem local.

## Requisitos

### 1. Configuração do Google Drive API
- Adicionar Google Drive API ao projeto (já tem `googleapis` v144.0.0 instalado)
- Usar a mesma Service Account que já autentica com Google Sheets
- Adicionar escopo `https://www.googleapis.com/auth/drive.file` nas autenticações
- Criar variável de ambiente `NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID` para armazenar o ID da pasta do Drive

### 2. Modificar `server/utils/cacheManager.ts`
**Funções a modificar:**
- `writeCache(data)` - Salvar CSV no Google Drive ao invés de `fs.writeFile`
- `readCache()` - Ler CSV do Google Drive ao invés de `fs.readFile`
- `updateMetadata(metadata)` - Salvar JSON de metadata no Drive
- `readMetadata()` - Ler JSON de metadata do Drive
- `cacheExists()` - Verificar se arquivo existe no Drive (listar arquivos na pasta)
- `deleteCache()` - Deletar arquivos do Drive

### 3. Modificar `server/utils/budgetCacheManager.ts`
Aplicar as mesmas modificações para o cache de budgets:
- `writeBudgetsCache(data)`
- `readBudgetsCache()`
- `updateBudgetMetadata(metadata)`
- `readBudgetMetadata()`
- `budgetCacheExists()`
- `deleteBudgetCache()`

### 4. Implementação do Google Drive
**Operações necessárias:**

a) **Upload de arquivo (criar ou atualizar):**
   - Primeiro verificar se arquivo já existe na pasta (buscar por nome)
   - Se existe: atualizar conteúdo usando `drive.files.update`
   - Se não existe: criar novo usando `drive.files.create`
   - Usar `mimeType: 'text/csv'` para CSVs e `'application/json'` para JSONs

b) **Download de arquivo:**
   - Buscar arquivo por nome na pasta do Drive
   - Usar `drive.files.get` com `alt: 'media'` para baixar conteúdo
   - Converter stream/buffer para string

c) **Listar arquivos:**
   - Usar `drive.files.list` com query `'${FOLDER_ID}' in parents and name = '${fileName}'`
   - Para verificar existência de arquivos

d) **Deletar arquivo:**
   - Usar `drive.files.delete` com o fileId

### 5. Tratamento de Erros
- Se Google Drive não estiver acessível, fazer fallback para sistema local atual
- Logar erros de Drive separadamente
- Manter compatibilidade com sistema local como backup

### 6. Nomes dos arquivos no Drive
Manter os mesmos nomes:
- `transactions.csv`
- `budgets.csv`
- `metadata.json`
- `budgets-metadata.json`

### 7. Variáveis de Ambiente
Adicionar ao `.env`:
```
NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID=<id-da-pasta-do-drive>
```

E ao `nuxt.config.ts` na seção `runtimeConfig`:
```typescript
googleDriveCacheFolderId: process.env.NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID || ''
```

## Arquivos que precisam ser modificados
1. `server/utils/cacheManager.ts` - Todas as funções de I/O
2. `server/utils/budgetCacheManager.ts` - Todas as funções de I/O
3. `nuxt.config.ts` - Adicionar nova variável de ambiente
4. Criar novo arquivo `server/utils/googleDrive.ts` (opcional) - Helpers para operações do Drive

## Funcionalidades que NÃO devem ser alteradas
- Lógica de validação de cache (TTL, expiração)
- Formato dos dados (CSV e JSON)
- APIs endpoints (`/api/transactions.get`, `/api/budgets.get`, etc.)
- Sistema de refresh manual de cache
- Processamento de dados após leitura do cache

## Considerações Técnicas
- Google Drive API retorna streams - converter para string adequadamente
- Buscar arquivo por nome pode retornar múltiplos resultados - pegar o primeiro ou mais recente
- Cache no Drive precisa ter permissões corretas na Service Account
- Considerar latência maior do Drive vs filesystem local

## Resultado Esperado
Após as modificações:
1. Cache deixa de ser salvo em `server/cache/` localmente
2. Cache é salvo em uma pasta específica do Google Drive
3. Leitura de cache busca do Google Drive
4. Sistema continua funcionando exatamente igual do ponto de vista do usuário
5. APIs continuam retornando os mesmos dados, mesma estrutura
6. TTL e refresh de cache continuam funcionando normalmente

## Instruções de Implementação
- Analise completamente os arquivos mencionados antes de modificar
- Implemente todas as funções de Google Drive primeiro
- Teste cada função isoladamente
- Mantenha código limpo e bem comentado
- Use TypeScript com tipos adequados
- Adicione error handling robusto

Por favor, implemente esta migração completamente, modificando todos os arquivos necessários.
