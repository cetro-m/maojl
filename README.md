# maojl Digital Lab Journal

Personal blog built with Nuxt 4, Nuxt Content, and Nuxt SEO.

The current interface direction is pixel, retro, and code-forward: dark CRT grid, monospace type, hard borders, terminal panels, and searchable writing.

## Stack

- Nuxt 4
- Nuxt Content 3
- Nuxt SEO
- TypeScript
- pnpm

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Run on the workspace preview port when needed:

```bash
pnpm exec nuxt dev --host 127.0.0.1 --port 3010
```

## Content Structure

Long articles live in `content/blog`.

Short notes live in `content/notes`.

Each entry should include frontmatter like:

```yaml
---
title: Example title
description: One-line summary for lists and meta tags.
date: 2026-07-09
category: engineering
draft: false
tags:
  - nuxt
  - content
readingTime: 5 min read
---
```

Set `draft: true` to hide an entry from list, search, and archive queries.

## Visual Notes

Global styling lives in `app/assets/css/main.css`.

The main UI rules are:

- Keep the pixel-terminal language: square edges, hard borders, no soft cards.
- Keep content readable on narrow screens down to 320px.
- Keep navigation stable across Home, Blog, Notes, About, Archive, and Search.

## Verification

```bash
pnpm exec nuxi typecheck
pnpm run build
```

Generated Nuxt, Content, build, and local package-store outputs are ignored by `.gitignore`.
