# Configuração do Cache no Google Drive

Este documento explica como configurar o sistema de cache do Google Drive para a aplicação de controle financeiro.

## Visão Geral

O sistema de cache agora suporta armazenamento tanto local (filesystem) quanto no Google Drive. O Google Drive é usado como armazenamento principal, com fallback automático para o filesystem local caso o Drive não esteja disponível.

### Arquivos Armazenados no Cache

O sistema armazena os seguintes arquivos no Google Drive:

1. **transactions.csv** - Cache de transações
2. **metadata.json** - Metadados do cache de transações (última atualização, expiração, etc.)
3. **budgets.csv** - Cache de orçamentos
4. **budgets-metadata.json** - Metadados do cache de orçamentos

## Configuração do Google Drive

### 1. Criar Pasta no Google Drive

1. Acesse o [Google Drive](https://drive.google.com)
2. Crie uma nova pasta com o nome desejado (ex: "financial-control-cache")
3. Abra a pasta criada
4. Copie o ID da pasta da URL do navegador:
   ```
   https://drive.google.com/drive/folders/[ID_DA_PASTA]
   ```
   O ID da pasta é a string após `/folders/`

### 2. Compartilhar a Pasta com a Service Account

1. Na pasta criada, clique em "Compartilhar" (ícone de pessoa com +)
2. Adicione o email da Service Account (encontrado na variável `NUXT_GOOGLE_CLIENT_EMAIL`)
   - Exemplo: `financial-control@seu-projeto.iam.gserviceaccount.com`
3. Defina as permissões como **Editor** (necessário para criar, atualizar e deletar arquivos)
4. Desmarque "Notificar pessoas" (opcional)
5. Clique em "Compartilhar"

### 3. Configurar a Variável de Ambiente

Adicione o ID da pasta no arquivo `.env`:

```bash
NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID=seu_id_da_pasta_aqui
```

## Como Funciona

### Hierarquia de Armazenamento

O sistema segue a seguinte ordem de prioridade:

**Leitura de Cache:**
1. ✅ Tenta ler do Google Drive
2. ⚠️ Se falhar, faz fallback para filesystem local
3. ❌ Se ambos falharem, retorna cache vazio

**Escrita de Cache:**
1. ✅ Salva no Google Drive (se configurado)
2. ✅ **Sempre** salva cópia local como backup
3. ⚠️ Se Google Drive falhar, mantém apenas cópia local

### Vantagens do Google Drive

- ✅ **Persistência:** Cache sobrevive a deployments e reinicializações
- ✅ **Compartilhamento:** Múltiplas instâncias podem compartilhar o mesmo cache
- ✅ **Backup:** Sistema local atua como fallback automático
- ✅ **Gerenciamento:** Fácil visualização e limpeza manual dos arquivos de cache

### Sistema de Fallback

O sistema foi projetado para continuar funcionando mesmo se o Google Drive estiver indisponível:

- Se `NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID` não estiver configurado, usa apenas cache local
- Se o Google Drive falhar (rede, permissões, etc.), usa cache local
- Logs informativos indicam qual sistema de armazenamento está sendo usado

## Logs do Sistema

O sistema emite logs claros para facilitar o debugging:

**Leitura de Cache:**
```
📥 Reading cache from Google Drive
📁 Reading cache from local filesystem
⚠️  Failed to read from Google Drive, falling back to local
```

**Escrita de Cache:**
```
📤 Cache saved to Google Drive
💾 Cache saved to local filesystem
⚠️  Failed to save to Google Drive, will save locally only
```

**Operações:**
```
✅ Created file 'transactions.csv' in Google Drive
✅ Updated file 'metadata.json' in Google Drive
✅ Deleted file 'budgets.csv' from Google Drive
🗑️  Local cache cleared
```

## Troubleshooting

### Cache não está sendo salvo no Google Drive

1. Verifique se `NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID` está configurado no `.env`
2. Confirme que a pasta existe no Google Drive
3. Verifique se a Service Account tem permissão de **Editor** na pasta
4. Verifique os logs do servidor para mensagens de erro específicas

### Permissão Negada (403)

- A Service Account não tem permissão na pasta
- Compartilhe a pasta com o email da Service Account como Editor

### Pasta não Encontrada (404)

- O ID da pasta está incorreto
- A pasta foi deletada
- Verifique o ID na URL da pasta no Google Drive

### Cache Local Sendo Usado ao Invés do Drive

- Normal se `NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID` não estiver configurado
- Verifique os logs para ver mensagens de fallback
- Se houver erros, o sistema faz fallback automaticamente

## Permissões Necessárias

A Service Account precisa dos seguintes escopos OAuth:

```javascript
'https://www.googleapis.com/auth/drive.file'
'https://www.googleapis.com/auth/drive.appdata'
```

Esses escopos já estão configurados no arquivo `server/utils/googleDrive.ts`.

## Operações de Manutenção

### Limpar Cache Manualmente

**Via API:**
```bash
# Limpar cache de transações
curl -X POST http://localhost:3000/api/cache/refresh

# Limpar cache de budgets
curl -X POST http://localhost:3000/api/budgets/cache/refresh
```

**Via Google Drive:**
1. Acesse a pasta de cache no Google Drive
2. Delete os arquivos `.csv` e `.json` desejados
3. O sistema irá recriá-los na próxima requisição

**Via Código:**
```typescript
// Em server/utils
import { clearCache } from './cacheManager'
import { clearBudgetCache } from './budgetCacheManager'

await clearCache() // Limpa cache de transações
await clearBudgetCache() // Limpa cache de budgets
```

### Verificar Status do Cache

```bash
# Status do cache de transações
curl http://localhost:3000/api/cache/status

# Status do cache de budgets
curl http://localhost:3000/api/budgets/cache/status
```

## Migração de Cache Existente

Se você já tem cache local e deseja migrar para o Google Drive:

1. Configure a variável `NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID`
2. Reinicie a aplicação
3. Na próxima escrita de cache, os arquivos serão automaticamente salvos no Google Drive
4. Os arquivos locais continuarão existindo como backup

Não é necessário mover os arquivos manualmente - o sistema criará novos arquivos no Drive automaticamente.

## Arquitetura Técnica

### Arquivos Modificados

- **server/utils/googleDrive.ts** - Novo arquivo com operações do Google Drive
- **server/utils/cacheManager.ts** - Modificado para usar Google Drive
- **server/utils/budgetCacheManager.ts** - Modificado para usar Google Drive
- **nuxt.config.ts** - Adicionada variável `googleDriveCacheFolderId`

### Funções Principais

**googleDrive.ts:**
- `uploadFileToDrive()` - Upload/atualização de arquivos
- `downloadFileFromDrive()` - Download de arquivos
- `fileExistsInDrive()` - Verificação de existência
- `deleteFileFromDrive()` - Deleção de arquivos
- `listCacheFiles()` - Listagem de arquivos na pasta

**cacheManager.ts / budgetCacheManager.ts:**
- `readCache()` - Lê do Drive com fallback local
- `writeCache()` - Salva no Drive + backup local
- `getCacheMetadata()` - Lê metadata do Drive com fallback
- `updateCacheMetadata()` - Salva metadata no Drive + backup
- `cacheExists()` - Verifica existência no Drive ou local
- `clearCache()` - Limpa cache do Drive e local

## Segurança

- Credenciais da Service Account nunca são expostas ao cliente
- Todas as operações do Drive acontecem server-side
- Sistema de fallback garante disponibilidade mesmo se Drive falhar
- Logs não expõem informações sensíveis

## Suporte

Para problemas relacionados ao cache do Google Drive:

1. Verifique os logs do servidor
2. Confirme as configurações de permissão no Drive
3. Teste o acesso manual aos arquivos no Drive
4. Verifique se a Service Account está ativa no Google Cloud Console
