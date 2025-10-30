#!/usr/bin/env node

/**
 * Example: AI Documentation Consumer
 *
 * This script demonstrates how AI agents or automated tools can consume
 * the documentation API to understand the application's architecture.
 *
 * Usage:
 *   # Make sure dev server is running
 *   npm run dev
 *
 *   # In another terminal
 *   node examples/ai-documentation-consumer.js
 */

const API_BASE_URL = 'http://localhost:3000'

/**
 * Fetches the complete API documentation in Markdown format
 */
async function fetchArchitectureDoc() {
  console.log('📚 Fetching API Architecture Documentation...\n')

  try {
    const response = await fetch(`${API_BASE_URL}/api/docs/architecture`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const markdown = await response.text()

    console.log('✅ Documentation fetched successfully!')
    console.log(`📄 Size: ${(markdown.length / 1024).toFixed(2)} KB`)
    console.log(`📝 Lines: ${markdown.split('\n').length}\n`)

    // Example: Extract specific sections
    const sections = extractSections(markdown)
    console.log('📋 Documentation Sections:')
    sections.forEach(section => console.log(`   - ${section}`))

    return markdown
  } catch (error) {
    console.error('❌ Error fetching documentation:', error.message)
    throw error
  }
}

/**
 * Fetches dynamically generated documentation metadata
 */
async function fetchGeneratedDoc() {
  console.log('\n🔧 Fetching Generated Documentation...\n')

  try {
    const response = await fetch(`${API_BASE_URL}/api/docs/generate`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    console.log('✅ Generated documentation fetched successfully!')
    console.log(`🕒 Generated at: ${new Date(data.generatedAt).toLocaleString()}`)
    console.log(`📡 Endpoints: ${data.endpoints.length}`)
    console.log(`🔧 Utilities: ${data.utilities.length}`)
    console.log(`📦 Type Interfaces: ${data.types.interfaces.length}\n`)

    // Display endpoints
    console.log('📡 Available Endpoints:')
    data.endpoints.forEach(endpoint => {
      console.log(`   ${endpoint.method} ${endpoint.path}`)
      if (endpoint.queryParams.length > 0) {
        console.log(`      Params: ${endpoint.queryParams.join(', ')}`)
      }
    })

    // Display utilities
    console.log('\n🔧 Server Utilities:')
    data.utilities.forEach(util => {
      console.log(`   ${util.file}`)
      console.log(`      Functions: ${util.functions.join(', ')}`)
    })

    // Display types
    console.log('\n📦 Type Interfaces:')
    data.types.interfaces.forEach(iface => {
      console.log(`   ${iface.name}`)
      console.log(`      Fields: ${iface.fields.length}`)
    })

    return data
  } catch (error) {
    console.error('❌ Error fetching generated documentation:', error.message)
    throw error
  }
}

/**
 * Example: AI-style analysis of the API
 */
async function analyzeAPI() {
  console.log('\n🤖 AI Analysis of API Architecture...\n')

  const data = await fetchGeneratedDoc()

  // Analyze endpoint patterns
  const methods = {}
  data.endpoints.forEach(endpoint => {
    methods[endpoint.method] = (methods[endpoint.method] || 0) + 1
  })

  console.log('📊 API Analysis:')
  console.log('\n   HTTP Methods:')
  Object.entries(methods).forEach(([method, count]) => {
    console.log(`      ${method}: ${count} endpoint(s)`)
  })

  // Identify key architectural components
  console.log('\n   Key Components:')
  const components = [
    { name: 'Data Fetching', file: 'googleSheets.ts' },
    { name: 'Person Identification', file: 'personIdentifier.ts' },
    { name: 'Installment Processing', file: 'installmentProcessor.ts' },
    { name: 'Filtering', file: 'transactionFilters.ts' }
  ]

  components.forEach(component => {
    const util = data.utilities.find(u => u.file === component.file)
    if (util) {
      console.log(`      ✓ ${component.name}: ${util.functions.length} function(s)`)
    } else {
      console.log(`      ✗ ${component.name}: Not found`)
    }
  })

  // Check Transaction type structure
  console.log('\n   Transaction Type:')
  const transactionType = data.types.interfaces.find(i => i.name === 'Transaction')
  if (transactionType) {
    console.log(`      Fields: ${transactionType.fields.length}`)
    transactionType.fields.slice(0, 5).forEach(field => {
      console.log(`         - ${field.trim()}`)
    })
    if (transactionType.fields.length > 5) {
      console.log(`         ... and ${transactionType.fields.length - 5} more`)
    }
  }
}

/**
 * Example: Search documentation for specific information
 */
async function searchDocumentation(query) {
  console.log(`\n🔍 Searching documentation for: "${query}"\n`)

  const markdown = await fetchArchitectureDoc()
  const lines = markdown.split('\n')

  const results = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10)

  if (results.length === 0) {
    console.log('   No results found.')
  } else {
    console.log(`   Found ${results.length} occurrences:\n`)
    results.forEach(({ line, index }) => {
      console.log(`   Line ${index + 1}: ${line.trim()}`)
    })
  }
}

/**
 * Example: Compare documented vs. actual endpoints
 */
async function verifyDocumentation() {
  console.log('\n✅ Verifying Documentation Accuracy...\n')

  const markdown = await fetchArchitectureDoc()
  const generated = await fetchGeneratedDoc()

  // Check if all generated endpoints are documented
  console.log('   Checking endpoint coverage:')

  let allDocumented = true
  generated.endpoints.forEach(endpoint => {
    const isDocumented = markdown.includes(`${endpoint.method} ${endpoint.path}`)
    const status = isDocumented ? '✓' : '✗'
    console.log(`      ${status} ${endpoint.method} ${endpoint.path}`)

    if (!isDocumented) {
      allDocumented = false
    }
  })

  if (allDocumented) {
    console.log('\n   ✅ All endpoints are documented!')
  } else {
    console.log('\n   ⚠️  Some endpoints are missing from documentation')
  }
}

/**
 * Helper: Extract section headers from markdown
 */
function extractSections(markdown) {
  const lines = markdown.split('\n')
  return lines
    .filter(line => line.startsWith('## '))
    .map(line => line.replace('## ', '').trim())
}

/**
 * Main execution
 */
async function main() {
  console.log('🤖 AI Documentation Consumer Example\n')
  console.log('This script demonstrates how to consume the documentation API\n')
  console.log('='=.repeat(70))

  try {
    // Example 1: Fetch and display architecture documentation
    await fetchArchitectureDoc()

    // Example 2: Fetch and analyze generated documentation
    await fetchGeneratedDoc()

    // Example 3: AI-style analysis
    await analyzeAPI()

    // Example 4: Search for specific information
    await searchDocumentation('query parameters')

    // Example 5: Verify documentation accuracy
    await verifyDocumentation()

    console.log('\n' + '='.repeat(70))
    console.log('✅ Documentation consumer example completed successfully!')
    console.log('\n💡 Use this pattern to integrate with AI agents, CI/CD, or other tools.')

  } catch (error) {
    console.error('\n❌ Example failed:', error.message)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

// Export for use as module
export {
  fetchArchitectureDoc,
  fetchGeneratedDoc,
  analyzeAPI,
  searchDocumentation,
  verifyDocumentation
}
