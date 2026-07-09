import { tmpdir } from 'node:os'
import { join } from 'node:path'

const siteDescription = 'A personal logbook for code notes, game records, anime impressions, useful tools, task lists, and everyday thoughts.'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/seo', '@nuxt/content'],
  css: ['~/assets/css/main.css'],
  site: {
    url: process.env.NUXT_SITE_URL || 'https://maojl.dev',
    name: 'MAOJL.XYZ',
    description: siteDescription,
    defaultLocale: 'zh-CN',
    indexable: process.env.NUXT_SITE_INDEXABLE === 'true',
    trailingSlash: false,
  },
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/archive': { prerender: true },
    '/blog/**': { prerender: true },
    '/notes/**': { prerender: true },
    '/search': { prerender: true },
  },
  robots: {
    blockAiBots: false,
    blockNonSeoBots: true,
  },
  sitemap: {
    zeroRuntime: true,
    exclude: ['/__nuxt_content/**'],
  },
  schemaOrg: {
    enabled: false,
  },
  app: {
    head: {
      titleTemplate: '%s | MAOJL.XYZ',
      htmlAttrs: {
        lang: 'zh-CN',
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: siteDescription,
        },
        { property: 'og:site_name', content: 'MAOJL.XYZ' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
    _localDatabase: {
      type: 'sqlite',
      filename: join(tmpdir(), 'maojl-nuxt-content', 'contents.sqlite'),
    },
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
