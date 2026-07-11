<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site-header">
      <NuxtLink class="brand" to="/" aria-label="maojl home">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-prompt">&gt;_</span>
        </span>
        <span class="brand-separator" aria-hidden="true" />
        <span class="brand-copy">
          <span class="brand-name">MAOJL.XYZ</span>
          <span class="brand-path">When in doubt, grep it.</span>
        </span>
      </NuxtLink>

      <nav class="main-nav" aria-label="Primary navigation">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/about">About</NuxtLink>
        <NuxtLink to="/blog">Blog</NuxtLink>
        <NuxtLink to="/notes">Notes</NuxtLink>
        <NuxtLink to="/releases">Releases</NuxtLink>
        <NuxtLink to="/archive">Archive</NuxtLink>
        <NuxtLink to="/search">Search</NuxtLink>
      </nav>
    </header>

    <main id="main-content" class="main-surface" tabindex="-1">
      <slot />
    </main>

    <footer class="site-footer">
      <div>
        <p class="terminal-line">$ echo "collect what matters, write it down"</p>
        <p class="footer-note">Code, games, tools, media, and notes from everyday side quests.</p>
      </div>
      <nav class="footer-links" aria-label="Footer navigation">
        <NuxtLink to="/blog">Read latest</NuxtLink>
        <a href="/rss.xml" type="application/rss+xml">RSS feed</a>
      </nav>
    </footer>
  </div>
</template>
