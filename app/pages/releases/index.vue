<script setup lang="ts">
const { data: releases } = await useAsyncData('releases:index', () =>
  queryCollection('releases')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all(),
)

const publishedReleases = computed(() => releases.value ?? [])

defineOgImage('BlogTakumi', {
  title: 'Releases',
  description: 'Version history and release notes for MAOJL.XYZ.',
})

useSeoMeta({
  title: 'Releases',
  description: 'Version history, shipped improvements, fixes, and downloadable artifacts for MAOJL.XYZ.',
  ogTitle: 'MAOJL.XYZ Releases',
  ogDescription: 'Follow the public build history of MAOJL.XYZ.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="content-page releases-page">
    <section class="page-hero compact releases-hero">
      <div>
        <p class="eyebrow">Release channel</p>
        <h1>SHIPPED BUILDS,<br>CHANGE BY CHANGE.</h1>
        <p>Version history for the site: what changed, what was fixed, and which build is currently live.</p>
      </div>
      <div class="release-counter" aria-label="Published release count">
        <span>Published</span>
        <strong>{{ publishedReleases.length.toString().padStart(2, '0') }}</strong>
        <small>build records</small>
      </div>
    </section>

    <nav v-if="publishedReleases.length" class="release-jump-nav" aria-label="Jump to release">
      <span>Jump to</span>
      <a v-for="release in publishedReleases" :key="release.version" :href="`#${release.version}`">
        {{ release.version }}
      </a>
    </nav>

    <section v-if="publishedReleases.length" class="release-stream" aria-label="Release history">
      <article v-for="(release, index) in publishedReleases" :id="release.version" :key="release.path"
        class="release-entry" :class="{ 'is-latest': release.latest || index === 0 }">
        <aside class="release-rail" aria-hidden="true">
          <span class="release-node" />
          <span class="release-index">{{ String(publishedReleases.length - index).padStart(2, '0') }}</span>
        </aside>

        <div class="release-card">
          <header class="release-header">
            <div class="release-title-block">
              <div class="release-badges">
                <span v-if="release.latest || index === 0" class="release-badge latest">Latest</span>
                <span v-if="release.prerelease" class="release-badge prerelease">Pre-release</span>
                <span class="release-badge published">Published</span>
              </div>
              <h2><NuxtLink :to="release.path">{{ release.title }}</NuxtLink></h2>
              <p>{{ release.description }}</p>
            </div>

            <NuxtLink class="release-version" :to="release.path" :aria-label="`Open release ${release.version}`">
              <span>tag</span>
              <strong>{{ release.version }}</strong>
            </NuxtLink>
          </header>

          <div class="release-meta-bar">
            <span><b>DATE</b>{{ formatDate(release.date) }}</span>
            <span v-if="release.commit"><b>COMMIT</b><code>{{ release.commit }}</code></span>
          </div>

          <footer class="release-footer release-index-footer">
            <span v-if="release.assets.length">{{ release.assets.length }} downloadable {{ release.assets.length === 1 ? 'asset' : 'assets' }}</span>
            <span v-else>Release notes available</span>
            <NuxtLink :to="release.path">Read release notes →</NuxtLink>
          </footer>
        </div>
      </article>
    </section>

    <section v-else class="empty-state release-empty">
      <p class="sidebar-title">No releases published</p>
      <p>Add a Markdown file to <code>content/releases</code> to open the release channel.</p>
    </section>
  </div>
</template>
