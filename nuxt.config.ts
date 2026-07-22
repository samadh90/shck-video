// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-22',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  // Nuxt 4.5's dev-only page diagnostic is misclassified as lacking a default
  // export by Nuxt's own plugin scanner. It is not needed at runtime.
  hooks: {
    'app:resolve': (app) => {
      app.plugins = app.plugins.filter(
        plugin => !plugin.src.includes('/pages/runtime/plugins/check-if-page-unused')
      )
    }
  },

  nitro: {
    compressPublicAssets: true
  },

  vite: {
    build: {
      target: 'es2020',
      cssMinify: true,
      minify: 'esbuild'
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'
        }
      ]
    }
  }
})
