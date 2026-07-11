<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { data: blogPosts } = await useAsyncData('search:blog', () =>
  queryPublishedEntries('blog').all(),
)

const { data: notes } = await useAsyncData('search:notes', () =>
  queryPublishedEntries('notes').all(),
)

const { data: blogSections } = await useAsyncData('search:blog-sections', () =>
  queryCollectionSearchSections('blog', { minHeading: 'h2', maxHeading: 'h4' }),
)

const { data: noteSections } = await useAsyncData('search:note-sections', () =>
  queryCollectionSearchSections('notes', { minHeading: 'h2', maxHeading: 'h4' }),
)

const searchTerm = ref(typeof route.query.q === 'string' ? route.query.q : '')
let syncingFromRoute = false

const entries = computed(() => [
  ...(blogPosts.value ?? []).map((item) => ({ ...item, collectionLabel: 'Article' })),
  ...(notes.value ?? []).map((item) => ({ ...item, collectionLabel: 'Note' })),
])

const searchableContent = computed(() => {
  const publishedPaths = new Set(entries.value.map((entry) => entry.path))
  const byPath = new Map<string, string[]>()

  for (const section of [...(blogSections.value ?? []), ...(noteSections.value ?? [])]) {
    const path = section.id.split('#', 1)[0] || section.id

    if (!publishedPaths.has(path)) {
      continue
    }

    const text = [section.title, ...(section.titles ?? []), section.content].join(' ')
    byPath.set(path, [...(byPath.get(path) ?? []), text])
  }

  return byPath
})

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
      ...(searchableContent.value.get(entry.path) ?? []),
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
})

let syncTimer: ReturnType<typeof setTimeout> | undefined

watch(searchTerm, (value) => {
  if (syncingFromRoute) {
    syncingFromRoute = false
    return
  }

  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const query = value.trim()
    void router.replace({
      query: {
        ...route.query,
        q: query || undefined,
      },
    })
  }, 250)
})

watch(
  () => route.query.q,
  (value) => {
    const nextValue = typeof value === 'string' ? value : ''

    if (nextValue !== searchTerm.value) {
      syncingFromRoute = true
      searchTerm.value = nextValue
    }
  },
)

onBeforeUnmount(() => clearTimeout(syncTimer))

const resultLabel = computed(() => {
  if (!searchTerm.value.trim()) {
    return `${results.value.length} indexed entries`
  }

  return `${results.value.length} matches for "${searchTerm.value.trim()}"`
})

defineOgImage('BlogTakumi', {
  title: 'Search',
  description: 'Search the personal logbook by phrase, tag, or topic.',
})

useSeoMeta({
  title: 'Search',
  description: 'Search maojl articles and notes by phrase, tag, topic, tool, game, anime, task, or project fragment.',
  ogTitle: 'Search',
  ogDescription: 'Find posts, notes, tools, game logs, anime thoughts, task lists, and old fragments from the personal logbook.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="content-page">
    <section class="page-hero compact">
      <p class="eyebrow">Search</p>
      <h1>SEARCH THE PERSONAL LOGBOOK.</h1>
      <p>Find posts, notes, tools, game logs, anime thoughts, and old fragments by phrase, tag, or topic.</p>
    </section>

    <section class="utility-layout">
      <div class="search-panel">
        <label class="search-label" for="content-search">Query</label>
        <input id="content-search" v-model="searchTerm" class="search-input" type="search" autocomplete="off"
          name="q" placeholder="Try tag, design, system…">
        <p class="list-status" aria-live="polite">{{ resultLabel }}</p>
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
              <span v-for="tag in entry.tags" :key="tag"><span class="tag-hash" aria-hidden="true">#</span>{{ tag }}</span>
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
