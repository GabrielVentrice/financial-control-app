export default defineNitroConfig({
  experimental: {
    openAPI: true
  },
  openAPI: {
    meta: {
      title: 'Financial Control API',
      description: 'API for managing financial transactions with Google Sheets integration. Provides comprehensive transaction filtering, person identification, installment processing, and analytics capabilities.',
      version: '1.0.0'
    },
    ui: {
      scalar: {
        theme: 'default'
      },
      swagger: {
        theme: 'flattop'
      }
    }
  }
})
