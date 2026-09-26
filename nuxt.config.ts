export default defineNuxtConfig({
  ssr: false, // Pure client-side SPA mode (ready for Capacitor mobile build)
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/test-utils/module', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2026-09-25',
  app: {
    head: {
      title: 'Personal Shopper - Pantry & Shopping List',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' },
        { name: 'theme-color', content: '#10b981' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'description', content: 'Smart pantry inventory and cadence-driven shopping list' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/pantry-icon.svg' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
    },
  },
})
