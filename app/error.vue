<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}>()

const statusCode = computed(() => props.error.statusCode ?? 500)
const isNotFound = computed(() => statusCode.value === 404)
const title = computed(() => isNotFound.value ? 'Signal not found' : 'System fault')
const description = computed(() => isNotFound.value
  ? 'The requested path does not exist or has moved.'
  : 'The page could not be rendered. Return home and try again.')

useSeoMeta({
  title: () => `${statusCode.value} — ${title.value}`,
  description,
  robots: 'noindex, nofollow',
})

function returnHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="error-page">
    <section class="error-panel" aria-labelledby="error-title">
      <p class="eyebrow">HTTP {{ statusCode }}</p>
      <p class="error-code" aria-hidden="true">{{ statusCode }}</p>
      <h1 id="error-title">{{ title }}</h1>
      <p>{{ description }}</p>
      <div class="error-actions">
        <button class="button button-primary" type="button" @click="returnHome">Return home</button>
        <a class="button button-secondary" href="/search">Search the logbook</a>
      </div>
      <p class="error-terminal">$ cd /home &amp;&amp; retry</p>
    </section>
  </main>
</template>
