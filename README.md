# MAOJL.XYZ

Personal logbook built with Nuxt 4, Nuxt Content 3, Nuxt SEO, TypeScript, and pnpm.

The site collects code notes, game records, anime impressions, useful tools, task lists, and everyday thoughts. The interface direction is pixel, retro, and code-forward: dark CRT grid, monospace type, hard borders, terminal panels, and searchable writing.

## Current Shape

- Content-first Nuxt 4 app using the `app/` directory.
- Typed Nuxt Content collections for `blog` and `notes`.
- List, search, archive, and navigation queries select only summary fields so Markdown bodies stay out of index payloads.
- Static-friendly route rules prerender the public content pages.
- Local Content SQLite output is written to the OS temp directory, keeping project files clean.

## Scripts

```bash
pnpm install
pnpm dev
pnpm generate
pnpm typecheck
pnpm build
pnpm preview
```

`pnpm dev` is pinned to:

```text
http://127.0.0.1:3010/
```

## Project Layout

- `app/layouts/default.vue`: global shell, header, footer, and primary navigation.
- `app/composables/useContentEntries.ts`: shared published-entry queries for list, search, archive, and navigation payloads.
- `app/assets/css/main.css`: global visual system and responsive layout rules.
- `app/pages`: route pages for home, blog, notes, archive, search, and about.
- `app/components/content`: custom MDC/prose components used by Nuxt Content.
- `app/utils/formatDate.ts`: shared date formatting helper.
- `content/blog`: long-form articles.
- `content/notes`: shorter notes.
- `public/images/about-pixel-art.svg`: About page pixel-art profile visual.
- `content.config.ts`: Nuxt Content collection schema.
- `nuxt.config.ts`: Nuxt, Content, and SEO module configuration.

## SEO

SEO is configured with `@nuxtjs/seo`.

- `nuxt.config.ts` defines the canonical site name, default description, robots, sitemap, and base head tags.
- Route pages use `useSeoMeta()` for page-specific titles, descriptions, Open Graph, and Twitter card metadata.
- Blog and note detail pages derive article metadata from Nuxt Content frontmatter, including title, description, date, category, and tags.

Production indexing is opt-in:

```bash
NUXT_SITE_URL=https://maojl.dev
NUXT_SITE_INDEXABLE=true
```

## Writing

Each content entry should include frontmatter like:

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

Use `draft: true` to hide an entry from list, search, and archive queries.

Content categories currently include engineering/design notes, build logs, task logs, and personal reference material. Keep `description` concise because it is used in list cards and SEO metadata.

## Visual Rules

- Keep the pixel-terminal language: square edges, hard borders, terminal marks, no soft card aesthetic.
- Keep blog and notes detail pages aligned to the article content column.
- Keep readable spacing on small screens down to 320px.
- Keep navigation stable across Home, Blog, Notes, About, Archive, and Search.
- Keep About page artwork in `public/images/about-pixel-art.svg`; the image container renders the full SVG without cropping.

## pnpm Notes

pnpm workspace settings live in `pnpm-workspace.yaml`.

- `onlyBuiltDependencies` / `allowBuilds` allow native install scripts used by Nuxt dependencies.
- `minimumReleaseAgeExclude` records trusted packages that were newer than pnpm's release-age policy at install time.
- `verifyDepsBeforeRun: false` keeps `pnpm dev` from auto-installing dependencies before startup.

If a future dependency update introduces native build-script prompts, run:

```bash
pnpm approve-builds --all
```

## Local Cleanup

Generated Nuxt, Content, build, package-store, coverage, local database, cache, log, editor, and hosting preview outputs are ignored by `.gitignore`.

The ignore rules also cover alternate generated folders such as `.nuxt-*` and `.output-*`, browser test reports, Wrangler previews, and SQLite journal files.

If Nuxt Content pages return 404 after running `pnpm typecheck`, restart the dev server:

```bash
pnpm dev
```

On Windows, a failed hot update can leave Nuxt/Vite generated files locked. If restarting still fails with `EPERM` around `.nuxt/dev`, `node_modules/.cache/vite`, or a `nuxt-vite-*` pipe, stop the dev server and remove the generated cache folders:

```powershell
Remove-Item -LiteralPath .nuxt\dev -Recurse -Force
Remove-Item -LiteralPath node_modules\.cache\vite -Recurse -Force
pnpm dev
```
