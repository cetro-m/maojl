<script setup lang="ts">
useSeoMeta({
  title: 'About',
  description: 'About maojl and the digital lab journal.',
})
</script>

<template>
  <div class="content-page">
    <section class="page-hero compact">
      <p class="eyebrow">About</p>
      <h1>A small digital lab for reusable engineering judgment.</h1>
      <p>
        This site keeps long-form articles, short build notes, and interface experiments in one inspectable place.
      </p>
    </section>

    <section class="about-layout">
      <div class="about-panel about-panel-primary">
        <p class="sidebar-title">Profile</p>
        <h2>maojl</h2>
        <p>
          Frontend and systems notes, written as working memory: decisions, tradeoffs, patterns, and the details
          that become useful again later.
        </p>
      </div>

      <div class="about-panel terminal-panel">
        <div class="terminal-topbar">
          <span />
          <span />
          <span />
          <strong>about://signal</strong>
        </div>
        <pre><code>$ whoami
maojl

$ focus --list
frontend craft
nuxt content
design systems
ai-assisted engineering

$ output
articles + notes + reusable patterns</code></pre>
      </div>

      <div class="about-panel">
        <p class="sidebar-title">Writing map</p>
        <ul class="signal-list">
          <li>
            <span>Articles</span>
            <strong>Long-form decisions and system notes.</strong>
          </li>
          <li>
            <span>Notes</span>
            <strong>Short build logs and observations.</strong>
          </li>
          <li>
            <span>Archive</span>
            <strong>A chronological trail for every published entry.</strong>
          </li>
        </ul>
      </div>

      <div class="about-panel">
        <p class="sidebar-title">Colophon</p>
        <ul class="signal-list">
          <li>
            <span>Stack</span>
            <strong>Nuxt 4, Nuxt Content, Nuxt SEO.</strong>
          </li>
          <li>
            <span>Visual system</span>
            <strong>Pixel terminal, CRT grid, hard borders.</strong>
          </li>
          <li>
            <span>Publishing mode</span>
            <strong>Small entries, searchable metadata, stable routes.</strong>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
