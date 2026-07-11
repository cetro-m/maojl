<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug
const path = `/notes/${slug}`

const { data: note } = await useAsyncData(`notes:${path}`, () =>
  queryCollection('notes')
    .where('draft', '=', false)
    .path(path)
    .first(),
)

if (!note.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Note not found',
  })
}

const article = computed(() => note.value!)

defineOgImage('BlogTakumi', {
  title: () => article.value.title,
  description: () => article.value.description,
})

useSchemaOrg([
  defineArticle({
    headline: () => article.value.title,
    description: () => article.value.description,
    datePublished: () => article.value.date,
    author: { name: 'maojl', url: '/' },
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Notes', item: '/notes' },
      { name: () => article.value.title, item: () => article.value.path },
    ],
  }),
])

useSeoMeta({
  title: () => article.value.title,
  description: () => article.value.description,
  ogTitle: () => article.value.title,
  ogDescription: () => article.value.description,
  ogType: 'article',
  articlePublishedTime: () => article.value.date,
  articleSection: () => article.value.category,
  articleTag: () => article.value.tags,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <article class="article-page">
    <NuxtLink class="back-link" to="/notes">Back to notes</NuxtLink>

    <header class="article-hero">
      <p class="article-meta">{{ formatDate(article.date) }} / {{ article.category }}</p>
      <h1>{{ article.title }}</h1>
      <p>{{ article.description }}</p>
      <div class="tag-row">
        <span v-for="tag in article.tags" :key="tag"><span class="tag-hash" aria-hidden="true">#</span>{{ tag }}</span>
      </div>
    </header>

    <div class="article-shell">
      <aside class="article-aside">
        <p class="sidebar-title">Note</p>
        <p>{{ article.readingTime || 'Short form' }}</p>
      </aside>

      <ContentRenderer class="prose" :value="article" />
    </div>
  </article>
</template>
