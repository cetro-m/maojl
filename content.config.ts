import { defineCollection, defineContentConfig } from '@nuxt/content'
import {
  defineOgImageSchema,
  defineRobotsSchema,
  defineSitemapSchema,
} from '@nuxtjs/seo/content'
import { z } from 'zod'

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.iso.date(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  readingTime: z.string().optional(),
  ogImage: defineOgImageSchema({ z }),
  robots: defineRobotsSchema({ z }),
  sitemap: defineSitemapSchema({ z }),
  head: z.object({
    meta: z.array(z.record(z.string(), z.any()).optional()).optional(),
    script: z.array(z.record(z.string(), z.any()).optional()).optional(),
  }).optional(),
})

const releaseSchema = z.object({
  title: z.string(),
  description: z.string(),
  version: z.string().regex(/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  date: z.iso.date(),
  latest: z.boolean().default(false),
  prerelease: z.boolean().default(false),
  draft: z.boolean().default(false),
  commit: z.string().optional(),
  repositoryUrl: z.url().optional(),
  compareUrl: z.url().optional(),
  assets: z.array(z.object({
    name: z.string(),
    url: z.url(),
    size: z.string().optional(),
    platform: z.string().optional(),
  })).default([]),
})

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: articleSchema,
    }),
    notes: defineCollection({
      type: 'page',
      source: 'notes/**/*.md',
      schema: articleSchema,
    }),
    releases: defineCollection({
      type: 'page',
      source: 'releases/**/*.md',
      schema: releaseSchema,
    }),
  },
})
