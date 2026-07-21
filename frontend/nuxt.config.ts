// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  // ── Nitro Engine Compression ──────────────────────────────────────────────
  nitro: {
    compressPublicAssets: true
  },

  // ── Vite Build Configuration ──────────────────────────────────────────────
  vite: {
    build: {
      target: 'es2018',
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          }
        }
      },
      chunkSizeWarningLimit: 700
    },
    optimizeDeps: {
      include: ['vue', 'vue-router']
    }
  },

  // ── Nuxt App Head ─────────────────────────────────────────────────────────
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' }
      ],
      // Preconnect to Google Fonts to speed up font loading
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'
        }
      ]
    }
  },

  // ── Experimental performance flags ────────────────────────────────────────
  experimental: {
    // Inline critical CSS to avoid render-blocking stylesheets
    inlineSSRStyles: false,
    // Pay-load reduction: avoid shipping full Vue hydration on static pages
    payloadExtraction: false
  },

  // ── Component Options ─────────────────────────────────────────────────────
  components: {
    // Components are auto-imported — Nuxt handles code splitting automatically
    dirs: ['~/components']
  },

  // ── Runtime config (env vars) ─────────────────────────────────────────────
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:3001'
    }
  }
})
