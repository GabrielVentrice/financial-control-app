// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys (server-side only)
    googleClientEmail: '',
    googlePrivateKey: '',

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
      ]
    }
  },

  // Vercel deployment optimizations
  nitro: {
    preset: 'vercel',

    // Server assets - files accessible to server routes
    serverAssets: [
      {
        baseName: 'docs',
        dir: './server/assets/docs'
      }
    ],

    // Vercel-specific configuration
    vercel: {
      config: {
        maxDuration: 10, // Maximum execution time (seconds) for Hobby plan
      }
    },

    // Production optimizations
    minify: true,
    sourceMap: false,

    // Experimental features
    experimental: {
      openAPI: true
    }
  },

  // Production build optimizations
  sourcemap: {
    server: false,
    client: false
  }
})
