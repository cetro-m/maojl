<script setup lang="ts">
defineProps<{
  id?: string
}>()
</script>

<template>
  <div class="prose-heading">
    <h2 :id="id"><slot /></h2>
    <a v-if="id" class="prose-anchor" :href="`#${id}`" :aria-label="`Link to ${id.replaceAll('-', ' ')}`">#</a>
  </div>
</template>
