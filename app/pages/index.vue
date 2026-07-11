<script setup lang="ts">
const { data: posts } = await useAsyncData('home:blog-posts', () =>
  queryPublishedEntries('blog')
    .limit(6)
    .all(),
)

const featuredPost = computed(() => posts.value?.find((post) => post.featured) ?? posts.value?.[0])
const recentPosts = computed(() => posts.value?.filter((post) => post.path !== featuredPost.value?.path).slice(0, 4) ?? [])

defineOgImage('BlogTakumi', {
  title: "MAOJL'S LOG",
  description: 'Code, play, tools, and thoughts worth keeping.',
})

useSeoMeta({
  title: "MAOJL'S LOG",
  description: 'A searchable personal logbook for code notes, game records, anime impressions, useful tools, task lists, and everyday thoughts.',
  ogTitle: "MAOJL'S LOG",
  ogDescription: 'Code notes, game records, anime impressions, useful tools, task lists, and everyday thoughts from maojl.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="page-stack">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="eyebrow">MAOJL'S LOG</p>
        <h1>A LOGBOOK FOR CODE, PLAY, TOOLS, AND THOUGHTS.</h1>
        <p class="hero-text">
          Development notes, game records, anime impressions, useful tools, and whatever else seems worth writing down.
        </p>
        <div class="hero-actions">
          <NuxtLink class="button button-primary" to="/blog">Read Blog</NuxtLink>
          <NuxtLink class="button button-secondary" to="/search">Search Something</NuxtLink>
        </div>
      </div>

      <div class="terminal-card" aria-label="Site status">
        <div class="terminal-topbar">
          <span />
          <span />
          <span />
          <strong>journal://maojl</strong>
        </div>
        <pre><code>$ tail -f ./daily.log
status: writing things down
scope: code / play / media / tools
mode: curious by default
output: notes, logs, thoughts</code></pre>
      </div>
    </section>

    <section v-if="featuredPost" class="feature-band">
      <div class="section-heading">
        <p class="eyebrow">FEATURED</p>
        <h2>CURRENTLY EXPLORING</h2>
      </div>

      <NuxtLink class="featured-link" :to="featuredPost.path">
        <article class="featured-card">
          <div>
            <p class="article-meta">{{ formatDate(featuredPost.date) }} / {{ featuredPost.category }}</p>
            <h3>{{ featuredPost.title }}</h3>
            <p>{{ featuredPost.description }}</p>
          </div>
          <span class="read-more">Read article</span>
        </article>
      </NuxtLink>
    </section>

    <section class="bento-section">
      <div class="section-heading">
        <p class="eyebrow">RECENT LOGS</p>
        <h2>LATEST ENTRIES</h2>
      </div>

      <div class="post-grid">
        <NuxtLink v-for="post in recentPosts" :key="post.path" class="post-card" :to="post.path">
          <article>
            <p class="article-meta">{{ formatDate(post.date) }} / {{ post.category }}</p>
            <h3>{{ post.title }}</h3>
            <p>{{ post.description }}</p>
            <div class="tag-row">
              <span v-for="tag in post.tags" :key="tag"><span class="tag-hash" aria-hidden="true">#</span>{{ tag }}</span>
            </div>
          </article>
        </NuxtLink>
      </div>
      <div v-if="!posts?.length" class="empty-state">
        <p class="sidebar-title">No published entries</p>
        <p>The first article will appear here after it is published.</p>
      </div>
    </section>
  </div>
</template>
