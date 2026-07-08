---
title: Building a maintainable blog with Nuxt Content
description: Start from the content model, then let the visual system grow around real writing, notes, and project records.
date: 2026-07-08
category: engineering
draft: false
tags:
  - nuxt
  - content
  - architecture
featured: true
readingTime: 6 min read
---

## Why the content model comes first

Personal blogs often drift when the first decision is visual style. A memorable interface matters, but the daily writing loop matters more.

This version separates long articles, short notes, and structured data. Articles carry durable arguments. Notes preserve field observations. Data collections can later feed a homepage, archive, or resume page without rewriting content.

::callout{type="terminal" title="stable first"}
The first milestone is not animation. It is a working path from Markdown to queryable, typed, rendered pages.
::

## Where Nuxt Content fits

Nuxt Content has three jobs in this project:

- Turn Markdown into queryable data.
- Validate every article with a schema.
- Let MDC components appear inside writing when plain Markdown is not enough.

```ts [content.config.ts]
blog: defineCollection({
  type: 'page',
  source: 'blog/**/*.md',
  schema: articleSchema,
})
```

## The first-stage boundary

The first stage stays intentionally small:

1. The homepage can read featured articles.
2. `/blog` can list published articles.
3. `/blog/[...slug]` can render a full article.
4. Type checking and production builds pass.

Theme switching, richer search, and motion can arrive later. Each layer should have a clean rollback point.
