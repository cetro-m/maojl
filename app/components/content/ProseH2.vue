<script setup lang="ts">
defineProps<{
  id?: string
}>()
</script>

<template>
  <h2 :id="id" class="prose-heading">
    <a v-if="id" class="prose-anchor" :href="`#${id}`" aria-label="Link to section">#</a>
    <slot />
  </h2>
</template>
