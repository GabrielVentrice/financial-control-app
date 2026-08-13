// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys (server-side only) — the Google pair only feeds the budget
    // screens (Sheets); transactions come from Bkper.
    googleClientEmail: '',
    googlePrivateKey: '',

    // Bkper: the ledger the transactions come from. `refreshToken` is what the
    // `bkper auth login` device flow stores; clientId/clientSecret are the CLI's
    // own OAuth client, which minted it.
    bkper: {
      bookId: '',
      refreshToken: '',
      clientId: '',
      clientSecret: '',
      apiKey: '',
    },

    // TTL of the in-memory caches (Bkper snapshot, Sheets budgets/templates).
    cache: {
      ttlMinutes: 60,
    },

    // Public keys (client-side accessible)
    public: {
      googleSpreadsheetId: '',
    }
  },

  // tokens.css primeiro: global.css e as utilities do Tailwind consomem as
  // custom properties definidas nele.
  css: ['~/assets/css/tokens.css', '~/assets/css/global.css'],

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
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Public+Sans:wght@400;500;600;700&display=swap' }
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
    openAPI: {route: '/api/docs'},

    // Vercel: higher function timeout so a cold instance has room to read the
    // whole Bkper book (~7s) plus whatever request triggered it.
    vercel: {
      functions: {
        maxDuration: 60
      }
    }
  },

  // Production build optimizations
  sourcemap: {
    server: false,
    client: false
  }
})
