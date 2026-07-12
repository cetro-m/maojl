import { tmpdir } from 'node:os'
import { join } from 'node:path'

const siteDescription = 'A personal logbook for code notes, game records, anime impressions, useful tools, task lists, and everyday thoughts.'
const lifecycleBuildDirs: Record<string, string> = {
  build: '.nuxt-build',
  typecheck: '.nuxt-typecheck',
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Keep production builds from replacing the generated files used by a
  // concurrently running dev server.
  buildDir: lifecycleBuildDirs[process.env.npm_lifecycle_event || ''] || '.nuxt',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/seo', '@nuxt/content'],
  css: ['~/assets/css/main.css'],
  nitro: {
    compressPublicAssets: true,
  },
  vite: {
    optimizeDeps: {
      include: ['@unhead/schema-org/vue'],
    },
  },
  site: {
    url: process.env.NUXT_SITE_URL || 'https://maojl.xyz',
    name: 'MAOJL.XYZ',
    description: siteDescription,
    defaultLocale: 'zh-CN',
    indexable: process.env.NUXT_SITE_INDEXABLE === 'true',
    trailingSlash: false,
  },
  routeRules: {
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/images/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/': { prerender: true },
    '/about': { prerender: true },
    '/archive': { prerender: true },
    '/blog/**': { prerender: true },
    '/notes/**': { prerender: true },
    '/releases': { prerender: true },
    '/search': { prerender: true },
    '/rss.xml': { prerender: true },
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
    enabled: true,
  },
  app: {
    head: {
      titleTemplate: '%s | MAOJL.XYZ',
      htmlAttrs: {
        lang: 'zh-CN',
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#090b0f' },
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
