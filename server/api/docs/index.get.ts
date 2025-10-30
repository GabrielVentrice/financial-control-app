import type { TransactionQueryParams } from '~/types/transaction'

/**
 * GET /api/docs
 * 
 * Returns comprehensive API documentation in HTML format
 * 
 * @example
 * curl http://localhost:3000/api/docs
 */
export default defineEventHandler(async (event) => {
  const baseUrl = getRequestURL(event).origin
  
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Control App - API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
        }
        h3 {
            color: #7f8c8d;
        }
        .endpoint {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 12px;
            margin-right: 10px;
        }
        .get { background: #27ae60; color: white; }
        .post { background: #e74c3c; color: white; }
        .parameter {
            background: #f8f9fa;
            padding: 12px;
            margin: 8px 0;
            border-radius: 4px;
            border-left: 3px solid #95a5a6;
        }
        .param-name {
            font-weight: bold;
            color: #2c3e50;
        }
        .param-type {
            color: #8e44ad;
            font-family: monospace;
            font-size: 14px;
        }
        .example {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            margin: 10px 0;
            overflow-x: auto;
        }
        .status-code {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
            margin-right: 5px;
        }
        .status-200 { background: #27ae60; color: white; }
        .status-400 { background: #e67e22; color: white; }
        .status-500 { background: #e74c3c; color: white; }
        .note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .toc {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .toc ul {
            margin: 0;
            padding-left: 20px;
        }
        .toc a {
            color: #3498db;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Financial Control App - API Documentation</h1>
        
        <div class="toc">
            <h3>📋 Índice</h3>
            <ul>
                <li><a href="#overview">Visão Geral</a></li>
                <li><a href="#transactions">API de Transações</a></li>
                <li><a href="#parameters">Parâmetros Disponíveis</a></li>
                <li><a href="#examples">Exemplos de Uso</a></li>
                <li><a href="#responses">Respostas da API</a></li>
                <li><a href="#errors">Tratamento de Erros</a></li>
            </ul>
        </div>

        <section id="overview">
            <h2>🎯 Visão Geral</h2>
            <p>Esta API fornece acesso aos dados financeiros armazenados no Google Sheets, com capacidades avançadas de filtragem e processamento.</p>
            
            <div class="note">
                <strong>📌 Pipeline de Processamento:</strong><br>
                1. Busca dados do Google Sheets<br>
                2. Identifica pessoa automaticamente (Juliana/Gabriel)<br>
                3. Processa parcelas (expandindo ao longo dos meses)<br>
                4. Aplica filtros baseados nos parâmetros da query
            </div>
        </section>

        <section id="transactions">
            <h2>💳 API de Transações</h2>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <strong>/api/transactions</strong>
                <p>Busca transações financeiras do Google Sheets com capacidades avançadas de filtragem.</p>
            </div>
        </section>

        <section id="parameters">
            <h2>⚙️ Parâmetros Disponíveis</h2>
            
            <div class="parameter">
                <div class="param-name">person</div>
                <div class="param-type">string | opcional</div>
                <p><strong>Valores:</strong> "Juliana", "Gabriel", "Ambos"</p>
                <p>Filtra transações por pessoa. "Ambos" retorna transações de ambas as pessoas.</p>
            </div>

            <div class="parameter">
                <div class="param-name">startDate</div>
                <div class="param-type">string | opcional</div>
                <p><strong>Formato:</strong> YYYY-MM-DD (ex: 2025-01-01)</p>
                <p>Data inicial para filtrar transações.</p>
            </div>

            <div class="parameter">
                <div class="param-name">endDate</div>
                <div class="param-type">string | opcional</div>
                <p><strong>Formato:</strong> YYYY-MM-DD (ex: 2025-01-31)</p>
                <p>Data final para filtrar transações.</p>
            </div>

            <div class="parameter">
                <div class="param-name">searchTerm</div>
                <div class="param-type">string | opcional</div>
                <p>Termo de busca para filtrar descrições de transações (não case-sensitive).</p>
                <p><strong>Exemplo:</strong> "Netflix", "Supermercado", "Combustível"</p>
            </div>

            <div class="parameter">
                <div class="param-name">origin</div>
                <div class="param-type">string | opcional</div>
                <p>Filtra por conta/cartão de origem.</p>
                <p><strong>Exemplo:</strong> "Bank Account Gabriel", "Credit Card Juliana"</p>
            </div>

            <div class="parameter">
                <div class="param-name">destination</div>
                <div class="param-type">string | opcional</div>
                <p>Filtra por categoria de destino.</p>
                <p><strong>Exemplo:</strong> "Groceries", "Entertainment", "Transport"</p>
            </div>

            <div class="parameter">
                <div class="param-name">processInstallments</div>
                <div class="param-type">boolean | opcional | padrão: true</div>
                <p>Define se deve processar e expandir parcelas ao longo dos meses.</p>
                <p><strong>Valores:</strong> true, false, "true", "false"</p>
            </div>
        </section>

        <section id="examples">
            <h2>💡 Exemplos de Uso</h2>

            <h3>Buscar todas as transações</h3>
            <div class="example">GET ${baseUrl}/api/transactions</div>

            <h3>Transações do Gabriel em Janeiro de 2025</h3>
            <div class="example">GET ${baseUrl}/api/transactions?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31</div>

            <h3>Buscar transações do Netflix</h3>
            <div class="example">GET ${baseUrl}/api/transactions?searchTerm=Netflix</div>

            <h3>Transações de supermercado de ambos</h3>
            <div class="example">GET ${baseUrl}/api/transactions?person=Ambos&searchTerm=supermercado</div>

            <h3>Filtrar por categoria de destino</h3>
            <div class="example">GET ${baseUrl}/api/transactions?destination=Groceries</div>

            <h3>Desabilitar processamento de parcelas</h3>
            <div class="example">GET ${baseUrl}/api/transactions?processInstallments=false</div>

            <h3>Exemplo com múltiplos filtros</h3>
            <div class="example">GET ${baseUrl}/api/transactions?person=Juliana&startDate=2025-01-01&endDate=2025-03-31&searchTerm=restaurante&processInstallments=true</div>
        </section>

        <section id="responses">
            <h2>📤 Respostas da API</h2>

            <h3>Sucesso</h3>
            <div class="endpoint">
                <span class="status-code status-200">200</span>
                <strong>OK</strong>
                <p>Retorna um array de objetos Transaction.</p>
            </div>

            <div class="example">[
  {
    "transactionId": "TXN_001",
    "date": "2025-01-15",
    "origin": "Bank Account Gabriel",
    "destination": "Groceries",
    "description": "Supermercado ABC",
    "amount": -150.50,
    "recordedAt": "2025-01-15T10:30:00Z",
    "remoteId": "SHEET_ROW_123",
    "person": "Gabriel"
  }
]</div>

            <h3>Estrutura do Objeto Transaction</h3>
            <div class="parameter">
                <div class="param-name">transactionId</div>
                <div class="param-type">string</div>
                <p>Identificador único da transação.</p>
            </div>

            <div class="parameter">
                <div class="param-name">date</div>
                <div class="param-type">string</div>
                <p>Data da transação no formato YYYY-MM-DD.</p>
            </div>

            <div class="parameter">
                <div class="param-name">origin</div>
                <div class="param-type">string</div>
                <p>Conta ou cartão de origem da transação.</p>
            </div>

            <div class="parameter">
                <div class="param-name">destination</div>
                <div class="param-type">string</div>
                <p>Categoria ou destino da transação.</p>
            </div>

            <div class="parameter">
                <div class="param-name">description</div>
                <div class="param-type">string</div>
                <p>Descrição detalhada da transação.</p>
            </div>

            <div class="parameter">
                <div class="param-name">amount</div>
                <div class="param-type">number</div>
                <p>Valor da transação (negativo para gastos, positivo para receitas).</p>
            </div>

            <div class="parameter">
                <div class="param-name">recordedAt</div>
                <div class="param-type">string</div>
                <p>Timestamp de quando a transação foi registrada.</p>
            </div>

            <div class="parameter">
                <div class="param-name">remoteId</div>
                <div class="param-type">string</div>
                <p>Identificador da linha na planilha do Google Sheets.</p>
            </div>

            <div class="parameter">
                <div class="param-name">person</div>
                <div class="param-type">"Juliana" | "Gabriel" | null</div>
                <p>Pessoa identificada automaticamente baseada no campo Origin.</p>
            </div>
        </section>

        <section id="errors">
            <h2>❌ Tratamento de Erros</h2>

            <div class="endpoint">
                <span class="status-code status-400">400</span>
                <strong>Bad Request</strong>
                <p>Parâmetros de query inválidos.</p>
            </div>

            <div class="example">{
  "statusCode": 400,
  "statusMessage": "Invalid query parameters",
  "data": ["startDate must be in YYYY-MM-DD format"]
}</div>

            <div class="endpoint">
                <span class="status-code status-500">500</span>
                <strong>Internal Server Error</strong>
                <p>Erro interno do servidor (problemas com Google Sheets, etc.).</p>
            </div>

            <div class="example">{
  "statusCode": 500,
  "statusMessage": "Failed to process transactions",
  "data": "Unable to connect to Google Sheets"
}</div>

            <h3>🔍 Validações de Parâmetros</h3>
            <ul>
                <li><strong>person:</strong> Deve ser "Juliana", "Gabriel" ou "Ambos"</li>
                <li><strong>startDate/endDate:</strong> Devem estar no formato YYYY-MM-DD</li>
                <li><strong>processInstallments:</strong> Deve ser um valor boolean ou string "true"/"false"</li>
                <li><strong>Data Range:</strong> startDate deve ser anterior ou igual a endDate</li>
            </ul>
        </section>

        <div class="note">
            <strong>🔗 Endpoints Relacionados:</strong><br>
            • <a href="/api/health">/api/health</a> - Status da API<br>
            • <a href="/api/docs">/api/docs</a> - Esta documentação
        </div>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="text-align: center; color: #7f8c8d; font-size: 14px;">
            📊 Financial Control App API Documentation<br>
            Gerado automaticamente • Atualizado em ${new Date().toLocaleString('pt-BR')}
        </p>
    </div>
</body>
</html>
  `
  
  // Set content type to HTML
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  
  return html
})