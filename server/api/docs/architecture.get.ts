import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read markdown file at module initialization (happens once at build/startup)
// For Vercel: file needs to be in project root and included in deployment
let apiArchitecture: string

try {
  // Try reading from project root first (production/Vercel)
  const filePath = resolve(process.cwd(), 'API_ARCHITECTURE.md')
  apiArchitecture = readFileSync(filePath, 'utf-8')
} catch {
  // Fallback to server assets location (development)
  try {
    const filePath = resolve(process.cwd(), 'server/assets/docs/API_ARCHITECTURE.md')
    apiArchitecture = readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error('Failed to load API_ARCHITECTURE.md from any location', error)
    apiArchitecture = '# API Documentation Not Available\n\nThe API_ARCHITECTURE.md file could not be loaded.'
  }
}

/**
 * GET /api/docs/architecture
 *
 * Returns the API Architecture documentation in Markdown format.
 * This endpoint is designed to be consumed by AI agents and other automated tools.
 *
 * Response:
 * - Content-Type: text/markdown
 * - Body: Complete API_ARCHITECTURE.md content
 *
 * Example:
 * curl http://localhost:3000/api/docs/architecture
 *
 * Note: Content is loaded once at startup for optimal performance
 */
export default defineEventHandler((event) => {
  // Set the response content type to markdown
  event.node.res.setHeader('Content-Type', 'text/markdown; charset=utf-8')

  // Return the cached markdown content
  return apiArchitecture
})
