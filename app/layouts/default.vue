<template>
  <div class="site-shell">
    <header class="site-header">
      <NuxtLink class="brand" to="/" aria-label="maojl home">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-pixels">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span class="brand-prompt">&gt;_</span>
        </span>
        <span class="brand-separator" aria-hidden="true" />
        <span class="brand-copy">
          <span class="brand-name">MAOJL.XYZ</span>
          <span class="brand-path">~/idea</span>
        </span>
      </NuxtLink>

      <nav class="main-nav" aria-label="Primary navigation">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/blog">Blog</NuxtLink>
        <NuxtLink to="/notes">Notes</NuxtLink>
        <NuxtLink to="/about">About</NuxtLink>
        <NuxtLink to="/archive">Archive</NuxtLink>
        <NuxtLink to="/search">Search</NuxtLink>
      </nav>
    </header>

    <main class="main-surface">
      <slot />
    </main>

    <footer class="site-footer">
      <div>
        <p class="terminal-line">$ echo "build quietly, write clearly"</p>
        <p class="footer-note">Personal systems, interface craft, and field notes.</p>
      </div>
      <NuxtLink to="/blog">Read latest</NuxtLink>
    </footer>
  </div>
</template>
