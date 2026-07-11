<script setup lang="ts">
defineOgImage('BlogTakumi', {
  title: 'About maojl',
  description: 'A small digital base for code, play, tools, and thoughts.',
})

useSeoMeta({
  title: 'About maojl',
  description: 'About maojl, a personal logbook for things built, played, watched, tested, and saved for later.',
  ogTitle: 'About maojl',
  ogDescription: 'A small digital base for code, games, anime, tools, notes, and personal systems.',
  ogType: 'profile',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="content-page">
    <section class="page-hero compact">
      <p class="eyebrow">About Me</p>
      <h1>A SMALL DIGITAL BASE FOR <br> CODE, PLAY, TOOLS, AND THOUGHTS.</h1>
      <p>
        This site keeps development notes, game logs, useful tools, and everyday discoveries in one searchable place.
      </p>
    </section>

    <section class="about-layout">
      <div class="about-panel about-panel-primary">
        <figure class="about-visual">
          <img src="/images/about-pixel-art.jpg" alt="Pixel art trio of wandering samurai" width="423" height="237"
            loading="lazy" decoding="async">
        </figure>
        <p class="sidebar-title">Profile</p>
        <h2>maojl</h2>
        <p>
          A personal logbook for things I build, play, watch, test, and keep thinking about: code, games, anime, tools,
          and notes that may become useful again later.
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

$ interests --list
frontend craft
games
anime
useful tools
personal systems

$ output
articles + notes + logs + lists</code></pre>
      </div>

      <div class="about-panel">
        <p class="sidebar-title">Writing map</p>
        <ul class="signal-list">
          <li>
            <span>BLOG</span>
            <strong>Longer posts about development, tools, games, anime, and thoughts.</strong>
          </li>
          <li>
            <span>NOTES</span>
            <strong>Short observations, fixes, links, lists, and things worth saving.</strong>
          </li>
          <li>
            <span>ARCHIVE</span>
            <strong>A chronological trail for everything published here.</strong>
          </li>
        </ul>
      </div>

      <div class="about-panel">
        <p class="sidebar-title">SKILL TREE</p>
        <ul class="signal-list">
          <li>
            <span>FRONTEND</span>
            <strong>Web interfaces, UI systems, and content sites.</strong>
          </li>
          <li>
            <span>BACKEND</span>
            <strong>API, ERP, CMS, DB, and automation.</strong>
          </li>
          <li>
            <span>SERVER</span>
            <strong>Linux, Nginx, deployment, CDN, and reliability.</strong>
          </li>
          <li>
            <span>WORKFLOW</span>
            <strong>Git, scripts, package tools, and AI-assisted work.</strong>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
