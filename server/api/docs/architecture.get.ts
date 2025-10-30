import { readFile } from 'fs/promises'
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
 */
export default defineEventHandler(async (event) => {
  try {
    // Get the absolute path to API_ARCHITECTURE.md from project root
    const filePath = resolve(process.cwd(), 'API_ARCHITECTURE.md')

    // Read the markdown file
    const content = await readFile(filePath, 'utf-8')

    // Set the response content type to markdown
    event.node.res.setHeader('Content-Type', 'text/markdown; charset=utf-8')

    // Return the raw markdown content
    return content
  } catch (error) {
    console.error('Error reading API_ARCHITECTURE.md:', error)

    // Return error with appropriate status code
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read API documentation',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})
