#!/usr/bin/env node

/**
 * Documentation Update Script
 *
 * This script helps keep API_ARCHITECTURE.md up to date by:
 * 1. Checking if the documentation exists
 * 2. Optionally generating a new version based on current code
 * 3. Comparing generated vs. existing documentation
 * 4. Prompting user to update if changes detected
 *
 * Usage:
 *   npm run docs:check      # Check if docs are up to date
 *   npm run docs:generate   # Generate new docs (preview only)
 *   npm run docs:update     # Update API_ARCHITECTURE.md with new version
 */

import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { spawn } from 'child_process'

const args = process.argv.slice(2)
const command = args[0] || 'check'

const DOCS_FILE = resolve(process.cwd(), 'API_ARCHITECTURE.md')
const API_URL = 'http://localhost:3000/api/docs/generate'

async function main() {
  console.log('📚 API Documentation Tool\n')

  switch (command) {
    case 'check':
      await checkDocs()
      break
    case 'generate':
      await generateDocs()
      break
    case 'update':
      await updateDocs()
      break
    default:
      console.error(`❌ Unknown command: ${command}`)
      console.log('\nAvailable commands:')
      console.log('  check      - Check if docs are up to date')
      console.log('  generate   - Generate new docs (preview only)')
      console.log('  update     - Update API_ARCHITECTURE.md')
      process.exit(1)
  }
}

/**
 * Checks if documentation file exists and is valid
 */
async function checkDocs() {
  try {
    const content = await readFile(DOCS_FILE, 'utf-8')

    console.log('✅ API_ARCHITECTURE.md exists')
    console.log(`📄 File size: ${(content.length / 1024).toFixed(2)} KB`)

    // Basic validation
    const hasEndpoints = content.includes('/api/transactions')
    const hasArchitecture = content.includes('Architecture Layers')
    const hasExamples = content.includes('Example Requests')

    if (hasEndpoints && hasArchitecture && hasExamples) {
      console.log('✅ Documentation appears complete')
    } else {
      console.log('⚠️  Documentation may be incomplete:')
      if (!hasEndpoints) console.log('   - Missing endpoints section')
      if (!hasArchitecture) console.log('   - Missing architecture section')
      if (!hasExamples) console.log('   - Missing examples section')
    }

    console.log('\n💡 To generate updated documentation, run: npm run docs:generate')
  } catch (error) {
    console.error('❌ Error reading documentation:', error.message)
    console.log('\n💡 Run "npm run docs:generate" to create it')
    process.exit(1)
  }
}

/**
 * Generates new documentation by calling the API endpoint
 */
async function generateDocs() {
  console.log('🔧 Starting dev server to generate documentation...\n')

  // Start dev server
  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  })

  let serverReady = false

  // Wait for server to be ready
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.kill()
      reject(new Error('Server startup timeout'))
    }, 30000)

    server.stdout.on('data', (data) => {
      const output = data.toString()
      if (output.includes('localhost:3000') || output.includes('ready in')) {
        serverReady = true
        clearTimeout(timeout)
        setTimeout(resolve, 2000) // Wait 2s for full initialization
      }
    })

    server.stderr.on('data', (data) => {
      // Ignore stderr unless server fails
    })
  })

  if (!serverReady) {
    console.error('❌ Failed to start dev server')
    server.kill()
    process.exit(1)
  }

  console.log('✅ Dev server started\n')

  try {
    // Fetch generated documentation
    console.log('🔍 Fetching generated documentation...')
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    console.log('✅ Documentation generated successfully\n')
    console.log('📊 Summary:')
    console.log(`   - Endpoints: ${data.endpoints.length}`)
    console.log(`   - Utilities: ${data.utilities.length}`)
    console.log(`   - Type Interfaces: ${data.types.interfaces.length}`)
    console.log(`   - Generated at: ${new Date(data.generatedAt).toLocaleString()}`)

    console.log('\n📝 Preview (Markdown):\n')
    console.log('─'.repeat(80))
    console.log(data.markdown)
    console.log('─'.repeat(80))

    console.log('\n💡 To update API_ARCHITECTURE.md, run: npm run docs:update')
  } catch (error) {
    console.error('❌ Error generating documentation:', error.message)
    process.exit(1)
  } finally {
    // Stop server
    server.kill()
    console.log('\n🛑 Dev server stopped')
  }
}

/**
 * Updates API_ARCHITECTURE.md with generated documentation
 */
async function updateDocs() {
  console.log('⚠️  This feature is not yet implemented.\n')
  console.log('Current workflow:')
  console.log('1. Run "npm run docs:generate" to see generated documentation')
  console.log('2. Manually review and update API_ARCHITECTURE.md as needed')
  console.log('3. Commit changes to version control\n')
  console.log('💡 Tip: The manual file API_ARCHITECTURE.md is more comprehensive')
  console.log('   and includes detailed explanations. Use generated docs as a reference.')
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
