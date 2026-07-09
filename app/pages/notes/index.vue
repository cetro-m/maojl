<script setup lang="ts">
const { data: notes } = await useAsyncData('notes:index', () =>
  queryCollection('notes')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all(),
)

useSeoMeta({
  title: 'Notes',
  description: 'Short observations, experiment logs, and workbench notes.',
})
</script>

<template>
  <div class="content-page">
    <section class="page-hero compact">
      <p class="eyebrow">Field Notes</p>
      <h1>Signals before they become essays.</h1>
      <p>Short notes keep the bench warm: a debugging result, a design observation, or a question still fermenting.</p>
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
