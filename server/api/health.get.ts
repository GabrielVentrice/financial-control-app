/**
 * Health Check Endpoint
 *
 * Returns basic health status and environment information.
 * Useful for monitoring and verifying deployment status.
 *
 * @returns Health check response with timestamp and status
 */
export default defineEventHandler(() => {
  const config = useRuntimeConfig()

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
    }
  }
})
