<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug
const path = `/releases/${slug}`

const { data: release } = await useAsyncData(`releases:${path}`, () =>
  queryCollection('releases').where('draft', '=', false).path(path).first(),
)

if (!release.value) {
  throw createError({ statusCode: 404, statusMessage: 'Release not found' })
}

const entry = computed(() => release.value!)
const tocLinks = computed(() => flattenToc(entry.value.body?.toc?.links))

defineOgImage('BlogTakumi', {
  title: () => `${entry.value.version} · ${entry.value.title}`,
  description: () => entry.value.description,
})

useSchemaOrg([
  defineArticle({
    headline: () => entry.value.title,
    description: () => entry.value.description,
    datePublished: () => entry.value.date,
    author: { name: 'maojl', url: '/' },
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Releases', item: '/releases' },
      { name: () => entry.value.version, item: () => entry.value.path },
    ],
  }),
])

useSeoMeta({
  title: () => `${entry.value.version} · ${entry.value.title}`,
  description: () => entry.value.description,
  ogTitle: () => `${entry.value.version} · ${entry.value.title}`,
  ogDescription: () => entry.value.description,
  ogType: 'article',
  articlePublishedTime: () => entry.value.date,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <article class="article-page release-detail-page">
    <NuxtLink class="back-link" to="/releases">Back to releases</NuxtLink>

    <header class="article-hero release-detail-hero">
      <div class="release-badges">
        <span v-if="entry.latest" class="release-badge latest">Latest</span>
        <span v-if="entry.prerelease" class="release-badge prerelease">Pre-release</span>
        <span class="release-badge published">Published</span>
      </div>
      <p class="article-meta">{{ formatDate(entry.date) }} / {{ entry.version }}</p>
      <h1>{{ entry.title }}</h1>
      <p>{{ entry.description }}</p>
    </header>

    <div class="release-detail-shell">
      <aside class="article-aside release-detail-aside">
        <p class="sidebar-title">Build record</p>
        <dl>
          <div><dt>Version</dt><dd>{{ entry.version }}</dd></div>
          <div><dt>Date</dt><dd>{{ formatDate(entry.date) }}</dd></div>
          <div v-if="entry.commit"><dt>Commit</dt><dd><code>{{ entry.commit }}</code></dd></div>
        </dl>
        <nav v-if="tocLinks.length" class="toc-nav" aria-label="Table of contents">
          <p class="sidebar-title">On this page</p>
          <a v-for="link in tocLinks" :key="link.id" :href="`#${link.id}`" :data-depth="link.depth">
            {{ link.text }}
          </a>
        </nav>
        <a v-if="entry.compareUrl" :href="entry.compareUrl" target="_blank" rel="noopener noreferrer">Compare changes →</a>
      </aside>

      <div class="release-detail-content">
        <ContentRenderer class="release-notes prose" :value="entry" />

        <section v-if="entry.assets.length" class="release-assets">
          <h3>Assets <span>{{ entry.assets.length }}</span></h3>
          <a v-for="asset in entry.assets" :key="asset.url" :href="asset.url" target="_blank"
            rel="noopener noreferrer" class="release-asset">
            <span class="asset-icon" aria-hidden="true">↓</span>
            <span class="asset-copy">
              <strong>{{ asset.name }}</strong>
              <small>{{ [asset.platform, asset.size].filter(Boolean).join(' · ') }}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
        </section>

        <footer v-if="entry.repositoryUrl" class="release-footer">
          <a :href="entry.repositoryUrl" target="_blank" rel="noopener noreferrer">View repository →</a>
        </footer>
      </div>
    </div>
  </article>
</template>
