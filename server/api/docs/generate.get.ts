import { readdir, readFile } from 'fs/promises'
import { resolve, join } from 'path'

/**
 * GET /api/docs/generate
 *
 * Generates API documentation dynamically based on current code structure.
 * This endpoint can be used to verify if API_ARCHITECTURE.md is up to date.
 *
 * Response:
 * - Content-Type: application/json
 * - Body: Documentation metadata and structure
 *
 * Example:
 * curl http://localhost:3000/api/docs/generate
 */
export default defineEventHandler(async () => {
  try {
    // Scan server/api directory for endpoints
    const apiPath = resolve(process.cwd(), 'server/api')
    const endpoints = await scanApiEndpoints(apiPath)

    // Scan server/utils for utilities
    const utilsPath = resolve(process.cwd(), 'server/utils')
    const utilities = await scanUtilities(utilsPath)

    // Read types from transaction.ts
    const typesPath = resolve(process.cwd(), 'types/transaction.ts')
    const types = await extractTypeDefinitions(typesPath)

    // Generate documentation structure
    const documentation = {
      generatedAt: new Date().toISOString(),
      endpoints,
      utilities,
      types,
      architecture: {
        layers: [
          {
            name: 'Data Fetching Layer',
            location: 'server/utils/googleSheets.ts',
            description: 'Handles connection to Google Sheets API and fetches raw transaction data'
          },
          {
            name: 'Transformation Layer',
            location: 'server/utils/personIdentifier.ts',
            description: 'Enriches transactions with person identification (Juliana/Gabriel)'
          },
          {
            name: 'Processing Layer',
            location: 'server/utils/installmentProcessor.ts',
            description: 'Parses and expands installments across months'
          },
          {
            name: 'Filtering Layer',
            location: 'server/utils/transactionFilters.ts',
            description: 'Applies filters based on query parameters'
          },
          {
            name: 'API Endpoint',
            location: 'server/api/transactions.get.ts',
            description: 'Orchestrates all layers and handles HTTP requests'
          }
        ]
      },
      markdown: generateMarkdown(endpoints, utilities, types)
    }

    return documentation
  } catch (error) {
    console.error('Error generating documentation:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate documentation',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

/**
 * Scans API directory for endpoint files
 */
async function scanApiEndpoints(apiPath: string, basePath = ''): Promise<any[]> {
  const endpoints: any[] = []

  try {
    const entries = await readdir(apiPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(apiPath, entry.name)

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subEndpoints = await scanApiEndpoints(fullPath, join(basePath, entry.name))
        endpoints.push(...subEndpoints)
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        // Parse endpoint file
        const content = await readFile(fullPath, 'utf-8')
        const method = entry.name.replace('.ts', '').split('.').pop()?.toUpperCase() || 'GET'
        const path = '/' + join(basePath, entry.name.replace(/\.(get|post|put|delete|patch)\.ts$/, '')).replace(/\\/g, '/')

        // Extract JSDoc comments and parameters
        const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//)
        const description = jsdocMatch ? jsdocMatch[1].trim() : ''

        // Extract query params from code (basic parsing)
        const queryParams = extractQueryParams(content)

        endpoints.push({
          method,
          path,
          file: join(basePath, entry.name).replace(/\\/g, '/'),
          description: cleanJSDoc(description),
          queryParams
        })
      }
    }
  } catch (error) {
    console.error(`Error scanning ${apiPath}:`, error)
  }

  return endpoints
}

/**
 * Scans utils directory for utility files
 */
async function scanUtilities(utilsPath: string): Promise<any[]> {
  const utilities: any[] = []

  try {
    const entries = await readdir(utilsPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        const fullPath = join(utilsPath, entry.name)
        const content = await readFile(fullPath, 'utf-8')

        // Extract exported functions
        const functions = extractExportedFunctions(content)

        utilities.push({
          file: entry.name,
          path: `server/utils/${entry.name}`,
          functions
        })
      }
    }
  } catch (error) {
    console.error(`Error scanning ${utilsPath}:`, error)
  }

  return utilities
}

/**
 * Extracts type definitions from transaction.ts
 */
async function extractTypeDefinitions(typesPath: string): Promise<any> {
  try {
    const content = await readFile(typesPath, 'utf-8')

    // Extract interfaces
    const interfaces: any[] = []
    const interfaceRegex = /export interface (\w+) \{([\s\S]*?)\}/g
    let match

    while ((match = interfaceRegex.exec(content)) !== null) {
      const [, name, body] = match
      const fields = body
        .split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('//'))
        .map(line => line.trim())

      interfaces.push({ name, fields })
    }

    return { interfaces }
  } catch (error) {
    console.error(`Error reading ${typesPath}:`, error)
    return { interfaces: [] }
  }
}

/**
 * Extracts query parameters from endpoint code
 */
function extractQueryParams(content: string): string[] {
  const params: string[] = []

  // Look for getQuery(event) usage
  const queryMatch = content.match(/const\s+\{([^}]+)\}\s*=\s*getQuery\(event\)/m)
  if (queryMatch) {
    const paramList = queryMatch[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    params.push(...paramList)
  }

  return params
}

/**
 * Extracts exported function names
 */
function extractExportedFunctions(content: string): string[] {
  const functions: string[] = []

  // Match: export function functionName
  const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g
  let match

  while ((match = funcRegex.exec(content)) !== null) {
    functions.push(match[1])
  }

  // Match: export const functionName =
  const constRegex = /export\s+const\s+(\w+)\s*=/g
  while ((match = constRegex.exec(content)) !== null) {
    functions.push(match[1])
  }

  return functions
}

/**
 * Cleans JSDoc comments
 */
function cleanJSDoc(jsdoc: string): string {
  return jsdoc
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trim())
    .filter(line => line.length > 0)
    .join('\n')
}

/**
 * Generates markdown documentation
 */
function generateMarkdown(endpoints: any[], utilities: any[], types: any): string {
  let markdown = '# API Architecture Documentation (Auto-Generated)\n\n'
  markdown += `*Generated at: ${new Date().toISOString()}*\n\n`

  // Endpoints section
  markdown += '## API Endpoints\n\n'
  for (const endpoint of endpoints) {
    markdown += `### ${endpoint.method} ${endpoint.path}\n\n`
    markdown += `**File**: \`${endpoint.file}\`\n\n`

    if (endpoint.description) {
      markdown += `${endpoint.description}\n\n`
    }

    if (endpoint.queryParams.length > 0) {
      markdown += '**Query Parameters**:\n'
      for (const param of endpoint.queryParams) {
        markdown += `- \`${param}\`\n`
      }
      markdown += '\n'
    }
  }

  // Utilities section
  markdown += '## Server Utilities\n\n'
  for (const util of utilities) {
    markdown += `### ${util.file}\n\n`
    markdown += `**Location**: \`${util.path}\`\n\n`

    if (util.functions.length > 0) {
      markdown += '**Exported Functions**:\n'
      for (const func of util.functions) {
        markdown += `- \`${func}()\`\n`
      }
      markdown += '\n'
    }
  }

  // Types section
  markdown += '## Type Definitions\n\n'
  for (const iface of types.interfaces) {
    markdown += `### ${iface.name}\n\n`
    markdown += '```typescript\n'
    markdown += `interface ${iface.name} {\n`
    for (const field of iface.fields) {
      markdown += `  ${field}\n`
    }
    markdown += '}\n```\n\n'
  }

  return markdown
}
