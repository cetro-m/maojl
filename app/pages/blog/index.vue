<script setup lang="ts">
const route = useRoute()

const { data: posts } = await useAsyncData('blog:index', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all(),
)

const activeTag = computed(() => {
  const tag = route.query.tag
  return typeof tag === 'string' ? tag : ''
})

const allTags = computed(() => {
  const tags = new Set<string>()
  posts.value?.forEach((post) => post.tags?.forEach((tag) => tags.add(tag)))
  return Array.from(tags).sort()
})

const tagCounts = computed(() => {
  const counts = new Map<string, number>()
  posts.value?.forEach((post) => {
    post.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
  })
  return counts
})

const filteredPosts = computed(() => {
  if (!activeTag.value) {
    return posts.value ?? []
  }

  return posts.value?.filter((post) => post.tags?.includes(activeTag.value)) ?? []
})

useSeoMeta({
  title: 'Blog',
  description: 'Longer posts about development, Nuxt Content, interface design, tools, games, anime, and personal systems.',
  ogTitle: 'Blog',
  ogDescription: 'A searchable archive of longer thoughts from maojl: code, design, tools, games, anime, and systems.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="content-page">
    <section class="page-hero compact">
      <p class="eyebrow">Blog Index</p>
      <h1>A SEARCHABLE ARCHIVE <br> FOR LONGER THOUGHTS.</h1>
      <p>
        Development notes, game records, anime impressions, tool reviews, and other entries that need more room than a
        quick note.
      </p>
    </section>

    <section class="index-layout">
      <aside class="index-sidebar">
        <div class="sidebar-header">
          <p class="sidebar-title">Tags</p>
          <NuxtLink v-if="activeTag" class="clear-filter" to="/blog">Clear</NuxtLink>
        </div>

        <div class="filter-list">
          <NuxtLink v-for="tag in allTags" :key="tag" class="filter-chip" :class="{ active: activeTag === tag }"
            :to="{ path: '/blog', query: { tag } }">
            <span>#{{ tag }}</span>
            <span>{{ tagCounts.get(tag) }}</span>
          </NuxtLink>
        </div>
      </aside>

      <div class="article-list">
        <div class="list-status">
          <span>{{ filteredPosts.length }} entries</span>
          <span v-if="activeTag">filtered by #{{ activeTag }}</span>
          <span v-else>all signals</span>
        </div>

        <NuxtLink v-for="post in filteredPosts" :key="post.path" class="article-row" :to="post.path">
          <article>
            <div class="article-row-top">
              <span>{{ formatDate(post.date) }}</span>
              <span>{{ post.category }}</span>
              <span v-if="post.readingTime">{{ post.readingTime }}</span>
            </div>
            <h2>{{ post.title }}</h2>
            <p>{{ post.description }}</p>
            <div class="tag-row">
              <span v-for="tag in post.tags" :key="tag">#{{ tag }}</span>
            </div>
          </article>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
