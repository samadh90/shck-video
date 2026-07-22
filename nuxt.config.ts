import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-22',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Private server-only setting. At runtime, prefer NUXT_JWT_SECRET.
    jwtSecret: process.env.NUXT_JWT_SECRET || process.env.JWT_SECRET || '',
    email: {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASSWORD || '',
      from: process.env.MAIL_FROM || '',
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },

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
    plugins: [tailwindcss()],
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
