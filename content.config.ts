import { defineCollection, defineContentConfig } from '@nuxt/content'
import {
  defineOgImageSchema,
  defineRobotsSchema,
  defineSchemaOrgSchema,
  defineSitemapSchema,
} from '@nuxtjs/seo/content'
import { z } from 'zod'

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  readingTime: z.string().optional(),
  ogImage: defineOgImageSchema({ z }),
  schemaOrg: defineSchemaOrgSchema({ z }),
  robots: defineRobotsSchema({ z }),
  sitemap: defineSitemapSchema({ z }),
  head: z.object({
    meta: z.array(z.record(z.string(), z.any()).optional()).optional(),
    script: z.array(z.record(z.string(), z.any()).optional()).optional(),
  }).optional(),
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
  },
})
