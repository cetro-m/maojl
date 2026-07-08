<script setup lang="ts">
const route = useRoute()

const { data: blogPosts } = await useAsyncData('search:blog', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all(),
)

const { data: notes } = await useAsyncData('search:notes', () =>
  queryCollection('notes')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all(),
)

const searchTerm = ref(typeof route.query.q === 'string' ? route.query.q : '')

const entries = computed(() => [
  ...(blogPosts.value ?? []).map((item) => ({ ...item, collectionLabel: 'Article' })),
  ...(notes.value ?? []).map((item) => ({ ...item, collectionLabel: 'Note' })),
])

const results = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  if (!query) {
    return entries.value
  }

  return entries.value.filter((entry) => {
    const haystack = [
      entry.title,
      entry.description,
      entry.category,
      ...(entry.tags ?? []),
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
})

const resultLabel = computed(() => {
  if (!searchTerm.value.trim()) {
    return `${results.value.length} indexed entries`
  }

  return `${results.value.length} matches for "${searchTerm.value.trim()}"`
})

useSeoMeta({
  title: 'Search',
  description: 'Search articles and field notes from the maojl digital lab.',
})
</script>

<template>
  <div class="content-page">
    <section class="page-hero compact">
      <p class="eyebrow">Search</p>
      <h1>Find a signal by phrase, tag, or category.</h1>
      <p>Search covers article and note metadata today: titles, descriptions, categories, and tags.</p>
    </section>

    <section class="utility-layout">
      <div class="search-panel">
        <label class="search-label" for="content-search">Query</label>
        <input
          id="content-search"
          v-model="searchTerm"
          class="search-input"
          type="search"
          autocomplete="off"
          placeholder="Try nuxt, design, system..."
        >
        <p class="list-status">{{ resultLabel }}</p>
      </div>

      <div v-if="results.length" class="result-list">
        <NuxtLink v-for="entry in results" :key="entry.path" class="result-row" :to="entry.path">
          <article>
            <div class="article-row-top">
              <span>{{ entry.collectionLabel }}</span>
              <span>{{ formatDate(entry.date) }}</span>
              <span>{{ entry.category }}</span>
            </div>
            <h2>{{ entry.title }}</h2>
            <p>{{ entry.description }}</p>
            <div class="tag-row">
              <span v-for="tag in entry.tags" :key="tag">#{{ tag }}</span>
            </div>
          </article>
        </NuxtLink>
      </div>

      <div v-else class="empty-state">
        <p class="sidebar-title">No matches</p>
        <p>Try a broader phrase or search by one of the visible tags in the blog index.</p>
      </div>
    </section>
  </div>
</template>
