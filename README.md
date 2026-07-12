# MAOJL.XYZ

Personal logbook built with Nuxt 4, Nuxt Content 3, Nuxt SEO, TypeScript, and pnpm.

The site collects code notes, game records, anime impressions, useful tools, task lists, and everyday thoughts. The interface direction is pixel, retro, and code-forward: dark CRT grid, monospace type, hard borders, terminal panels, and searchable writing.

## Current Shape

- Content-first Nuxt 4 app using the `app/` directory.
- Typed Nuxt Content collections for `blog`, `notes`, and `releases`.
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
pnpm start
pnpm test:smoke
pnpm check:production-env
pnpm deploy:build
pnpm validate
```

`pnpm dev` is pinned to:

```text
http://127.0.0.1:3010/
```

Production builds and type checks use isolated `.nuxt-build` and `.nuxt-typecheck`
directories, so running `pnpm build` or `pnpm typecheck` does not replace the
generated files used by an active development server.

`pnpm test:smoke` checks public pages, content detail routes, SEO endpoints, RSS,
critical font/image assets, and the 404 boundary. Override its target with
`SMOKE_BASE_URL` when testing preview or a deployed environment.

`pnpm deploy:build` validates the production URL, indexing flag, runtime mode,
and OG image secret before running the full type check and production build.

## Project Layout

- `app/layouts/default.vue`: global shell, header, footer, and primary navigation.
- `app/composables/useContentEntries.ts`: shared published-entry queries for list, search, archive, and navigation payloads.
- `app/assets/css/main.css`: global visual system and responsive layout rules.
- `app/pages`: route pages for home, blog, notes, archive, search, and about.
- `app/pages/releases`: release index and detail routes assembled from release Markdown.
- `app/components/content`: custom MDC/prose components used by Nuxt Content.
- `app/components/OgImage`: local production-safe Open Graph image templates.
- `app/utils/formatDate.ts`: shared date formatting helper.
- `app/utils/contentToc.ts`: shared typed table-of-contents flattening helper.
- `content/blog`: long-form articles.
- `content/notes`: shorter notes.
- `content/releases`: structured release records.
- `public/fonts`: production webfonts served without a bundler transform.
- `public/images/about-pixel-art.jpg`: optimized About page pixel-art profile visual.
- `scripts/smoke-test.mjs`: public-route and SEO endpoint smoke test.
- `server/routes/rss.xml.ts`: RSS 2.0 feed endpoint.
- `deployment`: version-controlled environment, systemd unit/hardening drop-in, and Nginx templates aligned with production.
- `docs/DEPLOYMENT.md`: Linux, systemd, Nginx, HTTPS, updates, and rollback guide.
- `content.config.ts`: Nuxt Content collection schema.
- `nuxt.config.ts`: Nuxt, Content, and SEO module configuration.

## SEO

SEO is configured with `@nuxtjs/seo`.

- `nuxt.config.ts` defines the canonical site name, default description, robots, sitemap, and base head tags.
- Route pages use `useSeoMeta()` for page-specific titles, descriptions, Open Graph, and Twitter card metadata.
- Blog and note detail pages derive article metadata from Nuxt Content frontmatter, including title, description, date, category, and tags.

Production indexing is opt-in:

```bash
NUXT_SITE_URL=https://maojl.xyz
NUXT_SITE_INDEXABLE=true
```

Dynamic OG image URLs are signed. Copy `.env.example` to `.env` locally and
set the same private `NUXT_OG_IMAGE_SECRET` on every production instance. The
real `.env` file is ignored by Git.

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

Release records live in `content/releases`. Their frontmatter supports semantic
versions, latest/pre-release flags, commit and compare links, and downloadable
assets. Use `draft: true` while preparing an unpublished release.

## Visual Rules

- Keep the pixel-terminal language: square edges, hard borders, terminal marks, no soft card aesthetic.
- Keep blog and notes detail pages aligned to the article content column.
- Keep readable spacing on small screens down to 320px.
- Keep navigation stable across Home, Blog, Notes, Releases, About, Archive, and Search.
- Keep About page artwork in `public/images/about-pixel-art.jpg`; preserve its explicit dimensions to avoid layout shift.

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

The ignore rules also cover alternate generated folders such as `.nuxt-*` and `.output-*`, local audit/Lighthouse output, browser test reports, Wrangler previews, and SQLite journal files.

Production builds precompress public assets. Fonts and version-controlled images are served with a one-year immutable cache policy; rename an asset when replacing its contents so clients receive the new version.

## Deployment

The recommended production layout is an isolated Node/Nitro service bound to
`127.0.0.1:3010`, managed by systemd and exposed through the existing Nginx
installation. The target host already runs another production application on
port 3000, so its files, process, service, and virtual hosts must not be reused.

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the complete first deployment,
environment configuration, verification, update, and rollback procedure.

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
