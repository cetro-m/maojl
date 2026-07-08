<script setup lang="ts">
const { data: posts } = await useAsyncData('home:blog-posts', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .limit(6)
    .all(),
)

const featuredPost = computed(() => posts.value?.find((post) => post.featured) ?? posts.value?.[0])
const recentPosts = computed(() => posts.value?.filter((post) => post.path !== featuredPost.value?.path).slice(0, 4) ?? [])

useSeoMeta({
  title: 'Digital Lab Journal',
  description: 'A personal digital lab for engineering notes, interface craft, and system thinking.',
})
</script>

<template>
  <div class="page-stack">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="eyebrow">Digital Lab Journal</p>
        <h1>Reusable thinking from daily engineering work.</h1>
        <p class="hero-text">
          Notes on system design, frontend craft, AI tooling, and the small decisions that become reusable judgment.
        </p>
        <div class="hero-actions">
          <NuxtLink class="button button-primary" to="/blog">Read articles</NuxtLink>
          <NuxtLink class="button button-secondary" to="/search">Search notes</NuxtLink>
        </div>
      </div>

      <div class="terminal-card" aria-label="Site status">
        <div class="terminal-topbar">
          <span />
          <span />
          <span />
          <strong>journal://maojl</strong>
        </div>
        <pre><code>$ query latest --scope thinking
status: collecting signals
mode: build in public
stack: nuxt + content
output: essays, notes, artifacts</code></pre>
      </div>
    </section>

    <section v-if="featuredPost" class="feature-band">
      <div class="section-heading">
        <p class="eyebrow">Featured</p>
        <h2>Current thread</h2>
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
        <p class="eyebrow">Recent Dispatches</p>
        <h2>Recently written</h2>
      </div>

      <div class="post-grid">
        <NuxtLink v-for="post in recentPosts" :key="post.path" class="post-card" :to="post.path">
          <article>
            <p class="article-meta">{{ formatDate(post.date) }} / {{ post.category }}</p>
            <h3>{{ post.title }}</h3>
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
