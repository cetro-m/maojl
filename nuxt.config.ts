// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/seo', '@nuxt/content'],
  css: ['~/assets/css/main.css'],
  site: {
    url: process.env.NUXT_SITE_URL || 'https://maojl.dev',
    name: 'maojl',
    description: 'A personal digital lab for engineering notes, interface craft, and system thinking.',
    defaultLocale: 'zh-CN',
    indexable: process.env.NUXT_SITE_INDEXABLE === 'true',
    trailingSlash: false,
  },
  robots: {
    blockAiBots: false,
    blockNonSeoBots: true,
  },
  sitemap: {
    zeroRuntime: true,
    exclude: ['/__nuxt_content/**'],
  },
  app: {
    head: {
      titleTemplate: '%s | maojl',
      htmlAttrs: {
        lang: 'zh-CN',
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'A personal digital lab for engineering notes, interface craft, and system thinking.',
        },
      ],
    },
  },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark',
          },
          langs: ['vue', 'typescript', 'javascript', 'bash', 'json', 'yaml', 'md'],
        },
      },
    },
  },
})
