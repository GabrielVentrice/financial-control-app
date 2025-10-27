# Controle Financeiro

Sistema de controle financeiro integrado com Google Sheets, desenvolvido com Nuxt 3.

## Características

- Leitura de transações financeiras do Google Sheets
- Interface web responsiva para visualização de transações
- Busca e filtros de transações
- Cálculo automático de totais
- Integração segura com Google Drive/Sheets API

## Estrutura da Planilha

A planilha do Google Sheets deve seguir o seguinte formato (começando em A1):

| Transaction Id | Date | Origin | Destination | Description | Amount | Recorded at | Remote Id |
|----------------|------|--------|-------------|-------------|---------|-------------|-----------|
| 65723800-c055-4304-897d-958af23a5d35 | 10/26/2025 | Bank Account Gabriel | | PIX QRS MARA SANTOS26/10 | 18 | 10/27/2025 | pluggy_9aec9035-98db-4736-aa29-cd25cfe311d8 |

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Google Cloud com API do Google Sheets habilitada
- Service Account configurada no Google Cloud

## Configuração do Google Cloud

### 1. Criar Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o ID do projeto

### 2. Habilitar Google Sheets API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Busque por "Google Sheets API"
3. Clique em **Enable**

### 3. Criar Service Account

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **Service Account**
3. Preencha os detalhes da service account
4. Clique em **Create and Continue**
5. Adicione o papel de **Editor** (opcional, mas recomendado)
6. Clique em **Done**

### 4. Gerar Chave da Service Account

1. Na lista de Service Accounts, clique na que você criou
2. Vá na aba **Keys**
3. Clique em **Add Key** > **Create new key**
4. Escolha o formato **JSON**
5. Clique em **Create** - o arquivo JSON será baixado

### 5. Compartilhar Planilha com Service Account

1. Abra a planilha do Google Sheets que deseja usar
2. Clique em **Compartilhar**
3. Adicione o email da service account (encontrado no JSON baixado ou no console)
4. Dê permissão de **Visualizador** ou **Editor**
5. Copie o ID da planilha da URL (a parte entre `/d/` e `/edit`)

## Instalação

1. Clone o repositório ou extraia os arquivos

2. Instale as dependências:
```bash
npm install
```

3. Adicione o googleapis ao projeto:
```bash
npm install googleapis
```

4. Configure as variáveis de ambiente:

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais:

```env
# ID da sua planilha (da URL)
NUXT_PUBLIC_GOOGLE_SPREADSHEET_ID=1abc123def456...

# Email da service account (do arquivo JSON)
NUXT_GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Chave privada da service account (do arquivo JSON, mantenha as quebras de linha)
NUXT_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
```

**Importante:** A chave privada deve incluir `\n` para quebras de linha e estar entre aspas.

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## Build para Produção

```bash
npm run build
```

Para visualizar a build de produção localmente:

```bash
npm run preview
```

## Estrutura do Projeto

```
financial-control-app/
├── .env.example              # Exemplo de variáveis de ambiente
├── app.vue                   # Componente raiz
├── nuxt.config.ts            # Configuração do Nuxt
├── package.json              # Dependências do projeto
├── tsconfig.json             # Configuração TypeScript
├── composables/              # Composables Vue
│   └── useTransactions.ts    # Lógica de transações
├── pages/                    # Páginas da aplicação
│   └── index.vue             # Página principal
├── server/                   # API do servidor
│   └── api/
│       └── transactions.get.ts  # Endpoint para buscar transações
└── types/                    # Definições TypeScript
    └── transaction.ts        # Tipos de transações
```

## Funcionalidades

### Página Principal
- Visualização de todas as transações
- Busca por descrição
- Cálculo automático do total
- Contador de transações
- Botão para atualizar dados

### API
- `GET /api/transactions` - Busca todas as transações da planilha

### Composable useTransactions
Funções disponíveis:
- `fetchTransactions()` - Busca transações da API
- `getTransactionsByDateRange(start, end)` - Filtra por período
- `getTotalAmount(transactions?)` - Calcula total
- `getTransactionsByOrigin(origin)` - Filtra por origem
- `getTransactionsByDescription(term)` - Busca na descrição

## Próximos Passos

Possíveis melhorias para o projeto:

1. **Adicionar novas funcionalidades:**
   - Filtros por data
   - Filtros por origem/destino
   - Gráficos e estatísticas
   - Export de dados (CSV, PDF)
   - Dashboard com métricas

2. **Melhorar a interface:**
   - Adicionar framework CSS (Tailwind, Vuetify, etc.)
   - Paginação da tabela
   - Ordenação de colunas
   - Modo escuro

3. **Funcionalidades avançadas:**
   - Edição de transações (escrita no Sheets)
   - Múltiplas planilhas/contas
   - Categorização automática
   - Alertas e notificações
   - Autenticação de usuários

4. **Performance:**
   - Cache de dados
   - Lazy loading
   - Server-side rendering

## Segurança

- As credenciais do Google são armazenadas apenas no servidor (nunca expostas ao cliente)
- Use variáveis de ambiente para configurações sensíveis
- Nunca commite o arquivo `.env` no Git
- Em produção, use secrets management adequado

## Suporte

Para problemas ou dúvidas:
1. Verifique se as credenciais estão corretas
2. Confirme que a planilha está compartilhada com a service account
3. Verifique se a Google Sheets API está habilitada
4. Revise os logs do servidor para erros detalhados

## Licença

Este projeto é fornecido como está, para fins educacionais e de desenvolvimento.
