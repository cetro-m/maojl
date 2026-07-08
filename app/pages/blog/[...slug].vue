<script setup lang="ts">
type TocLink = {
  id: string
  text: string
  depth?: number
  children?: TocLink[]
}

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug
const path = `/blog/${slug}`

const { data: post } = await useAsyncData(`blog:${path}`, () =>
  queryCollection('blog').path(path).first(),
)

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Article not found',
  })
}

const article = computed(() => post.value!)

const { data: publishedPosts } = await useAsyncData('blog:published-navigation', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all(),
)

const currentIndex = computed(() =>
  publishedPosts.value?.findIndex((item) => item.path === path) ?? -1,
)

const newerPost = computed(() => {
  if (currentIndex.value <= 0) {
    return null
  }

  return publishedPosts.value?.[currentIndex.value - 1] ?? null
})

const olderPost = computed(() => {
  if (currentIndex.value < 0) {
    return null
  }

  return publishedPosts.value?.[currentIndex.value + 1] ?? null
})

const tocLinks = computed<TocLink[]>(() => article.value.body?.toc?.links ?? [])

const relatedPosts = computed(() => {
  const tags = new Set(article.value.tags ?? [])

  return (publishedPosts.value ?? [])
    .filter((item) => item.path !== path)
    .filter((item) => item.category === article.value.category || item.tags?.some((tag) => tags.has(tag)))
    .slice(0, 3)
})

useSeoMeta({
  title: () => article.value.title,
  description: () => article.value.description,
})
</script>

<template>
  <article class="article-page">
    <NuxtLink class="back-link" to="/blog">Back to blog</NuxtLink>

    <header class="article-hero">
      <p class="article-meta">{{ formatDate(article.date) }} / {{ article.category }}</p>
      <h1>{{ article.title }}</h1>
      <p>{{ article.description }}</p>
      <div class="tag-row">
        <NuxtLink v-for="tag in article.tags" :key="tag" :to="{ path: '/blog', query: { tag } }">
          #{{ tag }}
        </NuxtLink>
      </div>
    </header>

    <div class="article-shell">
      <aside class="article-aside">
        <p class="sidebar-title">Reading</p>
        <p>{{ article.readingTime || 'Long form' }}</p>

        <nav v-if="tocLinks.length" class="toc-nav" aria-label="Table of contents">
          <p class="sidebar-title">On this page</p>
          <a v-for="link in tocLinks" :key="link.id" :href="`#${link.id}`">
            {{ link.text }}
          </a>
        </nav>
      </aside>

      <ContentRenderer class="prose" :value="article" />
    </div>

    <nav v-if="newerPost || olderPost" class="post-navigation" aria-label="Post navigation">
      <NuxtLink v-if="newerPost" class="post-nav-card" :to="newerPost.path">
        <span>Newer</span>
        <strong>{{ newerPost.title }}</strong>
      </NuxtLink>
      <span v-else />

      <NuxtLink v-if="olderPost" class="post-nav-card align-right" :to="olderPost.path">
        <span>Older</span>
        <strong>{{ olderPost.title }}</strong>
      </NuxtLink>
    </nav>

    <section v-if="relatedPosts.length" class="related-section">
      <div class="section-heading">
        <p class="eyebrow">Related</p>
        <h2>Same signal path</h2>
      </div>
      <div class="related-grid">
        <NuxtLink v-for="related in relatedPosts" :key="related.path" class="post-card" :to="related.path">
          <article>
            <p class="article-meta">{{ formatDate(related.date) }} / {{ related.category }}</p>
            <h3>{{ related.title }}</h3>
            <p>{{ related.description }}</p>
          </article>
        </NuxtLink>
      </div>
    </section>
  </article>
</template>
