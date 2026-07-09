<script setup lang="ts">
type ArchiveEntry = {
  path: string
  title: string
  description: string
  date: string
  category: string
  tags?: string[]
  collectionLabel: string
}

const { data: blogPosts } = await useAsyncData('archive:blog', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all(),
)

const { data: notes } = await useAsyncData('archive:notes', () =>
  queryCollection('notes')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all(),
)

const entries = computed<ArchiveEntry[]>(() =>
  [
    ...(blogPosts.value ?? []).map((item) => ({ ...item, collectionLabel: 'Article' })),
    ...(notes.value ?? []).map((item) => ({ ...item, collectionLabel: 'Note' })),
  ].sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date))),
)

const archiveGroups = computed(() => {
  const years = new Map<string, Map<string, ArchiveEntry[]>>()

  entries.value.forEach((entry) => {
    const date = new Date(entry.date)
    const year = String(date.getFullYear())
    const month = date.toLocaleString('en', { month: 'long' })

    if (!years.has(year)) {
      years.set(year, new Map())
    }

    const months = years.get(year)!
    months.set(month, [...(months.get(month) ?? []), entry])
  })

  return Array.from(years, ([year, months]) => ({
    year,
    months: Array.from(months, ([month, items]) => ({ month, items })),
  }))
})

useSeoMeta({
  title: 'Archive',
  description: 'A chronological archive of maojl articles and notes, grouped by year and month for quick revisiting.',
  ogTitle: 'Archive',
  ogDescription: 'Browse the complete timeline of code logs, game records, anime thoughts, tools, notes, and daily fragments.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="content-page">
    <section class="page-hero compact">
      <p class="eyebrow">Archive</p>
      <h1>A TIMELINE OF <br> EVERYTHING WORTH KEEPING.</h1>
      <p>All posts and notes are grouped by year and month, so code logs, game records, anime thoughts, tools, and daily
        fragments stay easy to revisit.</p>
    </section>

    <section class="archive-timeline">
      <div v-for="group in archiveGroups" :key="group.year" class="archive-year">
        <div class="archive-year-marker">
          <span>{{ group.year }}</span>
        </div>

        <div class="archive-months">
          <section v-for="month in group.months" :key="month.month" class="archive-month">
            <h2>{{ month.month }}</h2>

            <div class="result-list compact">
              <NuxtLink v-for="entry in month.items" :key="entry.path" class="result-row" :to="entry.path">
                <article>
                  <div class="article-row-top">
                    <span>{{ entry.collectionLabel }}</span>
                    <span>{{ formatDate(entry.date) }}</span>
                    <span>{{ entry.category }}</span>
                  </div>
                  <h3>{{ entry.title }}</h3>
                  <p>{{ entry.description }}</p>
                </article>
              </NuxtLink>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
