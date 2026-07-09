<template>
  <div class="site-shell">
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
        <NuxtLink to="/archive">Archive</NuxtLink>
        <NuxtLink to="/search">Search</NuxtLink>
      </nav>
    </header>

    <main class="main-surface">
      <slot />
    </main>

    <footer class="site-footer">
      <div>
        <p class="terminal-line">$ echo "collect what matters, write it down"</p>
        <p class="footer-note">Code, games, tools, media, and notes from everyday side quests.</p>
      </div>
      <NuxtLink to="/blog">READ LATEST</NuxtLink>
    </footer>
  </div>
</template>
