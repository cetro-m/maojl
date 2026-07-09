# maojl Digital Lab Journal

Personal writing site built with Nuxt 4, Nuxt Content 3, Nuxt SEO, TypeScript, and pnpm.

The interface direction is pixel, retro, and code-forward: dark CRT grid, monospace type, hard borders, terminal panels, and searchable writing.

## Scripts

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

`pnpm dev` is pinned to:

```text
http://127.0.0.1:3010/
```

## Project Layout

- `app/layouts/default.vue`: global shell, header, footer, and primary navigation.
- `app/assets/css/main.css`: global visual system and responsive layout rules.
- `app/pages`: route pages for home, blog, notes, archive, search, and about.
- `content/blog`: long-form articles.
- `content/notes`: shorter notes.
- `content.config.ts`: Nuxt Content collection schema.
- `nuxt.config.ts`: Nuxt, Content, and SEO module configuration.

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

## Visual Rules

- Keep the pixel-terminal language: square edges, hard borders, terminal marks, no soft card aesthetic.
- Keep blog and notes detail pages aligned to the article content column.
- Keep readable spacing on small screens down to 320px.
- Keep navigation stable across Home, Blog, Notes, About, Archive, and Search.

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

Generated Nuxt, Content, build, package-store, coverage, log, editor, and hosting preview outputs are ignored by `.gitignore`.

If Nuxt Content pages return 404 after running `pnpm typecheck`, restart the dev server:

```bash
pnpm dev
```
