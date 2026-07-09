<script setup lang="ts">
const { data: notes } = await useAsyncData('notes:index', () =>
  queryPublishedEntries('notes').all(),
)

useSeoMeta({
  title: 'Notes',
  description: 'Short notes for task logs, debugging results, game records, anime impressions, tool finds, links, lists, and questions.',
  ogTitle: 'Notes',
  ogDescription: 'Fragments from code, play, tools, and life: short observations, task lists, links, and saved ideas.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="content-page">
    <section class="page-hero compact">
      <p class="eyebrow">Field Notes</p>
      <h1>FRAGMENTS FROM <br> CODE,PLAY,TOOLS,AND LIFE.</h1>
      <p>Small entries for debugging results, game logs, anime impressions, tool finds, links, lists, and questions
        still taking shape.</p>
    </section>

    <div class="notes-grid">
      <NuxtLink v-for="note in notes" :key="note.path" class="post-card" :to="note.path">
        <article>
          <p class="article-meta">{{ formatDate(note.date) }} / {{ note.category }}</p>
          <h2>{{ note.title }}</h2>
          <p>{{ note.description }}</p>
          <div class="tag-row">
            <span v-for="tag in note.tags" :key="tag">#{{ tag }}</span>
          </div>
        </article>
      </NuxtLink>
    </div>
  </div>
</template>
