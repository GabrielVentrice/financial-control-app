// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys (server-side only)
    googleClientEmail: '',
    googlePrivateKey: '',

    // Cache configuration (server-side only)
    cache: {
      enabled: true,
      ttlMinutes: 60,
      autoRefresh: false
    },

    // Public keys (client-side accessible)
    public: {
      googleSpreadsheetId: '',
    }
  },

  modules: ['@nuxtjs/tailwindcss'],

  app: {
    head: {
      title: 'Controle Financeiro',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sistema de controle financeiro integrado com Google Sheets' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap' }
      ]
    }
  },

  // Vercel deployment optimizations
  nitro: {
    preset: 'vercel',

    // Production optimizations
    minify: true,
    sourceMap: false,

    // OpenAPI configuration for API documentation
    experimental: {
      openAPI: true
    },
    openAPI: {route: '/api/docs'}
  },

  // Production build optimizations
  sourcemap: {
    server: false,
    client: false
  }
})
