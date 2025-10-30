import { readFileSync } from 'fs'
import { resolve } from 'path'

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
 * Note: Content is read on each request for simplicity and to ensure compatibility
 */
export default defineEventHandler((event) => {
  // Set the response content type to markdown
  event.node.res.setHeader('Content-Type', 'text/markdown; charset=utf-8')

  try {
    // Read markdown file from the same directory as this API endpoint
    const filePath = resolve(process.cwd(), 'server/api/docs/API_ARCHITECTURE.md')
    const apiArchitecture = readFileSync(filePath, 'utf-8')
    return apiArchitecture
  } catch (error) {
    console.error('Failed to load API_ARCHITECTURE.md from docs directory', error)
    
    // Return error information
    event.node.res.statusCode = 500
    return '# API Documentation Not Available\n\nThe API_ARCHITECTURE.md file could not be loaded.\n\nError: ' + (error as Error).message
  }
})
