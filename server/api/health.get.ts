/**
 * Health Check Endpoint
 *
 * Returns basic health status and environment information.
 * Useful for monitoring and verifying deployment status.
 *
 * @returns Health check response with timestamp and status
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const baseUrl = getRequestURL(event).origin

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',

    // Check if critical env vars are configured (without exposing values)
    config: {
      hasGoogleSpreadsheetId: !!config.public.googleSpreadsheetId,
      hasGoogleClientEmail: !!config.googleClientEmail,
      hasGooglePrivateKey: !!config.googlePrivateKey,
    },

    // API Documentation links
    documentation: {
      html: `${baseUrl}/api/docs`,
      json: `${baseUrl}/api/docs/json`,
      description: "Comprehensive API documentation with examples and parameter details"
    },

    // Available endpoints
    endpoints: [
      {
        path: '/api/transactions',
        method: 'GET',
        description: 'Fetch financial transactions with advanced filtering'
      },
      {
        path: '/api/health',
        method: 'GET', 
        description: 'Health check and system status'
      },
      {
        path: '/api/docs',
        method: 'GET',
        description: 'HTML API documentation'
      },
      {
        path: '/api/docs/json',
        method: 'GET',
        description: 'JSON API documentation'
      }
    ]
  }
})
